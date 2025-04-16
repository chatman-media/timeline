import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import {
  type ProjectContext,
  type ProjectContextEvents,
  projectMachine,
} from "@/machines/project-machine"
import { ProjectSettings } from "@/types/project"

export const ProjectContextType = createContext<
  (ProjectContext & ProjectContextEvents) | undefined
>(undefined)

interface ProjectProviderProps {
  children: React.ReactNode
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, send] = useMachine(projectMachine)

  return (
    <ProjectContextType.Provider
      value={{
        ...state.context,
        setName: (name: string) => send({ type: "SET_NAME", name }),
        setDirty: (isDirty: boolean) => send({ type: "SET_DIRTY", isDirty }),
        updateSettings: (settings: ProjectSettings) => send({ type: "UPDATE_SETTINGS", settings }),
        resetSettings: () => send({ type: "RESET_SETTINGS" }),
      }}
    >
      {children}
    </ProjectContextType.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContextType)
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}
