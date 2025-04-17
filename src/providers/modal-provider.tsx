import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { modalMachine, ModalType } from "@/machines/modal-machine"
import { browserInspector } from "./providers"

interface ModalContextType {
  activeModal: ModalType
  isRecordModalOpen: boolean
  handleOpenModal: (modal: ModalType) => void
  handleCloseModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

interface ModalProviderProps {
  children: React.ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [state, send] = useMachine(modalMachine, { inspect: browserInspector.inspect })

  const activeModal = state.context.activeModal
  const isRecordModalOpen = state.context.activeModal === "record"

  const handleOpenModal = (modal: ModalType) => {
    send({ type: "OPEN", modal })
  }

  const handleCloseModal = () => {
    send({ type: "CLOSE" })
  }

  return (
    <ModalContext.Provider
      value={{
        activeModal,
        isRecordModalOpen,
        handleOpenModal,
        handleCloseModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModalContext() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error("useModalContext must be used within a ModalProvider")
  }
  return context
}
