import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { browserInspector } from "@/media-editor/providers"
import { timelineMachine } from "@/timeline/services"
import { MediaFile } from "@/types/media"

import { mediaMachine } from "./media-machine"

interface MediaContextType {
  isLoading: boolean
  allMediaFiles: MediaFile[]
  includedFiles: MediaFile[]
  includedFilePaths: string[]
  unavailableFiles: MediaFile[]

  setLoading: (loading: boolean) => void

  setAllMediaFiles: (files: MediaFile[]) => void
  addMediaFiles: (files: MediaFile[]) => void
  removeMediaFiles: (files: MediaFile[]) => void

  setIncludedFiles: (files: MediaFile[]) => void
  includeFiles: (files: MediaFile[]) => void
  unincludeFiles: (files: MediaFile[]) => void

  setUnavailableFiles: (files: MediaFile[]) => void
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

interface MediaProviderProps {
  children: React.ReactNode
}

export function MediaProvider({ children }: MediaProviderProps) {
  const [state, send] = useMachine(mediaMachine, {
    inspect: browserInspector.inspect,
  })
  const [_, timelineSend] = useMachine(timelineMachine)

  return (
    <MediaContext.Provider
      value={{
        ...state.context,
        setLoading: (loading: boolean) => send({ type: "setLoading", loading }),
        setAllMediaFiles: (files: MediaFile[]) => send({ type: "setAllMediaFiles", files }),
        addMediaFiles: (files: MediaFile[]) => send({ type: "addMediaFiles", files }),
        removeMediaFiles: (files: MediaFile[]) => send({ type: "removeMediaFiles", files }),
        setIncludedFiles: (files: MediaFile[]) => send({ type: "setIncludedFiles", files }),
        includeFiles: (files: MediaFile[]) => {
          console.log("MediaProvider includeFiles:", files)
          send({ type: "includeFiles", files })
          console.log("MediaProvider sending to timeline:", files)
          timelineSend({ type: "addMediaFiles", files })
        },
        unincludeFiles: (files: MediaFile[]) => {
          send({ type: "unincludeFiles", files })
          // timelineSend({ type: "removeFiles", files })
        },
        setUnavailableFiles: (files: MediaFile[]) => send({ type: "setUnavailableFiles", files }),
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
