import { DBSchema, IDBPDatabase, openDB } from "idb"

import {
  CRITICAL_ACTIONS,
  EditorState,
  StateContext,
  StorableEditorState,
  StorableStateContext,
  StorableTimelineState,
  TEMPORARY_ACTIONS,
  TEMPORARY_FIELDS,
  TimelineState,
  // Убрали TEMPORARY_ACTIONS, т.к. логика теперь основана на сравнении состояний
} from "./state-types"

let dbPromise: Promise<IDBPDatabase<TimelineDB>> | null = null
// Экспортируем lastSavedState для использования в beforeunload
export let lastSavedState: StateContext | null = null // Последнее успешно сохраненное состояние
export let lastSavedEditorState: EditorState | null = null // Последнее успешно сохраненное состояние редактора
export let lastSavedTimelineState: TimelineState | null = null // Последнее успешно сохраненное состояние таймлайна
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
  editorState: {
    key: string
    value: StorableEditorState
  }
  timelineState: {
    key: string
    value: StorableTimelineState
  }
}

/**
 * Отделяет редакторское состояние от полного состояния
 */
export function extractEditorState(state: StateContext): EditorState {
  const editorState: EditorState = {
    layoutMode: state.layoutMode,
    panelLayouts: state.panelLayouts,
    isLoading: state.isLoading,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    scale: state.scale,
    volume: state.volume,
    trackVolumes: state.trackVolumes,
    isSeeking: state.isSeeking,
    isChangingCamera: state.isChangingCamera,
    media: state.media,
    hasMedia: state.hasMedia,
    hasFetched: state.hasFetched,
    metadataCache: state.metadataCache,
    thumbnailCache: state.thumbnailCache,
    addedFiles: state.addedFiles,
    activeVideo: state.activeVideo,
    activeTrackId: state.activeTrackId,
    currentLayout: state.currentLayout,
    videoRefs: state.videoRefs,
  }
  return editorState
}

/**
 * Отделяет состояние таймлайна от полного состояния
 */
export function extractTimelineState(state: StateContext): TimelineState {
  const timelineState: TimelineState = {
    tracks: state.tracks,
    timeRanges: state.timeRanges,
    montageSchema: state.montageSchema,
    isRecordingSchema: state.isRecordingSchema,
    currentRecordingSegmentId: state.currentRecordingSegmentId,
    historySnapshotIds: state.historySnapshotIds,
    currentHistoryIndex: state.currentHistoryIndex,
    isDirty: state.isDirty,
    isSaved: state.isSaved,
  }
  return timelineState
}

/**
 * Удаляет временные поля из EditorState перед сохранением в хранилище
 * и конвертирует Set в Array.
 */
export function cleanEditorStateForStorage(state: EditorState): StorableEditorState {
  // Создаем копию, чтобы не мутировать оригинал
  const cleanState: Partial<EditorState> = { ...state }

  // Удаляем временные поля
  delete cleanState.videoRefs
  delete cleanState.metadataCache
  delete cleanState.thumbnailCache

  // Проверяем и очищаем массив media от DOM-элементов и циклических ссылок
  if (cleanState.media && Array.isArray(cleanState.media)) {
    cleanState.media = cleanState.media.map((file) => {
      // Создаем безопасную копию файла без DOM элементов
      const cleanFile = { ...file } as any

      // Удаляем поля, которые могут содержать DOM элементы
      if ("htmlElement" in cleanFile) delete cleanFile.htmlElement
      if ("videoElement" in cleanFile) delete cleanFile.videoElement
      if ("audioElement" in cleanFile) delete cleanFile.audioElement
      if ("waveformElement" in cleanFile) delete cleanFile.waveformElement

      // Удаляем все свойства, которые начинаются с "__react"
      Object.keys(cleanFile).forEach((key) => {
        if (key.startsWith("__react") || key.startsWith("_react")) {
          delete cleanFile[key]
        }
      })

      return cleanFile
    })
  }

  // Формируем результат
  const result = {
    ...cleanState,
    addedFiles: Array.from(state.addedFiles || []),
  } as StorableEditorState

  return result
}

/**
 * Удаляет временные поля из TimelineState перед сохранением
 */
export function cleanTimelineStateForStorage(state: TimelineState): StorableTimelineState {
  // Создаем копию, чтобы не мутировать оригинал
  const cleanState: Partial<TimelineState> = { ...state }

  // Удаляем временные поля
  delete cleanState.isDirty
  delete cleanState.isRecordingSchema
  delete cleanState.currentRecordingSegmentId

  return cleanState as StorableTimelineState
}

/**
 * Удаляет временные поля из состояния перед сохранением в хранилище
 * и конвертирует Set в Array.
 * ЭКСПОРТИРУЕТСЯ для использования в root-store.ts
 */
