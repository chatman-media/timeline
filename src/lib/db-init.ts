import { DBSchema, IDBPDatabase, openDB } from "idb"

import {
  CRITICAL_ACTIONS,
  StateContext,
  StorableStateContext,
  TEMPORARY_ACTIONS,
  TEMPORARY_FIELDS,
  // Убрали TEMPORARY_ACTIONS, т.к. логика теперь основана на сравнении состояний
} from "./state-types"

let dbPromise: Promise<IDBPDatabase<TimelineDB>> | null = null
// Экспортируем lastSavedState для использования в beforeunload
export let lastSavedState: StateContext | null = null // Последнее успешно сохраненное состояние
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null

// --- Интервалы и Debounce ---
const TIME_SAVE_INTERVAL = 5000 // 5 секунд для сохранения времени и других незначащих полей
const SAVE_INTERVAL = 10000 // 10 секунд обычный интервал сохранения для значимых изменений
const SAVE_DEBOUNCE_TIME = 2000 // 2 секунды (обычный debounce)
const CRITICAL_SAVE_DEBOUNCE_TIME = 500 // 0.5 секунды для критических действий
// Убрали MIN_SAVE_INTERVAL
let lastSaveTimestamp = 0

// Поля, изменение которых НЕ считается "значительным" для создания точки истории или для срабатывания SAVE_INTERVAL
const NON_SIGNIFICANT_FIELDS_FOR_HISTORY = new Set<keyof StateContext>([
  "currentTime",
  "volume",
  "scale",
  "trackVolumes",
  "isPlaying", // UI состояние
  "isSeeking", // UI состояние
  "isDirty", // UI флаг
  "isLoading", // UI состояние
  "hasFetched", // UI состояние
  "videoRefs", // Всегда исключается при сохранении
  "isChangingCamera", // Всегда исключается
])

interface TimelineDB extends DBSchema {
  appState: {
    key: string
    value: StorableStateContext
  }
}

/**
 * Удаляет временные поля из состояния перед сохранением в хранилище
 * и конвертирует Set в Array.
 * ЭКСПОРТИРУЕТСЯ для использования в root-store.ts
 */
export function cleanStateForStorage(state: StateContext): StorableStateContext {
  // Создаем копию, чтобы не мутировать оригинал
  const storableState: Partial<StateContext> = { ...state }

  // Удаляем все временные поля, определенные в state-types
  for (const key of TEMPORARY_FIELDS) {
    // Убедимся, что currentTime не удаляется, если оно было в TEMPORARY_FIELDS ранее
    // (Хотя мы его убрали из TEMPORARY_FIELDS, эта проверка на всякий случай)
    // if (key === 'currentTime') continue;
    // Эта проверка больше не нужна, currentTime не в TEMPORARY_FIELDS

    delete storableState[key as keyof Partial<StateContext>]
  }

  // Формируем результат, соответствующий StorableStateContext
  const result = {
    ...storableState, // Включает currentTime, если оно не было удалено выше
    addedFiles: Array.from(state.addedFiles || []),
  } as StorableStateContext // Приводим тип к StorableStateContext

  // Важно: Убедиться, что все поля StorableStateContext присутствуют.
  // TypeScript статически проверит это, если типы заданы верно.
  // Omit<...> больше не нужен, так как удаление происходит по TEMPORARY_FIELDS.

  return result
}

/**
 * Сравнивает два *сохраняемых* состояния (после очистки).
 * ЭКСПОРТИРУЕТСЯ для использования в root-store.ts (опционально, если нужно сравнить именно сохраняемые части)
 */
export function areStatesEqual(state1: StateContext | null, state2: StateContext | null): boolean {
  if (state1 === state2) return true // Оптимизация: если это один и тот же объект
  if (!state1 || !state2) return state1 === state2 // Если одно null, равны только если оба null

  const cleanState1 = cleanStateForStorage(state1)
  const cleanState2 = cleanStateForStorage(state2)

  return JSON.stringify(cleanState1) === JSON.stringify(cleanState2)
}

/**
 * Сравнивает два состояния, игнорируя незначащие поля (currentTime, volume и т.д.).
 * Используется для определения, нужно ли создавать точку истории или использовать SAVE_INTERVAL.
 * ЭКСПОРТИРУЕТСЯ для использования в root-store.ts (для логики истории).
 */
