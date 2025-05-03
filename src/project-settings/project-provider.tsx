import { useMachine } from "@xstate/react"
import { createContext, useContext, useMemo } from "react"

import { browserInspector } from "@/media-editor/providers"
import { projectMachine } from "@/project-settings/project-machine"
import { ProjectSettings } from "@/types/project"

interface ProjectProviderProps {
  children: React.ReactNode
}

type ProjectContextType = {
  settings: ProjectSettings
  name: string
  isDirty: boolean
  setName: (name: string) => void
  setDirty: (isDirty: boolean) => void
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

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

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext(): ProjectContextType {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}
