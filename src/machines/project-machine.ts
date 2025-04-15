import { useMachine } from "@xstate/react"
import { assign, createMachine } from "xstate"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "@/types/project"

interface ProjectContext {
  settings: ProjectSettings
  name: string
  isDirty: boolean
}

type ProjectEvent =
  | { type: "UPDATE_SETTINGS"; settings: Partial<ProjectSettings> }
  | { type: "RESET_SETTINGS" }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_DIRTY"; isDirty: boolean }

export const projectMachine = createMachine({
  id: "project",
  initial: "idle",
  context: {
    settings: DEFAULT_PROJECT_SETTINGS,
    name: "Без названия #1",
    isDirty: false,
  } as ProjectContext,
  states: {
    idle: {
      on: {
        UPDATE_SETTINGS: {
          actions: assign(({ context, event }) => ({
            settings: {
              ...context.settings,
              ...(event as any).settings,
            },
          })),
        },
        RESET_SETTINGS: {
          actions: assign({
            settings: () => DEFAULT_PROJECT_SETTINGS,
          }),
        },
        SET_NAME: {
          actions: assign({
            name: (_, event) => (event as any).name,
          }),
        },
        SET_DIRTY: {
          actions: assign({
            isDirty: (_, event) => (event as any).isDirty,
          }),
        },
      },
    },
  },
})

export function useProject() {
  const [state, send] = useMachine(projectMachine)

  return {
    settings: state.context.settings,
    name: state.context.name,
    isDirty: state.context.isDirty,
    updateSettings: (settings: Partial<ProjectSettings>) =>
      send({ type: "UPDATE_SETTINGS", settings }),
    resetSettings: () => send({ type: "RESET_SETTINGS" }),
    setName: (name: string) => send({ type: "SET_NAME", name }),
    setDirty: (isDirty: boolean) => send({ type: "SET_DIRTY", isDirty }),
  }
}
