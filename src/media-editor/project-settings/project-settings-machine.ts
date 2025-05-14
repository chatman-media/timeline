import { assign, createMachine } from "xstate"

import {
  ASPECT_RATIOS,
  type AspectRatio,
  type ColorSpace,
  DEFAULT_PROJECT_SETTINGS,
  type FrameRate,
  getResolutionsForAspectRatio as getBaseResolutionsForAspectRatio,
  type ProjectSettings,
  type Resolution,
  type ResolutionOption,
  RESOLUTIONS_1_1,
  RESOLUTIONS_4_3,
  RESOLUTIONS_4_5,
  RESOLUTIONS_9_16,
  RESOLUTIONS_16_9,
  RESOLUTIONS_21_9,
} from "@/types/project"

// Реэкспортируем константу с соотношениями сторон
export { ASPECT_RATIOS }

// Создаем более эффективную структуру данных для соотношений сторон
// Объект с ключами по соотношению сторон для быстрого доступа
export const ASPECT_RATIO_MAP: Record<string, AspectRatio> = {}

// Заполняем объект данными из оригинального массива
ASPECT_RATIOS.forEach((ratio) => {
  ASPECT_RATIO_MAP[ratio.label] = ratio
})

// Выводим в консоль для отладки
console.log("[ProjectSettingsMachine] ASPECT_RATIO_MAP:", Object.keys(ASPECT_RATIO_MAP))

// Создаем массив ключей для итерации
export const ASPECT_RATIO_KEYS = Object.keys(ASPECT_RATIO_MAP)

// Используем константы разрешений, импортированные из @/types/project

// Создаем более эффективную структуру данных для разрешений
// Объект с ключами по соотношению сторон для быстрого доступа к разрешениям
export const RESOLUTIONS_MAP: Record<string, ResolutionOption[]> = {
  "16:9": RESOLUTIONS_16_9,
  "9:16": RESOLUTIONS_9_16,
  "1:1": RESOLUTIONS_1_1,
  "4:3": RESOLUTIONS_4_3,
  "4:5": RESOLUTIONS_4_5,
  "21:9": RESOLUTIONS_21_9,
}

// Объект с рекомендуемыми разрешениями для каждого соотношения сторон
export const RECOMMENDED_RESOLUTIONS: Record<string, string> = {
  "16:9": "1920x1080",
  "9:16": "1080x1920",
  "1:1": "1080x1080",
  "4:3": "1440x1080",
  "4:5": "1024x1280",
  "21:9": "2560x1080",
}

// Функция для получения разрешений для конкретного соотношения сторон
// с дополнительной логикой для добавления текущего разрешения
export function getResolutionsForAspectRatio(aspectRatioLabel: string): ResolutionOption[] {
  console.log(
    "[ProjectSettingsMachine] Получение разрешений для соотношения сторон:",
    aspectRatioLabel,
  )

  // Нормализуем ключ соотношения сторон (удаляем пробелы)
  const normalizedKey = aspectRatioLabel ? aspectRatioLabel.trim() : "16:9"

  // Получаем разрешения из базовой функции
  const resolutions = [...getBaseResolutionsForAspectRatio(normalizedKey)]

  // Добавляем текущее разрешение в список доступных, если оно соответствует соотношению сторон
  // Это нужно для случаев, когда разрешение было установлено программно и не входит в стандартный список
  const savedSettings = loadSavedSettings()
  if (savedSettings && savedSettings.resolution) {
    const resolution = savedSettings.resolution
    const resolutionParts = resolution.split("x")
    if (resolutionParts.length === 2) {
      const width = parseInt(resolutionParts[0], 10)
      const height = parseInt(resolutionParts[1], 10)

      // Проверяем, что разрешение корректное
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        // Проверяем, есть ли такое разрешение в списке
        const exists = resolutions.some((res) => res.value === resolution)
        if (!exists) {
          console.log(
            "[ProjectSettingsMachine] Добавляем текущее разрешение в список доступных:",
            resolution,
          )
          // Добавляем текущее разрешение в список доступных
          resolutions.push({
            value: resolution,
            label: `${resolution} (Текущее)`,
            width,
            height,
          })
        }
      }
    }
  }

  console.log(
    "[ProjectSettingsMachine] Итоговый список разрешений:",
    resolutions.map((r) => r.value),
  )
  return resolutions
}

