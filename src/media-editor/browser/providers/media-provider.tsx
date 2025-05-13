import { useMachine } from "@xstate/react"
import { createContext, useEffect } from "react"

import { FavoritesType, mediaMachine } from "@/media-editor/browser/machines/media-machine"
import { MediaFile } from "@/types/media"

type MediaContextType = {
  allMediaFiles: MediaFile[]
  includedFiles: MediaFile[]
  error: string | null
  isLoading: boolean
  unavailableFiles: MediaFile[]
  favorites: FavoritesType

  includeFiles: (files: MediaFile[]) => void
  removeFile: (path: string) => void
  clearFiles: () => void
  isFileAdded: (file: MediaFile) => boolean
  areAllFilesAdded: (files: MediaFile[]) => boolean
  reload: () => void

  // Методы для работы с избранным
  addToFavorites: (item: any, itemType: string) => void
  removeFromFavorites: (item: any, itemType: string) => void
  clearFavorites: (itemType?: string) => void
  isItemFavorite: (item: any, itemType: string) => boolean
}

export const MediaContext = createContext<MediaContextType | null>(null)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaState, mediaSend] = useMachine(mediaMachine)

  // Добавляем логирование при изменении состояния
  useEffect(() => {
    console.log("Media state changed:", {
      allMediaFiles: mediaState.context.allMediaFiles,
      includedFiles: mediaState.context.includedFiles,
      isLoading: mediaState.context.isLoading,
      error: mediaState.context.error,
      favorites: mediaState.context.favorites,
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

  const reload = () => {
    console.log("Reloading media files")
    mediaSend({ type: "RELOAD" })
  }

  const isFileAdded = (file: MediaFile) => includedFilePaths.includes(file.path)

  const areAllFilesAdded = (files: MediaFile[]) =>
    files.every((file) => includedFilePaths.includes(file.path))

  // Методы для работы с избранным
  const addToFavorites = (item: any, itemType: string) => {
    mediaSend({ type: "ADD_TO_FAVORITES", item, itemType })
  }

  const removeFromFavorites = (item: any, itemType: string) => {
    mediaSend({ type: "REMOVE_FROM_FAVORITES", item, itemType })
  }

  const clearFavorites = (itemType?: string) => {
    mediaSend({ type: "CLEAR_FAVORITES", itemType })
  }

  const isItemFavorite = (item: any, itemType: string) => {
    const favorites = mediaState.context.favorites
    if (!favorites || !favorites[itemType]) return false

    return favorites[itemType].some((favItem: any) => favItem.id === item.id)
  }

  const value = {
    allMediaFiles: mediaState.context.allMediaFiles,
    includedFiles: mediaState.context.includedFiles,
    error: mediaState.context.error,
    isLoading: mediaState.context.isLoading,
    unavailableFiles: mediaState.context.unavailableFiles,
    favorites: mediaState.context.favorites,
    includeFiles,
    removeFile,
    clearFiles,
    isFileAdded,
    areAllFilesAdded,
    reload,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    isItemFavorite,
  }

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}
