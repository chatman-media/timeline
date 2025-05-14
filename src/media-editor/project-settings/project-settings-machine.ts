import { assign, createMachine } from "xstate"

import {
  ASPECT_RATIOS,
  DEFAULT_PROJECT_SETTINGS,
  type AspectRatio,
  type ColorSpace,
  type FrameRate,
  type ProjectSettings,
  type Resolution,
  type ResolutionOption,
  getResolutionsForAspectRatio,
} from "@/types/project"

// Ключ для хранения настроек проекта в localStorage
const PROJECT_SETTINGS_STORAGE_KEY = "timeline-project-settings"

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

// Константа с доступными значениями цветовых пространств
export const COLOR_SPACES: { value: ColorSpace; label: string }[] = [
  { value: "sdr", label: "SDR - Rec.709" },
  { value: "dci-p3", label: "DCI-P3" },
  { value: "p3-d65", label: "P3-D65" },
  { value: "hdr-hlg", label: "HDR - Rec.2100HLG" },
  { value: "hdr-pq", label: "HDR - Rec.2100PQ" },
]

// Функция для загрузки настроек из localStorage
const loadSavedSettings = (): ProjectSettings | null => {
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
const saveSettings = (settings: ProjectSettings): void => {
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
type UpdateAvailableResolutionsEvent = { type: "UPDATE_AVAILABLE_RESOLUTIONS"; resolutions: ResolutionOption[] }

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

            // Проверяем, что значение frameRate является допустимым
            const validFrameRate = FRAME_RATES.find(fr => fr.value === event.frameRate)
            if (!validFrameRate) {
              console.error("[ProjectSettingsMachine] Invalid frame rate:", event.frameRate)
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

            // Проверяем, что значение colorSpace является допустимым
            const validColorSpace = COLOR_SPACES.find(cs => cs.value === event.colorSpace)
            if (!validColorSpace) {
              console.error("[ProjectSettingsMachine] Invalid color space:", event.colorSpace)
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
            console.log("[ProjectSettingsMachine] Updating available resolutions:", event.resolutions)
            return event.resolutions
          } else if (event.type === "UPDATE_ASPECT_RATIO" && event.aspectRatio) {
            // Если обновляется соотношение сторон, получаем новые разрешения
            const resolutions = getResolutionsForAspectRatio(event.aspectRatio.label)
            console.log("[ProjectSettingsMachine] Updating available resolutions based on aspect ratio:", resolutions)
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
