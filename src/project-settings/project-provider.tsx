import { useMachine } from "@xstate/react"
import { createContext, useContext, useMemo } from "react"

import { browserInspector } from "@/media-editor/providers"
import {
  type ProjectContext,
  type ProjectContextEvents,
  projectMachine,
} from "@/project-settings/project-machine"
import { ProjectSettings } from "@/types/project"

interface ProjectProviderProps {
  children: React.ReactNode
}

const ProjectContextType = createContext<(ProjectContext & ProjectContextEvents) | undefined>(
  undefined,
)

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, send] = useMachine(projectMachine, {
    inspect: browserInspector.inspect,
  })

  const value = useMemo(
    () => ({
      ...state.context,
      setName: (name: string) => send({ type: "SET_NAME", name }),
      setDirty: (isDirty: boolean) => send({ type: "SET_DIRTY", isDirty }),
      updateSettings: (settings: ProjectSettings) => send({ type: "UPDATE_SETTINGS", settings }),
      resetSettings: () => send({ type: "RESET_SETTINGS" }),
    }),
    [state.context, send],
  )

  return <ProjectContextType.Provider value={value}>{children}</ProjectContextType.Provider>
}

export function useProjectContext(): ProjectContext & ProjectContextEvents {
  const context = useContext(ProjectContextType)
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}
