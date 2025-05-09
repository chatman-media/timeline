import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect } from "react"

import {
  BrowserTab,
  Language,
  LayoutMode,
  STORAGE_KEYS,
  userSettingsMachine,
} from "@/media-editor/browser/machines/user-settings-machine"
import { browserInspector } from "@/media-editor/providers"

interface UserSettingsContextValue {
  activeTab: BrowserTab
  language: Language
  layoutMode: LayoutMode
  handleTabChange: (value: string) => void
  handleLanguageChange: (value: Language) => void
  handleLayoutChange: (value: LayoutMode) => void
}

export const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")

  const [state, send] = useMachine(userSettingsMachine, {
    inspect: browserInspector.inspect,
  })

  console.log("UserSettingsProvider state:", state.context)

  // Проверяем соответствие языка в localStorage и в state machine
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("app-language")
      console.log("UserSettingsProvider: localStorage language:", storedLang)
      console.log("UserSettingsProvider: state machine language:", state.context.language)

      // Если язык в localStorage отличается от текущего языка в state machine, обновляем его
      if (
        storedLang &&
        (storedLang === "ru" || storedLang === "en") &&
        storedLang !== state.context.language
      ) {
        console.log("UserSettingsProvider: Updating language to match localStorage:", storedLang)
        send({ type: "UPDATE_LANGUAGE", language: storedLang as Language })
      }
    }
  }, [state.context.language, send])

  // Проверяем соответствие layout в localStorage и в state machine
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Используем константу STORAGE_KEYS.LAYOUT из user-settings-machine.ts
      const storedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT)
      console.log("UserSettingsProvider: localStorage layout:", storedLayout)
      console.log("UserSettingsProvider: state machine layout:", state.context.layoutMode)
      console.log("UserSettingsProvider: STORAGE_KEYS.LAYOUT:", STORAGE_KEYS.LAYOUT)

      // Проверяем все ключи в localStorage
      console.log("UserSettingsProvider: All localStorage keys:")
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          console.log(`${key}: ${localStorage.getItem(key)}`)
        }
      }

      // Если layout в localStorage отличается от текущего layout в state machine, обновляем его
      if (
        storedLayout &&
        ["default", "options", "vertical", "dual"].includes(storedLayout) &&
        storedLayout !== state.context.layoutMode
      ) {
        console.log("UserSettingsProvider: Updating layout to match localStorage:", storedLayout)
        send({ type: "UPDATE_LAYOUT", layoutMode: storedLayout as LayoutMode })
      }
    }
  }, [send, state.context.layoutMode])

  // Логируем каждое изменение состояния
  useEffect(() => {
    console.log("UserSettingsProvider: state updated", state.context)
  }, [state])

  const value = {
    activeTab: state.context.activeTab,
    language: state.context.language,
    layoutMode: state.context.layoutMode,
    handleTabChange: (value: string) => {
      console.log("Tab change requested:", value)
      // Проверяем, что значение является допустимым BrowserTab
      if (["media", "music", "transitions", "effects", "filters", "templates"].includes(value)) {
        send({ type: "UPDATE_ACTIVE_TAB", tab: value as BrowserTab })
      } else {
        console.error("Invalid tab value:", value)
      }
    },
    handleLanguageChange: (value: Language) => {
      console.log("Language change requested:", value)
      send({ type: "UPDATE_LANGUAGE", language: value })
    },
    handleLayoutChange: (value: LayoutMode) => {
      console.log("Layout change requested:", value)
      console.log("Current layoutMode before update:", state.context.layoutMode)

      // Проверяем, что значение является допустимым LayoutMode
      if (["default", "options", "vertical", "dual"].includes(value)) {
        // Отправляем событие в машину состояний
        send({ type: "UPDATE_LAYOUT", layoutMode: value })
        console.log("UPDATE_LAYOUT event sent with layoutMode:", value)
      } else {
        console.error("Invalid layout value:", value)
      }
    },
  }

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider")
  }
  return context
}
