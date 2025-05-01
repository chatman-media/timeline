import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect } from "react"

import { MediaFile } from "@/types/media"

import { mediaMachine } from "./media-machine"

interface MediaContextType {
  allMediaFiles: MediaFile[]
  includedFiles: MediaFile[]
  error: string | null
  isLoading: boolean
  unavailableFiles: MediaFile[]
  includeFiles: (files: MediaFile[]) => void
  removeFile: (path: string) => void
  clearFiles: () => void
  isFileAdded: (file: MediaFile) => boolean
  areAllFilesAdded: (files: MediaFile[]) => boolean
}

const MediaContext = createContext<MediaContextType | null>(null)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaState, mediaSend] = useMachine(mediaMachine)
  // const { addMediaFiles: timelineAddMediaFiles } = useTimeline()

  // Добавляем логирование при изменении состояния
  useEffect(() => {
    console.log("Media state changed:", {
      allMediaFiles: mediaState.context.allMediaFiles,
      includedFiles: mediaState.context.includedFiles,
      isLoading: mediaState.context.isLoading,
      error: mediaState.context.error,
    })
  }, [mediaState.context])

  // Загружаем файлы при монтировании
  useEffect(() => {
    console.log("Fetching media files...")
    mediaSend({ type: "FETCH_MEDIA" })
  }, [mediaSend])

  const includedFilePaths = mediaState.context.includedFiles.map((file: MediaFile) => file.path)

  const includeFiles = (files: MediaFile[]) => {
    console.log("Including files:", files)
    mediaSend({ type: "INCLUDE_FILES", files })
  }

  const removeFile = (path: string) => {
    console.log("Removing file:", path)
    mediaSend({ type: "REMOVE_FILE", path })
  }

  const clearFiles = () => {
    console.log("Clearing all files")
    mediaSend({ type: "CLEAR_FILES" })
  }

  const isFileAdded = (file: MediaFile) => includedFilePaths.includes(file.path)

  const areAllFilesAdded = (files: MediaFile[]) =>
    files.every((file) => includedFilePaths.includes(file.path))

  const value = {
    allMediaFiles: mediaState.context.allMediaFiles,
    includedFiles: mediaState.context.includedFiles,
    error: mediaState.context.error,
    isLoading: mediaState.context.isLoading,
    unavailableFiles: mediaState.context.unavailableFiles,
    includeFiles,
    removeFile,
    clearFiles,
    isFileAdded,
    areAllFilesAdded,
  }

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider")
  }
  return context
}
