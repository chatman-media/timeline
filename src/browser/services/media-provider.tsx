import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect,useMemo } from "react"

import { timelineMachine } from "@/timeline/services/timeline-machine"
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
  addFilesToTimeline: (files: MediaFile[]) => void
  isFileAdded: (file: MediaFile) => boolean
  areAllFilesAdded: (files: MediaFile[]) => boolean
}

const MediaContext = createContext<MediaContextType | null>(null)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaState, mediaSend] = useMachine(mediaMachine)
  const [_, timelineSend] = useMachine(timelineMachine)

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

  const includedFilePaths = useMemo(
    () => mediaState.context.includedFiles.map((file: MediaFile) => file.path),
    [mediaState.context.includedFiles],
  )

  const includeFiles = useMemo(
    () => (files: MediaFile[]) => {
      console.log("Including files:", files)
      mediaSend({ type: "INCLUDE_FILES", files })
    },
    [mediaSend],
  )

  const removeFile = useMemo(
    () => (path: string) => {
      console.log("Removing file:", path)
      mediaSend({ type: "REMOVE_FILE", path })
    },
    [mediaSend],
  )

  const clearFiles = useMemo(
    () => () => {
      console.log("Clearing all files")
      mediaSend({ type: "CLEAR_FILES" })
    },
    [mediaSend],
  )

  const addFilesToTimeline = useMemo(
    () => (files: MediaFile[]) => {
      const newFiles = files.filter((file) => !includedFilePaths.includes(file.path))
      console.log("Adding files to timeline:", {
        allFiles: files,
        newFiles,
        includedFilePaths,
      })
      if (newFiles.length > 0) {
        // Сначала добавляем в медиа
        mediaSend({ type: "INCLUDE_FILES", files: newFiles })
        // Затем добавляем на таймлайн
        console.log("Sending files to timeline machine:", newFiles)
        timelineSend({ type: "addMediaFiles", files: newFiles })
      }
    },
    [mediaSend, timelineSend, includedFilePaths],
  )

  const isFileAdded = useMemo(
    () => (file: MediaFile) => includedFilePaths.includes(file.path),
    [includedFilePaths],
  )

  const areAllFilesAdded = useMemo(
    () => (files: MediaFile[]) => files.every((file) => includedFilePaths.includes(file.path)),
    [includedFilePaths],
  )

  const value = useMemo(
    () => ({
      allMediaFiles: mediaState.context.allMediaFiles,
      includedFiles: mediaState.context.includedFiles,
      error: mediaState.context.error,
      isLoading: mediaState.context.isLoading,
      unavailableFiles: mediaState.context.unavailableFiles,
      includeFiles,
      removeFile,
      clearFiles,
      addFilesToTimeline,
      isFileAdded,
      areAllFilesAdded,
    }),
    [
      mediaState.context.allMediaFiles,
      mediaState.context.includedFiles,
      mediaState.context.error,
      mediaState.context.isLoading,
      mediaState.context.unavailableFiles,
      includeFiles,
      removeFile,
      clearFiles,
      addFilesToTimeline,
      isFileAdded,
      areAllFilesAdded,
    ],
  )

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider")
  }
  return context
}
