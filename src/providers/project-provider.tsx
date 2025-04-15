import { createActorContext } from "@xstate/react"

import { projectMachine } from "@/machines/project-machine"

export const ProjectContext = createActorContext(projectMachine)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  return <ProjectContext.Provider>{children}</ProjectContext.Provider>
}
