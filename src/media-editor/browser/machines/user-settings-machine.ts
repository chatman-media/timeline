import { assign, createMachine } from "xstate"

export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  TEMPLATES: "timeline-templates-preview-size",
} as const

export type PreviewSize = (typeof PREVIEW_SIZES)[number]
export type StorageKey = keyof typeof STORAGE_KEYS

interface UserSettingsContext {
  previewSizes: Record<StorageKey, PreviewSize>
  isLoaded: boolean
}

type LoadUserSettingsEvent = { type: "LOAD_SETTINGS" }
type UserSettingsLoadedEvent = {
  type: "SETTINGS_LOADED"
  previewSizes: Record<StorageKey, PreviewSize>
}
type UpdatePreviewSizeEvent = { type: "UPDATE_PREVIEW_SIZE"; key: StorageKey; size: PreviewSize }

type UserSettingsEvent = LoadUserSettingsEvent | UserSettingsLoadedEvent | UpdatePreviewSizeEvent

export const userSettingsMachine = createMachine(
  {
    id: "userSettings",
    initial: "loading",
    context: {
      previewSizes: {
        MEDIA: DEFAULT_SIZE,
        TRANSITIONS: DEFAULT_SIZE,
        TEMPLATES: DEFAULT_SIZE,
      },
      isLoaded: false,
    } as UserSettingsContext,
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
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize", "saveToStorage"],
          },
        },
      },
    },
  },
  {
    actions: {
      loadSettings: () => {
        // Создаем объект с значениями по умолчанию для всех ключей
        const defaultPreviewSizes: Record<StorageKey, PreviewSize> = {
          MEDIA: DEFAULT_SIZE,
          TRANSITIONS: DEFAULT_SIZE,
          TEMPLATES: DEFAULT_SIZE,
        }

        // Загружаем сохраненные значения из localStorage
        const previewSizes = Object.entries(STORAGE_KEYS).reduce(
          (acc, [key, storageKey]) => {
            try {
              const savedValue = localStorage.getItem(storageKey)
              if (savedValue) {
                const parsedValue = parseInt(savedValue, 10)
                if (PREVIEW_SIZES.includes(parsedValue as PreviewSize)) {
                  acc[key as StorageKey] = parsedValue as PreviewSize
                }
              }
            } catch (error) {
              console.error(`Error loading settings for ${key}:`, error)
            }
            return acc
          },
          // Начинаем с объекта значений по умолчанию
          { ...defaultPreviewSizes } as Record<StorageKey, PreviewSize>,
        )

        // Сохраняем значения по умолчанию в localStorage, если их там нет
        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          if (localStorage.getItem(storageKey) === null) {
            try {
              localStorage.setItem(storageKey, DEFAULT_SIZE.toString())
            } catch (error) {
              console.error(`Error saving default settings for ${key}:`, error)
            }
          }
        })

        return {
          type: "SETTINGS_LOADED",
          previewSizes,
        }
      },
      updateSettings: assign({
        previewSizes: (_, event) => event.previewSizes,
        isLoaded: (_) => true,
      }),
      updatePreviewSize: assign((context, event) => {
        if (event.type === "UPDATE_PREVIEW_SIZE") {
          return {
            ...context,
            previewSizes: {
              ...context.previewSizes,
              [event.key]: event.size,
            },
          }
        }
        return context
      }),
      saveToStorage: (_, event: any) => {
        if (event.type === "UPDATE_PREVIEW_SIZE") {
          try {
            localStorage.setItem(STORAGE_KEYS[event.key], event.size.toString())
          } catch (error) {
            console.error(`Error saving settings for ${event.key}:`, error)
          }
        }
      },
    },
  },
)
