import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { userSettingsMachine, BrowserTab } from "../machines/user-settings-machine"
import { browserInspector } from "@/media-editor/providers"

interface UserSettingsContextValue {
  activeTab: BrowserTab
  handleTabChange: (value: string) => void
}

export const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")

  const [state, send] = useMachine(userSettingsMachine, {
    inspect: browserInspector.inspect,
  })

  console.log("UserSettingsProvider state:", state.context)

  const value = {
    activeTab: state.context.activeTab,
    handleTabChange: (value: string) => {
      console.log("Tab change requested:", value)
      // Проверяем, что значение является допустимым BrowserTab
      if (["media", "music", "transitions", "effects", "filters", "templates"].includes(value)) {
        send({ type: "UPDATE_ACTIVE_TAB", tab: value as BrowserTab })
      } else {
        console.error("Invalid tab value:", value)
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
