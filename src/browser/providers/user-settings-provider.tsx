import { createActorContext } from "@xstate/react"

import { userSettingsMachine } from "../machines/user-settings-machine"

export const UserSettingsContext = createActorContext(userSettingsMachine)

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  return <UserSettingsContext.Provider>{children}</UserSettingsContext.Provider>
}
