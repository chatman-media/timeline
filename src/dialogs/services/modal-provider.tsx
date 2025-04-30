import { useMachine } from "@xstate/react"
import { createContext, useContext, useMemo } from "react"

import { modalMachine, ModalType } from "@/dialogs/services/modal-machine"
import { browserInspector } from "@/media-editor/providers"

interface ModalContextType {
  activeModal: ModalType
  isRecordModalOpen: boolean
  handleOpenModal: (modal: ModalType) => void
  handleCloseModal: () => void
}

interface ModalProviderProps {
  children: React.ReactNode
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: ModalProviderProps) {
  const [state, send] = useMachine(modalMachine, {
    inspect: browserInspector.inspect,
  })

  const value = useMemo(() => ({
    activeModal: state.context.activeModal,
    isRecordModalOpen: state.context.activeModal === "record",
    handleOpenModal: (modal: ModalType) => send({ type: "OPEN", modal }),
    handleCloseModal: () => send({ type: "CLOSE" }),
  }), [state.context, send])

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModalContext() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider")
  }
  return context
}
