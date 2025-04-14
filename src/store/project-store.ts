import { createMachine, assign } from "xstate"
import { useMachine } from "@xstate/react"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "@/types/project"

interface ProjectContext {
  settings: ProjectSettings
}

type ProjectEvent =
  | { type: "UPDATE_SETTINGS"; settings: Partial<ProjectSettings> }
  | { type: "RESET_SETTINGS" }

export const projectMachine = createMachine({
  id: "project",
  initial: "idle",
  context: {
    settings: DEFAULT_PROJECT_SETTINGS,
  },
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
      },
    },
  },
})

export function useProjectStore() {
  const [state, send] = useMachine(projectMachine)

  return {
    settings: state.context.settings,
    updateSettings: (settings: Partial<ProjectSettings>) =>
      send({ type: "UPDATE_SETTINGS", settings }),
    resetSettings: () => send({ type: "RESET_SETTINGS" }),
  }
}
