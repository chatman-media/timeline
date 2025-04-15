import { assign, createMachine } from "xstate"

export type ModalType = "record" | "settings" | "none"

interface ModalContext {
  activeModal: ModalType
  isRecordModalOpen: boolean
  isSettingsModalOpen: boolean
}

type ModalEvents = {
  open: { modal: ModalType }
  close: {}
}

const initialContext: ModalContext = {
  activeModal: "none",
  isRecordModalOpen: false,
  isSettingsModalOpen: false,
}

export type ModalEvent = { type: "OPEN"; modal: ModalType } | { type: "CLOSE" }

export const modalMachine = createMachine({
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
