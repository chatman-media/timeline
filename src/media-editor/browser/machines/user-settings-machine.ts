import { assign, createMachine } from "xstate"

export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  TEMPLATES: "timeline-templates-preview-size",
  ACTIVE_TAB: "browser-active-tab",
} as const

// Допустимые значения для активного таба
export const BROWSER_TABS = [
  "media",
  "music",
  "transitions",
  "effects",
  "filters",
  "templates",
] as const
export const DEFAULT_TAB = "media"

export type PreviewSize = (typeof PREVIEW_SIZES)[number]
export type BrowserTab = (typeof BROWSER_TABS)[number]
export type StorageKey = keyof typeof STORAGE_KEYS

export interface UserSettingsContext {
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
  isLoaded: boolean
}

const initialContext: UserSettingsContext = {
  previewSizes: {
    MEDIA: DEFAULT_SIZE,
    TRANSITIONS: DEFAULT_SIZE,
    TEMPLATES: DEFAULT_SIZE,
  },
  activeTab: DEFAULT_TAB,
  isLoaded: false,
}

type LoadUserSettingsEvent = { type: "LOAD_SETTINGS" }
type UserSettingsLoadedEvent = {
  type: "SETTINGS_LOADED"
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
}
type UpdatePreviewSizeEvent = {
  type: "UPDATE_PREVIEW_SIZE"
  key: "MEDIA" | "TRANSITIONS" | "TEMPLATES"
  size: PreviewSize
}
type UpdateActiveTabEvent = { type: "UPDATE_ACTIVE_TAB"; tab: BrowserTab }

export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UserSettingsLoadedEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent

export const userSettingsMachine = createMachine(
  {
    id: "userSettings",
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
        entry: () => {
          console.log("UserSettingsMachine entered idle state")
        },
        on: {
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize", "savePreviewSizeToStorage"],
          },
          UPDATE_ACTIVE_TAB: {
            actions: ["updateActiveTab", "saveActiveTabToStorage"],
          },
        },
      },
    },
  },
  {
    actions: {
      loadSettings: () => {
        // Создаем объект с значениями по умолчанию для размеров превью
        const defaultPreviewSizes = {
          MEDIA: DEFAULT_SIZE,
          TRANSITIONS: DEFAULT_SIZE,
          TEMPLATES: DEFAULT_SIZE,
        }

        // Загружаем сохраненные значения размеров превью из localStorage
        const previewSizes = Object.entries({
          MEDIA: STORAGE_KEYS.MEDIA,
          TRANSITIONS: STORAGE_KEYS.TRANSITIONS,
          TEMPLATES: STORAGE_KEYS.TEMPLATES,
        }).reduce(
          (acc, [key, storageKey]) => {
            try {
              const savedValue = localStorage.getItem(storageKey)
              if (savedValue) {
                const parsedValue = parseInt(savedValue, 10)
                if (PREVIEW_SIZES.includes(parsedValue as PreviewSize)) {
                  acc[key as "MEDIA" | "TRANSITIONS" | "TEMPLATES"] = parsedValue as PreviewSize
                }
              }
            } catch (error) {
              console.error(`Error loading preview size for ${key}:`, error)
            }
            return acc
          },
          // Начинаем с объекта значений по умолчанию
          { ...defaultPreviewSizes },
        )

        // Загружаем сохраненный активный таб
        let activeTab = DEFAULT_TAB
        try {
          const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB)
          console.log("Loaded active tab from localStorage:", savedTab)
          console.log("BROWSER_TABS:", BROWSER_TABS)

          // Проверяем, что значение таба является допустимым
          if (savedTab) {
            console.log(
              "Checking if saved tab is valid:",
              savedTab,
              "includes:",
              BROWSER_TABS.includes(savedTab as BrowserTab),
            )

            if (BROWSER_TABS.includes(savedTab as BrowserTab)) {
              activeTab = savedTab as BrowserTab
              console.log("Using saved active tab:", activeTab)
            } else {
              console.log("Saved tab is not valid, using default:", DEFAULT_TAB)
            }
          } else {
            console.log("No saved tab found, using default:", DEFAULT_TAB)
          }
        } catch (error) {
          console.error("Error loading active tab:", error)
        }

        // Сохраняем значения по умолчанию в localStorage, если их там нет
        Object.entries({
          MEDIA: STORAGE_KEYS.MEDIA,
          TRANSITIONS: STORAGE_KEYS.TRANSITIONS,
          TEMPLATES: STORAGE_KEYS.TEMPLATES,
        }).forEach(([key, storageKey]) => {
          if (localStorage.getItem(storageKey) === null) {
            try {
              localStorage.setItem(storageKey, DEFAULT_SIZE.toString())
            } catch (error) {
              console.error(`Error saving default preview size for ${key}:`, error)
            }
          }
        })

        // Сохраняем значение по умолчанию для активного таба, если его нет
        if (localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) === null) {
          try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, DEFAULT_TAB)
          } catch (error) {
            console.error("Error saving default active tab:", error)
          }
        }

        return {
          type: "SETTINGS_LOADED",
          previewSizes,
          activeTab,
        }
      },
      updateSettings: assign({
        previewSizes: (_, event) => (event as UserSettingsLoadedEvent).previewSizes,
        activeTab: (_, event) => (event as UserSettingsLoadedEvent).activeTab,
        isLoaded: (_) => true,
      }),
      updatePreviewSize: assign((context, event: any) => {
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
      updateActiveTab: assign((context, event: any) => {
        if (event.type === "UPDATE_ACTIVE_TAB") {
          console.log("Updating active tab in machine:", event.tab)
          console.log("Current context:", context)
          console.log("Event:", event)

          // Проверяем, что значение таба является допустимым
          if (!BROWSER_TABS.includes(event.tab)) {
            console.error("Invalid tab value in machine:", event.tab)
            return context
          }

          return {
            ...context,
            activeTab: event.tab,
          }
        }
        return context
      }),
      savePreviewSizeToStorage: (_, event: any) => {
        if (event.type === "UPDATE_PREVIEW_SIZE") {
          const storageKey =
            event.key === "MEDIA"
              ? STORAGE_KEYS.MEDIA
              : event.key === "TRANSITIONS"
                ? STORAGE_KEYS.TRANSITIONS
                : STORAGE_KEYS.TEMPLATES

          try {
            localStorage.setItem(storageKey, event.size.toString())
          } catch (error) {
            console.error(`Error saving preview size for ${event.key}:`, error)
          }
        }
      },
      saveActiveTabToStorage: (_, event: any) => {
        if (event.type === "UPDATE_ACTIVE_TAB") {
          try {
            console.log("Saving active tab to localStorage:", event.tab)

            // Проверяем, что значение таба является допустимым
            if (!BROWSER_TABS.includes(event.tab)) {
              console.error("Invalid tab value when saving to localStorage:", event.tab)
              return
            }

            localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, event.tab)
            console.log("Active tab saved to localStorage successfully")

            // Проверяем, что значение было сохранено правильно
            const savedValue = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB)
            console.log("Verified saved value:", savedValue)
          } catch (error) {
            console.error(`Error saving active tab:`, error)
          }
        }
      },
    },
  },
)
