import { useMachine } from "@xstate/react"
import { assign, createMachine } from "xstate"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "@/types/project"

export type ProjectContext = {
  settings: ProjectSettings
  name: string
  isDirty: boolean
}

export type ProjectContextEvents = {
  setName: (name: string) => void
  setDirty: (isDirty: boolean) => void
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

export const initialProjectContext: ProjectContext = {
  settings: DEFAULT_PROJECT_SETTINGS,
  name: "Без названия #1",
  isDirty: false,
}

type UpdateSettingsEvent = {
  type: "UPDATE_SETTINGS"
  settings: Partial<ProjectSettings>
}

type ResetSettingsEvent = {
  type: "RESET_SETTINGS"
}

type SetNameEvent = {
  type: "SET_NAME"
  name: string
}

type SetDirtyEvent = {
  type: "SET_DIRTY"
  isDirty: boolean
}

type ProjectEvent = UpdateSettingsEvent | ResetSettingsEvent | SetNameEvent | SetDirtyEvent

export const projectMachine = createMachine({
  id: "project",
  initial: "idle",
  context: initialProjectContext,
  types: {
    context: {} as ProjectContext,
    events: {} as ProjectEvent,
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
            ...initialProjectContext,
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

export function useProject(): ProjectContext & ProjectContextEvents {
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
