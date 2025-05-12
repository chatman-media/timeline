import { assign, createMachine } from "xstate"

import { StorageService } from "../services/storage-service"

export const PREVIEW_SIZES = [60, 80, 100, 125, 150, 200, 250, 300, 400] as const
export const DEFAULT_SIZE = 100
export const MIN_SIZE = 60

export const STORAGE_KEYS = {
  MEDIA: "timeline-media-preview-size",
  TRANSITIONS: "timeline-transitions-preview-size",
  TEMPLATES: "timeline-templates-preview-size",
  ACTIVE_TAB: "browser-active-tab",
  LANGUAGE: "app-language",
  LAYOUT: "app-layout-mode",
  VOLUME: "player-volume",
  SCREENSHOTS_PATH: "screenshots-save-path",
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

// Допустимые значения для языка
export const LANGUAGES = ["ru", "en", "es"] as const
export const DEFAULT_LANGUAGE = "ru"

// Допустимые значения для макета
export const LAYOUTS = ["default", "options", "vertical", "dual"] as const
export const DEFAULT_LAYOUT = "default"

export type PreviewSize = (typeof PREVIEW_SIZES)[number]
export type BrowserTab = (typeof BROWSER_TABS)[number]
export type Language = (typeof LANGUAGES)[number]
export type LayoutMode = (typeof LAYOUTS)[number]
export type StorageKey = keyof typeof STORAGE_KEYS

export interface UserSettingsContext {
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
  language: Language
  layoutMode: LayoutMode
  screenshotsPath: string
  isLoaded: boolean
}

const initialContext: UserSettingsContext = {
  previewSizes: {
    MEDIA: DEFAULT_SIZE,
    TRANSITIONS: DEFAULT_SIZE,
    TEMPLATES: DEFAULT_SIZE,
  },
  activeTab: DEFAULT_TAB,
  language: DEFAULT_LANGUAGE,
  layoutMode: DEFAULT_LAYOUT,
  screenshotsPath: "public/screenshots",
  isLoaded: false,
}

type LoadUserSettingsEvent = { type: "LOAD_SETTINGS" }
type UserSettingsLoadedEvent = {
  type: "SETTINGS_LOADED"
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>
  activeTab: BrowserTab
  language: Language
  layoutMode: LayoutMode
  screenshotsPath: string
}
type UpdatePreviewSizeEvent = {
  type: "UPDATE_PREVIEW_SIZE"
  key: "MEDIA" | "TRANSITIONS" | "TEMPLATES"
  size: PreviewSize
}
type UpdateActiveTabEvent = { type: "UPDATE_ACTIVE_TAB"; tab: BrowserTab }
type UpdateLanguageEvent = { type: "UPDATE_LANGUAGE"; language: Language }
type UpdateLayoutEvent = { type: "UPDATE_LAYOUT"; layoutMode: LayoutMode }
type UpdateScreenshotsPathEvent = { type: "UPDATE_SCREENSHOTS_PATH"; path: string }

export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UserSettingsLoadedEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent
  | UpdateLanguageEvent
  | UpdateLayoutEvent
  | UpdateScreenshotsPathEvent

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
          UPDATE_LANGUAGE: {
            actions: ["updateLanguage", "saveLanguageToStorage"],
          },
          UPDATE_LAYOUT: {
            actions: ["updateLayout", "saveLayoutToStorage"],
          },
          UPDATE_SCREENSHOTS_PATH: {
            actions: ["updateScreenshotsPath", "saveScreenshotsPathToStorage"],
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

        // Загружаем сохраненный язык
        let language = DEFAULT_LANGUAGE
        try {
          // Используем StorageService для загрузки настроек
          const storageService = StorageService.getInstance()
          const savedLanguage = storageService.get(STORAGE_KEYS.LANGUAGE, DEFAULT_LANGUAGE)
          console.log("Loaded language from localStorage:", savedLanguage)

          // Проверяем, что значение языка является допустимым
          if (savedLanguage && LANGUAGES.includes(savedLanguage as Language)) {
            language = savedLanguage as Language
            console.log("Using saved language:", language)

            // Обновляем язык в i18next
            try {
              import("i18next").then((i18n) => {
                i18n.default.changeLanguage(language)
                console.log("Language initialized in i18next:", language)

                // Синхронизируем значение в localStorage напрямую
                if (typeof window !== "undefined") {
                  localStorage.setItem("app-language", language)
                  console.log("Synchronized language in localStorage:", language)
                }
              })
            } catch (error) {
              console.error("Error initializing language in i18next:", error)
            }
          } else {
            console.log("No valid saved language found, using default:", DEFAULT_LANGUAGE)
          }
        } catch (error) {
          console.error("Error loading language:", error)
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

        // Сохраняем значение по умолчанию для языка, если его нет
        try {
          const storageService = StorageService.getInstance()
          if (storageService.get(STORAGE_KEYS.LANGUAGE, null) === null) {
            storageService.set(STORAGE_KEYS.LANGUAGE, DEFAULT_LANGUAGE)
          }
        } catch (error) {
          console.error("Error saving default language:", error)
        }

        // Загружаем сохраненный макет
        let layoutMode = DEFAULT_LAYOUT
        try {
          console.log("STORAGE_KEYS.LAYOUT:", STORAGE_KEYS.LAYOUT)

          // Проверяем все ключи в localStorage
          console.log("All localStorage keys in loadSettings:")
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key) {
              console.log(`${key}: ${localStorage.getItem(key)}`)
            }
          }

          const savedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT)
          console.log("Loaded layout from localStorage:", savedLayout)

          // Проверяем, что значение макета является допустимым
          if (savedLayout && LAYOUTS.includes(savedLayout as LayoutMode)) {
            layoutMode = savedLayout as LayoutMode
            console.log("Using saved layout:", layoutMode)
          } else {
            console.log("No valid saved layout found, using default:", DEFAULT_LAYOUT)
          }
        } catch (error) {
          console.error("Error loading layout:", error)
        }

        // Сохраняем значение по умолчанию для макета, если его нет
        if (localStorage.getItem(STORAGE_KEYS.LAYOUT) === null) {
          try {
            localStorage.setItem(STORAGE_KEYS.LAYOUT, DEFAULT_LAYOUT)
          } catch (error) {
            console.error("Error saving default layout:", error)
          }
        }

        // Загружаем сохраненный путь для скриншотов
        let screenshotsPath = "public/screenshots"
        try {
          const savedPath = localStorage.getItem(STORAGE_KEYS.SCREENSHOTS_PATH)
          console.log("Loaded screenshots path from localStorage:", savedPath)

          if (savedPath) {
            screenshotsPath = savedPath
            console.log("Using saved screenshots path:", screenshotsPath)
          } else {
            console.log("No saved screenshots path found, using default:", screenshotsPath)
          }
        } catch (error) {
          console.error("Error loading screenshots path:", error)
        }

        // Сохраняем значение по умолчанию для пути скриншотов, если его нет
        if (localStorage.getItem(STORAGE_KEYS.SCREENSHOTS_PATH) === null) {
          try {
            localStorage.setItem(STORAGE_KEYS.SCREENSHOTS_PATH, "public/screenshots")
          } catch (error) {
            console.error("Error saving default screenshots path:", error)
          }
        }

        return {
          type: "SETTINGS_LOADED",
          previewSizes,
          activeTab,
          language,
          layoutMode,
          screenshotsPath,
        }
      },
      updateSettings: assign({
        previewSizes: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.previewSizes
        },
        activeTab: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.activeTab
        },
        language: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.language
        },
        layoutMode: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.layoutMode || DEFAULT_LAYOUT
        },
        screenshotsPath: (_, event) => {
          const typedEvent = event as UserSettingsLoadedEvent
          return typedEvent.screenshotsPath || "public/screenshots"
        },
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
      updateActiveTab: assign({
        activeTab: (_, event: any) => {
          if (event.type === "UPDATE_ACTIVE_TAB") {
            console.log("Updating active tab in machine:", event.tab)

            // Проверяем, что значение таба является допустимым
            if (!BROWSER_TABS.includes(event.tab)) {
              console.error("Invalid tab value in machine:", event.tab)
              return DEFAULT_TAB
            }

            return event.tab
          }
          return DEFAULT_TAB
        },
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
      updateLanguage: assign({
        language: (_, event: any) => {
          if (event.type === "UPDATE_LANGUAGE") {
            console.log("Updating language in machine:", event.language)

            // Проверяем, что значение языка является допустимым
            if (!LANGUAGES.includes(event.language)) {
              console.error("Invalid language value in machine:", event.language)
              return DEFAULT_LANGUAGE
            }

            // Обновляем язык в i18next
            try {
              import("i18next").then((i18n) => {
                i18n.default.changeLanguage(event.language)
                console.log("Language changed in i18next:", event.language)

                // Дополнительно сохраняем язык напрямую в localStorage
                if (typeof window !== "undefined") {
                  localStorage.setItem("app-language", event.language)
                  console.log(
                    "Directly saved language to localStorage from machine:",
                    event.language,
                  )
                }
              })
            } catch (error) {
              console.error("Error changing language in i18next:", error)
            }

            return event.language
          }
          return DEFAULT_LANGUAGE
        },
      }),
      saveLanguageToStorage: (_, event: any) => {
        if (event.type === "UPDATE_LANGUAGE") {
          try {
            console.log("Saving language to localStorage:", event.language)

            // Проверяем, что значение языка является допустимым
            if (!LANGUAGES.includes(event.language)) {
              console.error("Invalid language value when saving to localStorage:", event.language)
              return
            }

            // Используем StorageService для сохранения настроек
            const storageService = StorageService.getInstance()
            storageService.set(STORAGE_KEYS.LANGUAGE, event.language)
            console.log("Language saved to localStorage successfully")

            // Дополнительно сохраняем язык напрямую в localStorage
            if (typeof window !== "undefined") {
              localStorage.setItem("app-language", event.language)
              console.log("Directly saved language to localStorage from machine:", event.language)
            }

            // Проверяем, что значение было сохранено правильно
            const savedValue = storageService.get(STORAGE_KEYS.LANGUAGE, DEFAULT_LANGUAGE)
            console.log("Verified saved language value in StorageService:", savedValue)

            if (typeof window !== "undefined") {
              console.log(
                "Verified saved language value in localStorage:",
                localStorage.getItem("app-language"),
              )
            }
          } catch (error) {
            console.error(`Error saving language:`, error)
          }
        }
      },
      updateLayout: assign({
        layoutMode: (_, event: any) => {
          if (event.type === "UPDATE_LAYOUT") {
            console.log("Updating layout in machine:", event.layoutMode)

            // Проверяем, что значение макета является допустимым
            if (!LAYOUTS.includes(event.layoutMode)) {
              console.error("Invalid layout value in machine:", event.layoutMode)
              return DEFAULT_LAYOUT
            }

            return event.layoutMode
          }
          return DEFAULT_LAYOUT
        },
      }),
      saveLayoutToStorage: (_, event: any) => {
        if (event.type === "UPDATE_LAYOUT") {
          try {
            console.log("Saving layout to localStorage:", event.layoutMode)

            // Проверяем, что значение макета является допустимым
            if (!LAYOUTS.includes(event.layoutMode)) {
              console.error("Invalid layout value when saving to localStorage:", event.layoutMode)
              return
            }

            localStorage.setItem(STORAGE_KEYS.LAYOUT, event.layoutMode)
            console.log("Layout saved to localStorage successfully")

            // Проверяем, что значение было сохранено правильно
            const savedValue = localStorage.getItem(STORAGE_KEYS.LAYOUT)
            console.log("Verified saved layout value:", savedValue)
          } catch (error) {
            console.error(`Error saving layout:`, error)
          }
        }
      },
      updateScreenshotsPath: assign({
        screenshotsPath: (_, event: any) => {
          if (event.type === "UPDATE_SCREENSHOTS_PATH") {
            console.log("Updating screenshots path in machine:", event.path)
            return event.path
          }
          return "public/screenshots"
        },
      }),
      saveScreenshotsPathToStorage: (_, event: any) => {
        if (event.type === "UPDATE_SCREENSHOTS_PATH") {
          try {
            console.log("Saving screenshots path to localStorage:", event.path)
            localStorage.setItem(STORAGE_KEYS.SCREENSHOTS_PATH, event.path)
            console.log("Screenshots path saved to localStorage successfully")

            // Проверяем, что значение было сохранено правильно
            const savedValue = localStorage.getItem(STORAGE_KEYS.SCREENSHOTS_PATH)
            console.log("Verified saved screenshots path value:", savedValue)
          } catch (error) {
            console.error(`Error saving screenshots path:`, error)
          }
        }
      },
    },
  },
)
