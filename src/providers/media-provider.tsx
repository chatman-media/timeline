import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { mediaMachine } from "@/machines"
import { MediaFile } from "@/types/videos"

interface MediaContextType {
  addedFiles: Set<string>
  filePaths: MediaFile[]
  isLoading: boolean
  handleAddFiles: (files: MediaFile[]) => void
  handleRemoveFiles: (files: MediaFile[]) => void
  handleSetLoadingState: (loading: boolean) => void
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

interface MediaProviderProps {
  children: React.ReactNode
}

export function MediaProvider({ children }: MediaProviderProps) {
  const [state, send] = useMachine(mediaMachine)

  const addedFiles = state.context.addedFiles
  const filePaths = state.context.filePaths
  const isLoading = state.context.isLoading

  const handleAddFiles = (files: MediaFile[]) => {
    send({ type: "ADD_FILES", files })
  }

  const handleRemoveFiles = (files: MediaFile[]) => {
    send({ type: "REMOVE_FILES", files })
  }

  const handleSetLoadingState = (loading: boolean) => {
    send({ type: "SET_LOADING", loading })
  }

  return (
    <MediaContext.Provider
      value={{
        addedFiles,
        filePaths,
        isLoading,
        handleAddFiles,
        handleRemoveFiles,
        handleSetLoadingState,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}

export function useMediaContext() {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error("useMediaContext must be used within a MediaProvider")
  }
  return context
}
