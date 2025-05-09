import { assign, createMachine } from "xstate"

import { StorageService } from "@/media-editor/browser/services/storage-service"
import { Language } from "./types"

// Допустимые значения для языка
export const LANGUAGES = ["ru", "en"] as const
export const DEFAULT_LANGUAGE = "ru"
export const LANGUAGE_STORAGE_KEY = "app-language"

export interface LanguageContext {
  language: Language
  isLoaded: boolean
}

const initialContext: LanguageContext = {
  language: DEFAULT_LANGUAGE,
  isLoaded: false,
}

type LoadLanguageEvent = { type: "LOAD_LANGUAGE" }
type LanguageLoadedEvent = {
  type: "LANGUAGE_LOADED"
  language: Language
}
type UpdateLanguageEvent = { type: "UPDATE_LANGUAGE"; language: Language }

export type LanguageEvent = LoadLanguageEvent | LanguageLoadedEvent | UpdateLanguageEvent

export const languageMachine = createMachine(
  {
    id: "language",
    initial: "loading",
    context: initialContext,
    states: {
      loading: {
        entry: ["loadLanguage"],
        on: {
          LANGUAGE_LOADED: {
            target: "idle",
            actions: ["updateLanguage"],
          },
        },
      },
      idle: {
        entry: () => {
          console.log("LanguageMachine entered idle state")
        },
        on: {
          UPDATE_LANGUAGE: {
            actions: ["updateLanguage", "saveLanguageToStorage"],
          },
        },
      },
    },
  },
  {
    actions: {
      loadLanguage: () => {
        // Загружаем сохраненный язык
        let language = DEFAULT_LANGUAGE
        try {
          // Используем StorageService для загрузки настроек
          const storageService = StorageService.getInstance()
          const savedLanguage = storageService.get(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE)
          console.log("Loaded language from localStorage:", savedLanguage)
          
          // Проверяем, что значение языка является допустимым
          if (savedLanguage && LANGUAGES.includes(savedLanguage as Language)) {
            language = savedLanguage as Language
            console.log("Using saved language:", language)
          } else {
            console.log("No valid saved language found, using default:", DEFAULT_LANGUAGE)
            // Сохраняем значение по умолчанию
            storageService.set(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE)
          }
        } catch (error) {
          console.error("Error loading language:", error)
        }

        return {
          type: "LANGUAGE_LOADED",
          language,
        }
      },
      updateLanguage: assign({
        language: (_, event) => {
          if (event.type === "LANGUAGE_LOADED" || event.type === "UPDATE_LANGUAGE") {
            return event.language
          }
          return DEFAULT_LANGUAGE
        },
        isLoaded: (_) => true,
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
            storageService.set(LANGUAGE_STORAGE_KEY, event.language)
            console.log("Language saved to localStorage successfully")

            // Проверяем, что значение было сохранено правильно
            const savedValue = storageService.get(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE)
            console.log("Verified saved language value:", savedValue)
          } catch (error) {
            console.error(`Error saving language:`, error)
          }
        }
      },
    },
  },
)