// Функция для получения рекомендуемого разрешения для соотношения сторон
// Эта функция используется при изменении соотношения сторон в диалоге настроек проекта
// Она возвращает разрешение по умолчанию для выбранного соотношения сторон (обычно Full HD или эквивалент)
export function getDefaultResolutionForAspectRatio(aspectRatioLabel: string): ResolutionOption {
  console.log(
    "[ProjectSettingsMachine] Получение рекомендуемого разрешения для соотношения сторон:",
    aspectRatioLabel,
  )

  // Проверяем, есть ли соотношение сторон в ASPECT_RATIO_MAP
  if (!aspectRatioLabel || !ASPECT_RATIO_MAP[aspectRatioLabel]) {
    console.log(
      "[ProjectSettingsMachine] Соотношение сторон не найдено, используем 16:9 по умолчанию",
    )
    aspectRatioLabel = "16:9"
  }

  // Получаем разрешения для выбранного соотношения сторон
  const resolutions = getResolutionsForAspectRatio(aspectRatioLabel)
  console.log("[ProjectSettingsMachine] Доступные разрешения:", resolutions)

  // Проверяем, есть ли разрешения для выбранного соотношения сторон
  if (!resolutions || resolutions.length === 0) {
    console.log("[ProjectSettingsMachine] Разрешения не найдены, используем разрешения для 16:9")
    return RESOLUTIONS_16_9[1] // Возвращаем Full HD для 16:9
  }

  // Определяем рекомендуемое разрешение в зависимости от соотношения сторон
  let recommendedResolution: ResolutionOption

  // Получаем рекомендуемое разрешение для текущего соотношения сторон
  const recommendedValue = RECOMMENDED_RESOLUTIONS[aspectRatioLabel]

  // Ищем рекомендуемое разрешение в списке доступных
  const foundResolution = recommendedValue
    ? resolutions.find((res: ResolutionOption) => res.value === recommendedValue)
    : undefined

  // Если рекомендуемое разрешение найдено, используем его
  // Иначе используем второе разрешение в списке (обычно Full HD или эквивалент)
  // Если в списке только одно разрешение, возвращаем его
  recommendedResolution =
    foundResolution || (resolutions.length > 1 ? resolutions[1] : resolutions[0])

  console.log("[ProjectSettingsMachine] Рекомендуемое разрешение:", recommendedResolution)

  return recommendedResolution
}

// Функция для определения соотношения сторон по ширине и высоте
export function getAspectRatioByDimensions(width: number, height: number): AspectRatio {
  console.log("[ProjectSettingsMachine] getAspectRatioByDimensions:", { width, height })

  if (!width || !height) {
    console.log("[ProjectSettingsMachine] Недопустимые размеры, используем 16:9 по умолчанию")
    return ASPECT_RATIO_MAP["16:9"] // По умолчанию 16:9
  }

  // Проверяем стандартные соотношения сторон с небольшой погрешностью
  const ratio = width / height
  console.log("[ProjectSettingsMachine] Соотношение сторон:", ratio)

  // Создаем объект с соотношениями сторон и их числовыми значениями
  const ratioValues = {
    "16:9": 16 / 9,
    "9:16": 9 / 16,
    "1:1": 1,
    "4:3": 4 / 3,
    "4:5": 4 / 5,
    "21:9": 21 / 9,
  }

  console.log("[ProjectSettingsMachine] Доступные соотношения сторон:", ratioValues)

  // Находим ближайшее соотношение сторон
  let closestRatio = "custom"
  let minDiff = 0.05 // Максимально допустимая погрешность

  // Проверяем точные совпадения для стандартных разрешений
  // Это нужно для случаев, когда разрешение точно соответствует стандартному
  for (const aspectRatio of ASPECT_RATIOS) {
    if (
      aspectRatio.label !== "custom" &&
      aspectRatio.value.width === width &&
      aspectRatio.value.height === height
    ) {
      console.log("[ProjectSettingsMachine] Найдено точное совпадение:", aspectRatio.label)
      return aspectRatio
    }
  }

  // Если точного совпадения нет, ищем ближайшее соотношение сторон
  for (const [ratioKey, ratioValue] of Object.entries(ratioValues)) {
    const diff = Math.abs(ratio - ratioValue)
    console.log("[ProjectSettingsMachine] Разница для", ratioKey, ":", diff)
    if (diff < minDiff) {
      minDiff = diff
      closestRatio = ratioKey
    }
  }

  // Если нашли подходящее соотношение сторон, возвращаем его
  if (closestRatio !== "custom") {
    console.log("[ProjectSettingsMachine] Найдено ближайшее соотношение сторон:", closestRatio)
    return ASPECT_RATIO_MAP[closestRatio]
  }

  console.log(
    "[ProjectSettingsMachine] Не найдено подходящее соотношение сторон, используем custom",
  )
  // Если не соответствует стандартным, возвращаем пользовательское
  return ASPECT_RATIO_MAP["custom"]
}