export function areSignificantStatesEqual(
  state1: Partial<StateContext>,
  state2: Partial<StateContext>,
): boolean {
  if (!state1 || !state2) return state1 === state2

  // Проверяем активное видео
  if (state1.activeVideo?.id !== state2.activeVideo?.id) return false

  // Проверяем схему монтажа
  if (state1.montageSchema || state2.montageSchema) {
    const schema1 = state1.montageSchema || []
    const schema2 = state2.montageSchema || []
    if (schema1.length !== schema2.length) return false

    for (let i = 0; i < schema1.length; i++) {
      const seg1 = schema1[i]
      const seg2 = schema2[i]
      if (!seg1 || !seg2) return false
      if (
        seg1.id !== seg2.id ||
        seg1.startTime !== seg2.startTime ||
        seg1.endTime !== seg2.endTime ||
        JSON.stringify(seg1.sourceTrackIds) !== JSON.stringify(seg2.sourceTrackIds)
      ) {
        return false
      }
    }
  }

  // Проверяем треки
  if (state1.tracks || state2.tracks) {
    const tracks1 = state1.tracks || []
    const tracks2 = state2.tracks || []
    if (tracks1.length !== tracks2.length) return false

    for (let i = 0; i < tracks1.length; i++) {
      const track1 = tracks1[i]
      const track2 = tracks2[i]
      if (!track1 || !track2) return false
      if (
        track1.id !== track2.id ||
        track1.type !== track2.type ||
        track1.name !== track2.name ||
        JSON.stringify(track1.videos) !== JSON.stringify(track2.videos)
      ) {
        return false
      }
    }
  }

  // Проверяем медиафайлы
  if (state1.media || state2.media) {
    const media1 = state1.media || []
    const media2 = state2.media || []
    if (media1.length !== media2.length) return false

    for (let i = 0; i < media1.length; i++) {
      const file1 = media1[i]
      const file2 = media2[i]
      if (!file1 || !file2) return false
      if (
        file1.id !== file2.id ||
        file1.path !== file2.path ||
        file1.startTime !== file2.startTime ||
        file1.endTime !== file2.endTime
      ) {
        return false
      }
    }
  }

  // Проверяем другие значимые поля
  const significantFields: (keyof StateContext)[] = [
    "activeTrackId",
    "currentLayout",
    "addedFiles",
    "hasMedia",
    "layoutMode",
    "panelLayouts",
  ]

  for (const field of significantFields) {
    if (field === "addedFiles") {
      const files1 =
        state1[field] instanceof Set ? Array.from(state1[field] as Set<string>) : state1[field]
      const files2 =
        state2[field] instanceof Set ? Array.from(state2[field] as Set<string>) : state2[field]
      if (JSON.stringify(files1) !== JSON.stringify(files2)) return false
    } else if (JSON.stringify(state1[field]) !== JSON.stringify(state2[field])) {
      return false
    }
  }

  return true
}

/**
 * Определяет, нужно ли сохранять состояние, основываясь на типе изменений и интервалах.
 */
export function shouldSaveState(
  currentState: StateContext,
  lastSavedState: StateContext | null,
  actionType?: string,
): boolean {
  // Если состояние еще не сохранялось, сохраняем
  if (!lastSavedState) return true

  // Если это критическое действие, сохраняем
  if (actionType && CRITICAL_ACTIONS.has(actionType)) {
    // Для setCurrentTime используем более длинный интервал
    if (actionType === "setCurrentTime") {
      const now = Date.now()
      if (now - lastSaveTimestamp < TIME_SAVE_INTERVAL) {
        return false
      }
    }
    return true
  }

  // Если это временное действие, не сохраняем
  if (actionType && TEMPORARY_ACTIONS.has(actionType)) return false

  // Проверяем значимые изменения в схеме монтажа
  const montageSchemaChanged = !areSignificantStatesEqual(
    { montageSchema: currentState.montageSchema },
    { montageSchema: lastSavedState.montageSchema },
  )
  if (montageSchemaChanged) return true

  // Проверяем другие значимые изменения
  const hasSignificantChanges = !areSignificantStatesEqual(currentState, lastSavedState)
  if (!hasSignificantChanges) return false

  // Для всех остальных значимых изменений используем обычный интервал
  const now = Date.now()
  return now - lastSaveTimestamp >= SAVE_INTERVAL
}

/**
 * Инициализирует IndexedDB и загружает последнее состояние.
 */
export async function initializeDatabase(): Promise<StateContext | null> {
  console.log("[initializeDatabase] Starting...")
  if (!dbPromise) {
    console.log("[initializeDatabase] Creating DB promise...")
    dbPromise = openDB<TimelineDB>("timeline-db", 1, {
      upgrade(db) {
        console.log("[initializeDatabase] Upgrading DB...")
        if (!db.objectStoreNames.contains("appState")) {
          console.log("[initializeDatabase] Creating 'appState' object store.")
          db.createObjectStore("appState")
        } else {
          console.log("[initializeDatabase] 'appState' object store already exists.")
        }
      },
    })
  }

  try {
    console.log("[initializeDatabase] Awaiting DB promise...")
    const db = await dbPromise
    console.log("[initializeDatabase] DB connection established. Getting 'lastState'...")
    const storedState: StorableStateContext | undefined = await db.get("appState", "lastState")

    if (storedState) {
      console.log("[initializeDatabase] State loaded from DB, converting to StateContext...")
      // Преобразуем StorableStateContext в StateContext
      const stateContext: StateContext = {
        ...storedState,
        addedFiles: new Set(storedState.addedFiles || []),
        videoRefs: {},
        isSeeking: false,
        isChangingCamera: false,
        isPlaying: false,
        isDirty: false,
        isLoading: false,
        hasFetched: true,
        isRecordingSchema: false,
        currentRecordingSegmentId: null,
        metadataCache: {},
        thumbnailCache: {},
      }
      console.log("[initializeDatabase] State converted successfully")
      return stateContext
    }

    console.log("[initializeDatabase] No state found in DB")
    return null
  } catch (error) {
    console.error("[initializeDatabase] Error:", error)
    return null
  }
}

