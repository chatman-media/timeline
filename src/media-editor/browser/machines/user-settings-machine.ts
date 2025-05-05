import { assign, createMachine } from "xstate"

export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
} as const

type PreviewSize = (typeof PREVIEW_SIZES)[number]
type StorageKey = keyof typeof STORAGE_KEYS

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
        TRANSITIONS: DEFAULT_SIZE,
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
          {} as Record<StorageKey, PreviewSize>,
        )

        return {
          type: "SETTINGS_LOADED",
          previewSizes,
        }
      },
      updateSettings: (context, event) => {
        assign(context, {
          previewSizes: event.previewSizes,
          isLoaded: true,
        })
      },
      updatePreviewSize: (context, event) => {
        if (event.type === "UPDATE_PREVIEW_SIZE") {
          context.previewSizes[event.key] = event.size
        }
      },
      saveToStorage: (context, event) => {
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