// Ключ для хранения настроек проекта в localStorage
export const PROJECT_SETTINGS_STORAGE_KEY = "timeline-project-settings"

// Константа с доступными значениями FPS на основе типа FrameRate
export const FRAME_RATES: { value: FrameRate; label: string }[] = [
  { value: "23.97", label: "23.97 fps" },
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps" },
  { value: "29.97", label: "29.97 fps" },
  { value: "30", label: "30 fps" },
  { value: "50", label: "50 fps" },
  { value: "59.94", label: "59.94 fps" },
  { value: "60", label: "60 fps" },
]

// Создаем более эффективную структуру данных для FPS
export const FRAME_RATE_MAP: Partial<Record<FrameRate, { value: FrameRate; label: string }>> = {}
FRAME_RATES.forEach((fps) => {
  FRAME_RATE_MAP[fps.value] = fps
})

// Константа с доступными значениями цветовых пространств
export const COLOR_SPACES: { value: ColorSpace; label: string }[] = [
  { value: "sdr", label: "SDR - Rec.709" },
  { value: "dci-p3", label: "DCI-P3" },
  { value: "p3-d65", label: "P3-D65" },
  { value: "hdr-hlg", label: "HDR - Rec.2100HLG" },
  { value: "hdr-pq", label: "HDR - Rec.2100PQ" },
]

// Создаем более эффективную структуру данных для цветовых пространств
export const COLOR_SPACE_MAP: Partial<Record<ColorSpace, { value: ColorSpace; label: string }>> = {}
COLOR_SPACES.forEach((cs) => {
  COLOR_SPACE_MAP[cs.value] = cs
})

// Функция для загрузки настроек из localStorage
export const loadSavedSettings = (): ProjectSettings | null => {
  if (typeof window === "undefined") return null

  try {
    const savedSettings = localStorage.getItem(PROJECT_SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  } catch (error) {
    console.error("[ProjectSettingsMachine] Error loading settings from localStorage:", error)
  }

  return null
}

// Функция для сохранения настроек в localStorage
export const saveSettings = (settings: ProjectSettings): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PROJECT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error("[ProjectSettingsMachine] Error saving settings to localStorage:", error)
  }
}

// Интерфейс контекста машины состояний
export interface ProjectSettingsContext {
  settings: ProjectSettings
  availableResolutions: ResolutionOption[]
  customWidth: number
  customHeight: number
  aspectRatioLocked: boolean
  isLoaded: boolean
}

// Загружаем сохраненные настройки или используем значения по умолчанию
const savedSettings = loadSavedSettings()

// Получаем начальные разрешения на основе соотношения сторон
const initialAspectRatio = (savedSettings || DEFAULT_PROJECT_SETTINGS).aspectRatio
const initialResolutions = getResolutionsForAspectRatio(initialAspectRatio.label)

// Начальный контекст машины состояний
const initialContext: ProjectSettingsContext = {
  settings: savedSettings || DEFAULT_PROJECT_SETTINGS,
  availableResolutions: initialResolutions,
  customWidth: initialAspectRatio.value.width,
  customHeight: initialAspectRatio.value.height,
  aspectRatioLocked: true,
  isLoaded: false,
}

