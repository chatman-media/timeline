import { assign, createMachine } from "xstate"

import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from "@/types/project"

// Key for storing project settings in localStorage
const PROJECT_SETTINGS_STORAGE_KEY = "timeline-project-settings"

// Function to load settings from localStorage
const loadSavedSettings = (): ProjectSettings | null => {
  if (typeof window === "undefined") return null

  try {
    const savedSettings = localStorage.getItem(PROJECT_SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  } catch (error) {
    console.error("[ProjectMachine] Error loading settings from localStorage:", error)
  }

  return null
}

// Function to save settings to localStorage
const saveSettings = (settings: ProjectSettings): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PROJECT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error("[ProjectMachine] Error saving settings to localStorage:", error)
  }
}

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

// Initialize with saved settings or defaults
const savedSettings = loadSavedSettings()

export const initialProjectContext: ProjectContext = {
  settings: savedSettings || DEFAULT_PROJECT_SETTINGS,
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
          actions: [
            assign(({ context, event }) => {
              const newSettings = {
                ...context.settings,
                ...(event as any).settings,
              };

              // Save settings to localStorage
              saveSettings(newSettings);

              return {
                settings: newSettings,
              };
            }),
          ],
        },
        RESET_SETTINGS: {
          actions: [
            assign({
              ...initialProjectContext,
            }),
            () => {
              // Clear saved settings from localStorage
              if (typeof window !== "undefined") {
                localStorage.removeItem(PROJECT_SETTINGS_STORAGE_KEY);
              }
            },
          ],
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