/**
 * Сохраняет состояние в IndexedDB с использованием debounce
 */
export function saveStateWithDebounce(
  newState: StateContext,
  actionType: string | undefined = undefined,
): void {
  if (!dbPromise) {
    console.error("Database not initialized. Cannot save state.")
    return
  }

  // Проверяем, нужно ли вообще инициировать сохранение
  if (!shouldSaveState(newState, lastSavedState, actionType)) {
    return // Не запускаем debounce, если сохранение не требуется по интервалам/изменениям
  }

  // Определяем время debounce в зависимости от критичности действия
  const isCritical = actionType && CRITICAL_ACTIONS.has(actionType)
  const debounceTime = isCritical ? CRITICAL_SAVE_DEBOUNCE_TIME : SAVE_DEBOUNCE_TIME

  // Перезапускаем таймер debounce
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId)
  }

  console.debug(
    `Scheduling save with debounce: ${debounceTime}ms${isCritical ? " (critical)" : ""}`,
  )
  saveTimeoutId = setTimeout(async () => {
    saveTimeoutId = null // Сбрасываем ID таймера сразу при выполнении
    if (!dbPromise) return

    // --- Повторная проверка перед фактическим сохранением ---
    // Сравниваем *текущее* состояние в момент выполнения setTimeout
    // с последним *успешно сохраненным*. Это важно, так как состояние могло
    // измениться или вернуться к сохраненному за время debounce.
    const currentStateAtSaveTime = newState // Используем состояние, переданное в функцию
    const cleanCurrentAtSave = cleanStateForStorage(currentStateAtSaveTime)
    const lastPersistedCleanState = lastSavedState ? cleanStateForStorage(lastSavedState) : null

    if (
      lastPersistedCleanState &&
      JSON.stringify(cleanCurrentAtSave) === JSON.stringify(lastPersistedCleanState)
    ) {
      console.log(
        "Skipping save inside timeout: state reverted or unchanged compared to last persisted state.",
      )
      return
    }
    // --- Конец повторной проверки ---

    try {
      const db = await dbPromise
      // Очищаем состояние *непосредственно* перед сохранением
      const stateToSave = cleanStateForStorage(currentStateAtSaveTime)

      console.log("Saving state to DB:", stateToSave)
      await db.put("appState", stateToSave, "lastState")

      // Обновляем lastSavedState *полным* состоянием, которое было передано
      // для сохранения (currentStateAtSaveTime)
      // Используем глубокое копирование
      lastSavedState = JSON.parse(JSON.stringify(currentStateAtSaveTime))
      lastSaveTimestamp = Date.now() // Обновляем время УСПЕШНОГО сохранения
      console.log("State saved successfully.")
    } catch (error) {
      console.error("Failed to save state:", error)
      // Не обновляем lastSavedState и lastSaveTimestamp в случае ошибки
    }
    // finally не нужен, т.к. сбросили saveTimeoutId в начале setTimeout
  }, debounceTime)
}

/**
 * Принудительно сохраняет текущее состояние немедленно,
 * обходя debounce и проверки интервалов.
 * Используется, например, при закрытии вкладки.
 */
export async function forceSaveState(state: StateContext): Promise<void> {
  // Отменяем любой ожидающий debounce
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId)
    saveTimeoutId = null
    console.log("Cancelled pending debounced save due to forceSaveState.")
  }
  if (!dbPromise) {
    console.error("Database not initialized. Cannot force save state.")
    return
  }

  // Сравниваем сохраняемую часть с последним *успешно сохраненным* состоянием
  const stateToSave = cleanStateForStorage(state)
  const lastPersistedCleanState = lastSavedState ? cleanStateForStorage(lastSavedState) : null

  if (
    !lastPersistedCleanState ||
    JSON.stringify(stateToSave) !== JSON.stringify(lastPersistedCleanState)
  ) {
    try {
      const db = await dbPromise
      console.log("Force saving state to DB:", stateToSave)
      await db.put("appState", stateToSave, "lastState")
      // Обновляем lastSavedState и timestamp после успешного сохранения
      lastSavedState = JSON.parse(JSON.stringify(state)) // Сохраняем полное состояние
      lastSaveTimestamp = Date.now()
      console.log("State force-saved successfully.")
    } catch (error) {
      console.error("Failed to force save state:", error)
    }
  } else {
    console.log("Skipping force save: state unchanged compared to last persisted state.")
  }
}