// Типы событий
type LoadSettingsEvent = { type: "LOAD_SETTINGS" }
type SettingsLoadedEvent = { type: "SETTINGS_LOADED"; settings: ProjectSettings }
type UpdateAspectRatioEvent = { type: "UPDATE_ASPECT_RATIO"; aspectRatio: AspectRatio }
type UpdateResolutionEvent = { type: "UPDATE_RESOLUTION"; resolution: Resolution }
type UpdateFrameRateEvent = { type: "UPDATE_FRAME_RATE"; frameRate: FrameRate }
type UpdateColorSpaceEvent = { type: "UPDATE_COLOR_SPACE"; colorSpace: ColorSpace }
type UpdateSettingsEvent = { type: "UPDATE_SETTINGS"; settings: Partial<ProjectSettings> }
type ResetSettingsEvent = { type: "RESET_SETTINGS" }
type UpdateCustomWidthEvent = { type: "UPDATE_CUSTOM_WIDTH"; width: number }
type UpdateCustomHeightEvent = { type: "UPDATE_CUSTOM_HEIGHT"; height: number }
type UpdateAspectRatioLockedEvent = { type: "UPDATE_ASPECT_RATIO_LOCKED"; locked: boolean }
type UpdateAvailableResolutionsEvent = {
  type: "UPDATE_AVAILABLE_RESOLUTIONS"
  resolutions: ResolutionOption[]
}

// Объединенный тип всех событий
export type ProjectSettingsEvent =
  | LoadSettingsEvent
  | SettingsLoadedEvent
  | UpdateAspectRatioEvent
  | UpdateResolutionEvent
  | UpdateFrameRateEvent
  | UpdateColorSpaceEvent
  | UpdateSettingsEvent
  | ResetSettingsEvent
  | UpdateCustomWidthEvent
  | UpdateCustomHeightEvent
  | UpdateAspectRatioLockedEvent
  | UpdateAvailableResolutionsEvent