export function cleanStateForStorage(state: StateContext): StorableStateContext {
  const editorState = cleanEditorStateForStorage(extractEditorState(state))
  const timelineState = cleanTimelineStateForStorage(extractTimelineState(state))

  // Объединяем состояния
  return {
    ...editorState,
    ...timelineState,
  } as StorableStateContext
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
 * Инициализирует базу данных и загружает состояние
 */
export async function initializeDatabase(): Promise<StateContext | null> {
  console.log("[initializeDatabase] Starting...")
  if (!dbPromise) {
    console.log("[initializeDatabase] Creating DB promise...")
    dbPromise = openDB<TimelineDB>("timeline-db", 2, {
      upgrade(db, oldVersion, newVersion) {
        console.log("[initializeDatabase] Upgrading DB from", oldVersion, "to", newVersion)

        // Создаем хранилища объектов при необходимости
        if (!db.objectStoreNames.contains("appState")) {
          console.log("[initializeDatabase] Creating 'appState' object store (legacy).")
          db.createObjectStore("appState")
        }

        if (!db.objectStoreNames.contains("editorState")) {
          console.log("[initializeDatabase] Creating 'editorState' object store.")
          db.createObjectStore("editorState")
        }

        if (!db.objectStoreNames.contains("timelineState")) {
          console.log("[initializeDatabase] Creating 'timelineState' object store.")
          db.createObjectStore("timelineState")
        }
      },
    })
  }

  try {
    console.log("[initializeDatabase] Awaiting DB promise...")
    const db = await dbPromise

    // Сначала пробуем загрузить из раздельных хранилищ
    const storedEditorState: StorableEditorState | undefined = await db.get(
      "editorState",
      "lastState",
    )
    const storedTimelineState: StorableTimelineState | undefined = await db.get(
      "timelineState",
      "lastState",
    )

    // Если одно из них существует, используем его
    if (storedEditorState || storedTimelineState) {
      console.log("[initializeDatabase] Found separated states in DB")

      // Логирование для отладки
      if (storedEditorState) {
        console.log("[initializeDatabase] EditorState info:", {
          mediaCount: storedEditorState.media?.length || 0,
          hasAddedFiles: (storedEditorState.addedFiles?.length || 0) > 0,
          layoutMode: storedEditorState.layoutMode,
        })
      }

      if (storedTimelineState) {
        console.log("[initializeDatabase] TimelineState info:", {
          tracksCount: storedTimelineState.tracks?.length || 0,
          historySnapshotIds: storedTimelineState.historySnapshotIds?.length || 0,
        })
      }

      // Создаем полное состояние, объединяя загруженные части или используя дефолтные значения
      const stateContext: StateContext = {
        // EditorState с дефолтными значениями для отсутствующих полей
        layoutMode: storedEditorState?.layoutMode || "default",
        panelLayouts: storedEditorState?.panelLayouts || {},
        isLoading: false,
        isPlaying: false,
        currentTime: storedEditorState?.currentTime || 0,
        scale: storedEditorState?.scale || 1,
        volume: storedEditorState?.volume || 1,
        trackVolumes: storedEditorState?.trackVolumes || {},
        isSeeking: false,
        isChangingCamera: false,
        media: storedEditorState?.media || [],
        hasMedia: storedEditorState?.hasMedia || false,
        hasFetched: storedEditorState?.hasFetched || false,
        metadataCache: {},
        thumbnailCache: {},
        addedFiles: new Set(storedEditorState?.addedFiles || []),
        activeVideo: storedEditorState?.activeVideo || null,
        activeTrackId: storedEditorState?.activeTrackId || null,
        currentLayout: storedEditorState?.currentLayout || { type: "1x1", activeTracks: [] },
        videoRefs: {},

        // TimelineState с дефолтными значениями для отсутствующих полей
        tracks: storedTimelineState?.tracks || [],
        timeRanges: storedTimelineState?.timeRanges || {},
        montageSchema: storedTimelineState?.montageSchema || [],
        isRecordingSchema: false,
        currentRecordingSegmentId: null,
        historySnapshotIds: storedTimelineState?.historySnapshotIds || [],
        currentHistoryIndex: storedTimelineState?.currentHistoryIndex || -1,
        isDirty: false,
        isSaved: storedTimelineState?.isSaved || true,
      }

      console.log("[initializeDatabase] State combined successfully")

      // Сохраняем загруженное состояние
      lastSavedState = JSON.parse(JSON.stringify(stateContext))
      lastSavedEditorState = extractEditorState(stateContext)
      lastSavedTimelineState = extractTimelineState(stateContext)

      return stateContext
    }

    // Если разделенных состояний нет, пробуем загрузить из appState (для обратной совместимости)
    console.log("[initializeDatabase] No separated states found, trying legacy appState...")
    const storedState: StorableStateContext | undefined = await db.get("appState", "lastState")

    if (storedState) {
      console.log("[initializeDatabase] Legacy state loaded from DB, converting to StateContext...")
      console.log("[initializeDatabase] Loaded state info:", {
        mediaCount: storedState.media?.length || 0,
        tracksCount: storedState.tracks?.length || 0,
        hasAddedFiles: (storedState.addedFiles?.length || 0) > 0,
      })

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
      console.log("[initializeDatabase] Legacy state converted successfully")

      // Сохраняем загруженное состояние
      lastSavedState = JSON.parse(JSON.stringify(stateContext))
      lastSavedEditorState = extractEditorState(stateContext)
      lastSavedTimelineState = extractTimelineState(stateContext)

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
    console.log("[forceSaveState] Cancelled pending debounced save")
  }
  if (!dbPromise) {
    console.error("[forceSaveState] Database not initialized. Cannot force save state.")
    return
  }

  try {
    const db = await dbPromise
    console.log("[forceSaveState] Connected to DB, saving states")

    // Получаем копию текущего состояния (сразу очищенную от проблемных полей)
    const cleanedStateCopy = cleanStateForStorage(state)

    // Разделяем состояние на части
    const editorState = extractEditorState(state)
    const timelineState = extractTimelineState(state)

    // Очищаем состояния для хранения
    const cleanedEditorState = cleanEditorStateForStorage(editorState)
    const cleanedTimelineState = cleanTimelineStateForStorage(timelineState)

    // Сохраняем EditorState
    if (!lastSavedEditorState || !areEditorStatesEqual(editorState, lastSavedEditorState)) {
      console.log("[forceSaveState] Saving EditorState")
      await db.put("editorState", cleanedEditorState, "lastState")
      try {
        // Создаем безопасную копию для сравнения
        lastSavedEditorState = {
          ...cleanedEditorState,
          addedFiles: new Set<string>(
            Array.isArray(cleanedEditorState.addedFiles) ? cleanedEditorState.addedFiles : [],
          ),
          metadataCache: {},
          thumbnailCache: {},
          videoRefs: {},
        } as EditorState
      } catch (error) {
        console.error("[forceSaveState] Cannot create EditorState reference:", error)
        lastSavedEditorState = null
      }
    } else {
      console.log("[forceSaveState] Skipping EditorState save - unchanged")
    }

    // Сохраняем TimelineState только если есть треки
    if (timelineState.tracks && timelineState.tracks.length > 0) {
      if (
        !lastSavedTimelineState ||
        !areTimelineStatesEqual(timelineState, lastSavedTimelineState)
      ) {
        console.log(
          "[forceSaveState] Saving TimelineState with",
          timelineState.tracks.length,
          "tracks",
        )
        await db.put("timelineState", cleanedTimelineState, "lastState")
        try {
          lastSavedTimelineState = {
            ...cleanedTimelineState,
            montageSchema: timelineState.montageSchema || [],
            isRecordingSchema: false,
            currentRecordingSegmentId: null,
            isDirty: false,
          } as TimelineState
        } catch (error) {
          console.error("[forceSaveState] Cannot create TimelineState reference:", error)
          lastSavedTimelineState = null
        }
      } else {
        console.log("[forceSaveState] Skipping TimelineState save - unchanged")
      }
    }

    // Обновляем общее сохраненное состояние - используем очищенную копию
    lastSavedState = cleanedStateCopy as unknown as StateContext
    lastSaveTimestamp = Date.now()
    console.log("[forceSaveState] States saved successfully")
  } catch (error) {
    console.error("[forceSaveState] Failed to save state:", error)
  }
}

/**
 * Сравнивает два EditorState для определения необходимости сохранения
 */
export function areEditorStatesEqual(state1: EditorState, state2: EditorState): boolean {
  try {
    // Игнорируем videoRefs, metadataCache, thumbnailCache
    const cleanState1 = cleanEditorStateForStorage(state1)
    const cleanState2 = cleanEditorStateForStorage(state2)

    return JSON.stringify(cleanState1) === JSON.stringify(cleanState2)
  } catch (error) {
    console.error("[areEditorStatesEqual] Error comparing states:", error)
    // Возвращаем false, чтобы сохранить состояние при ошибке сравнения
    return false
  }
}

/**
 * Сравнивает два TimelineState для определения необходимости сохранения
 */
export function areTimelineStatesEqual(state1: TimelineState, state2: TimelineState): boolean {
  // Игнорируем временные поля
  const cleanState1 = cleanTimelineStateForStorage(state1)
  const cleanState2 = cleanTimelineStateForStorage(state2)

  return JSON.stringify(cleanState1) === JSON.stringify(cleanState2)
}
