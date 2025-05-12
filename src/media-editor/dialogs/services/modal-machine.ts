import { assign, createMachine } from "xstate"

export type ModalType =
  | "record"
  | "settings"
  | "project-settings"
  | "user-settings"
  | "keyboard-shortcuts"
  | "none"

interface ModalContext {
  activeModal: ModalType
  isRecordModalOpen: boolean
  isSettingsModalOpen: boolean
  isProjectSettingsModalOpen: boolean
  isUserSettingsModalOpen: boolean
  isKeyboardShortcutsModalOpen: boolean
}

const initialContext: ModalContext = {
  activeModal: "none",
  isRecordModalOpen: false,
  isSettingsModalOpen: false,
  isProjectSettingsModalOpen: false,
  isUserSettingsModalOpen: false,
  isKeyboardShortcutsModalOpen: false,
}

type OpenModalEvent = { type: "OPEN"; modal: ModalType }
type CloseModalEvent = { type: "CLOSE" }

type ModalEvent = OpenModalEvent | CloseModalEvent

export const modalMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFsD2ECGAbAdASwizAGIB5ABQFEA5AbQAYBdRUAB1VjwBc9UA7FiAAeiACwAmHPXEB2AMyi5MgKwAaEAE9EARhkAOKfu3jlAX1Pq0mXASLEAwgBlSAZUoNmSEO049+gkQQJdS0EPW0cM3N1PnQ4QStsQR9uXgEvQIBaADYQxBzokESbQjBkjlT-DMRlORxw7NF6bJM8hFkAThxs5Rao8yA */
  id: "modal",
  initial: "idle",
  context: initialContext,
  types: {
    context: {} as ModalContext,
    events: {} as ModalEvent,
  },
  states: {
    idle: {
      on: {
        OPEN: {
          actions: assign({
            activeModal: ({ event }) => event.modal,
          }),
        },
        CLOSE: {
          actions: assign({
            activeModal: "none",
          }),
        },
      },
    },
  },
})