// Создаем машину состояний
export const projectSettingsMachine = createMachine(
  {
    id: "projectSettings",
    initial: "loading",
    context: initialContext,
    states: {
      loading: {
        entry: ["loadSettings"],
        on: {
          SETTINGS_LOADED: {
            target: "idle",
            actions: ["updateSettings"],
          },
        },
      },
      idle: {
        on: {
          UPDATE_ASPECT_RATIO: {
            actions: ["updateAspectRatio", "updateAvailableResolutions", "saveSettings"],
          },
          UPDATE_RESOLUTION: {
            actions: ["updateResolution", "saveSettings"],
          },
          UPDATE_FRAME_RATE: {
            actions: ["updateFrameRate", "saveSettings"],
          },
          UPDATE_COLOR_SPACE: {
            actions: ["updateColorSpace", "saveSettings"],
          },
          UPDATE_SETTINGS: {
            actions: ["updateAllSettings", "saveSettings"],
          },
          RESET_SETTINGS: {
            actions: ["resetSettings", "saveSettings"],
          },
          UPDATE_CUSTOM_WIDTH: {
            actions: ["updateCustomWidth", "saveSettings"],
          },
          UPDATE_CUSTOM_HEIGHT: {
            actions: ["updateCustomHeight", "saveSettings"],
          },
          UPDATE_ASPECT_RATIO_LOCKED: {
            actions: ["updateAspectRatioLocked"],
          },
          UPDATE_AVAILABLE_RESOLUTIONS: {
            actions: ["updateAvailableResolutions"],
          },
        },
      },
    },
  },
  {
    actions: {
      // Загрузка настроек из localStorage
      loadSettings: () => {
        console.log("[ProjectSettingsMachine] Loading settings")

        // В XState 4.x мы не можем отправлять события из действий напрямую
        // Вместо этого мы будем использовать сервисы или просто обновлять контекст
        // Настройки уже загружены в initialContext при создании машины
      },

      // Обновление настроек после загрузки
      updateSettings: assign({
        settings: (_, event: any) => {
          if (event.type === "SETTINGS_LOADED" && event.settings) {
            console.log("[ProjectSettingsMachine] Settings loaded:", event.settings)
            return event.settings
          }
          return DEFAULT_PROJECT_SETTINGS
        },
        isLoaded: (_) => true,
      }),

      // Обновление соотношения сторон
      updateAspectRatio: assign({
        settings: ({ context, event }: any) => {
          if (event.type === "UPDATE_ASPECT_RATIO" && event.aspectRatio) {
            console.log("[ProjectSettingsMachine] Updating aspect ratio:", event.aspectRatio)
            return {
              ...context.settings,
              aspectRatio: event.aspectRatio,
            }
          }
          return context.settings
        },
      }),

      // Обновление разрешения
      updateResolution: assign({
        settings: ({ context, event }: any) => {
          if (event.type === "UPDATE_RESOLUTION" && event.resolution) {
            console.log("[ProjectSettingsMachine] Updating resolution:", event.resolution)
            return {
              ...context.settings,
              resolution: event.resolution,
            }
          }
          return context.settings
        },
      }),

      // Обновление частоты кадров
      updateFrameRate: assign({
        settings: ({ context, event }: any) => {
          if (event.type === "UPDATE_FRAME_RATE" && event.frameRate) {
            console.log("[ProjectSettingsMachine] Updating frame rate:", event.frameRate)

            // Проверяем, что значение frameRate является допустимым, используя FRAME_RATE_MAP
            const frameRate = event.frameRate as FrameRate
            if (!FRAME_RATE_MAP[frameRate]) {
              console.error("[ProjectSettingsMachine] Invalid frame rate:", frameRate)
              return context.settings
            }

            return {
              ...context.settings,
              frameRate: event.frameRate,
            }
          }
          return context.settings
        },
      }),

      // Обновление цветового пространства
      updateColorSpace: assign({
        settings: ({ context, event }: any) => {
          if (event.type === "UPDATE_COLOR_SPACE" && event.colorSpace) {
            console.log("[ProjectSettingsMachine] Updating color space:", event.colorSpace)

            // Проверяем, что значение colorSpace является допустимым, используя COLOR_SPACE_MAP
            const colorSpace = event.colorSpace as ColorSpace
            if (!COLOR_SPACE_MAP[colorSpace]) {
              console.error("[ProjectSettingsMachine] Invalid color space:", colorSpace)
              return context.settings
            }

            return {
              ...context.settings,
              colorSpace: event.colorSpace,
            }
          }
          return context.settings
        },
      }),

      // Обновление всех настроек
      updateAllSettings: assign({
        settings: ({ context, event }: any) => {
          if (event.type === "UPDATE_SETTINGS" && event.settings) {
            console.log("[ProjectSettingsMachine] Updating all settings:", event.settings)
            return {
              ...context.settings,
              ...event.settings,
            }
          }
          return context.settings
        },
      }),

      // Сброс настроек к значениям по умолчанию
      resetSettings: assign({
        settings: (_) => {
          console.log("[ProjectSettingsMachine] Resetting settings to defaults")
          return DEFAULT_PROJECT_SETTINGS
        },
      }),

      // Обновление пользовательской ширины
      updateCustomWidth: assign({
        customWidth: ({ context, event }: any) => {
          if (event.type === "UPDATE_CUSTOM_WIDTH" && typeof event.width === "number") {
            console.log("[ProjectSettingsMachine] Updating custom width:", event.width)
            return event.width
          }
          return context.customWidth
        },
      }),

      // Обновление пользовательской высоты
      updateCustomHeight: assign({
        customHeight: ({ context, event }: any) => {
          if (event.type === "UPDATE_CUSTOM_HEIGHT" && typeof event.height === "number") {
            console.log("[ProjectSettingsMachine] Updating custom height:", event.height)
            return event.height
          }
          return context.customHeight
        },
      }),

      // Обновление блокировки соотношения сторон
      updateAspectRatioLocked: assign({
        aspectRatioLocked: ({ context, event }: any) => {
          if (event.type === "UPDATE_ASPECT_RATIO_LOCKED" && typeof event.locked === "boolean") {
            console.log("[ProjectSettingsMachine] Updating aspect ratio locked:", event.locked)
            return event.locked
          }
          return context.aspectRatioLocked
        },
      }),

      // Обновление доступных разрешений
      updateAvailableResolutions: assign({
        availableResolutions: ({ context, event }: any) => {
          if (event.type === "UPDATE_AVAILABLE_RESOLUTIONS" && Array.isArray(event.resolutions)) {
            console.log(
              "[ProjectSettingsMachine] Updating available resolutions:",
              event.resolutions,
            )
            return event.resolutions
          } else if (event.type === "UPDATE_ASPECT_RATIO" && event.aspectRatio) {
            // Если обновляется соотношение сторон, получаем новые разрешения
            const resolutions = getResolutionsForAspectRatio(event.aspectRatio.label)
            console.log(
              "[ProjectSettingsMachine] Updating available resolutions based on aspect ratio:",
              resolutions,
            )
            return resolutions
          }
          return context.availableResolutions
        },
      }),

      // Сохранение настроек в localStorage
      saveSettings: ({ context }) => {
        console.log("[ProjectSettingsMachine] Saving settings to localStorage:", context.settings)
        saveSettings(context.settings)
      },
    },
  },
)
