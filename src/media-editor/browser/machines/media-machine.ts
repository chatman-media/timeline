import { assign, createMachine, fromPromise } from "xstate"

import { MediaFile } from "@/types/media"

export type FavoritesType = {
  [key: string]: any[]
  media: MediaFile[]
  audio: MediaFile[]
  transition: any[]
  effect: any[]
  template: any[]
  filter: any[]
}

export type MediaContextType = {
  allMediaFiles: MediaFile[]
  includedFiles: MediaFile[]
  error: string | null
  isLoading: boolean
  unavailableFiles: MediaFile[]
  favorites: FavoritesType
}

export type MediaEventType =
  | { type: "INCLUDE_FILES"; files: MediaFile[] }
  | { type: "REMOVE_FILE"; path: string }
  | { type: "CLEAR_FILES" }
  | { type: "setAllMediaFiles"; files: MediaFile[] }
  | { type: "addMediaFiles"; files: MediaFile[] }
  | { type: "removeMediaFiles"; files: MediaFile[] }
  | { type: "setIncludedFiles"; files: MediaFile[] }
  | { type: "setUnavailableFiles"; files: MediaFile[] }
  | { type: "setLoading"; loading: boolean }
  | { type: "FETCH_MEDIA" }
  | { type: "RELOAD" }
  | { type: "ADD_TO_FAVORITES"; item: any; itemType: string }
  | { type: "REMOVE_FROM_FAVORITES"; item: any; itemType: string }
  | { type: "CLEAR_FAVORITES"; itemType?: string }

const fetchMedia = fromPromise(async () => {
  const response = await fetch("/api/media")
  if (!response.ok) {
    throw new Error(`Ошибка загрузки медиафайлов: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()

  if (!data || typeof data !== "object" || !("media" in data)) {
    throw new Error("Некорректный формат данных от сервера")
  }

  const files = data.media
  if (!Array.isArray(files)) {
    throw new Error("Некорректный формат данных от сервера")
  }

  const validFiles = files.filter(
    (file) => file && typeof file === "object" && (file.isVideo || file.isAudio || file.isImage),
  )

  if (validFiles.length === 0) {
    console.warn("Не найдено валидных медиафайлов")
  }

  return validFiles
})

export const mediaMachine = createMachine({
  id: "media",
  initial: "idle",
  context: {
    allMediaFiles: [],
    includedFiles: [],
    error: null,
    isLoading: false,
    unavailableFiles: [],
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
    },
  } as MediaContextType,
  states: {
    idle: {
      on: {
        FETCH_MEDIA: "loading",
      },
    },
    loading: {
      entry: assign({ isLoading: true, error: null }),
      invoke: {
        src: fetchMedia,
        onDone: {
          target: "loaded",
          actions: assign({
            allMediaFiles: ({ event }) => event.output,
            isLoading: false,
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
            isLoading: false,
          }),
        },
      },
    },
    loaded: {
      on: {
        INCLUDE_FILES: {
          actions: assign({
            includedFiles: ({ context, event }) => [...context.includedFiles, ...event.files],
          }),
        },
        REMOVE_FILE: {
          actions: assign({
            includedFiles: ({ context, event }) =>
              context.includedFiles.filter((f) => f.path !== event.path),
          }),
        },
        CLEAR_FILES: {
          actions: assign({
            includedFiles: [],
          }),
        },
        setAllMediaFiles: {
          actions: assign({
            allMediaFiles: ({ event }) => event.files,
          }),
        },
        addMediaFiles: {
          actions: assign({
            allMediaFiles: ({ context, event }) => [...context.allMediaFiles, ...event.files],
          }),
        },
        removeMediaFiles: {
          actions: assign({
            allMediaFiles: ({ context, event }) =>
              context.allMediaFiles.filter(
                (f) => !event.files.some((e: MediaFile) => e.path === f.path),
              ),
            includedFiles: ({ context, event }) =>
              context.includedFiles.filter(
                (f) => !event.files.some((e: MediaFile) => e.path === f.path),
              ),
          }),
        },
        setIncludedFiles: {
          actions: assign({
            includedFiles: ({ event }) => event.files,
          }),
        },
        setUnavailableFiles: {
          actions: assign({
            unavailableFiles: ({ event }) => event.files,
          }),
        },
        setLoading: {
          actions: assign({
            isLoading: ({ event }) => event.loading,
          }),
        },
        ADD_TO_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const { item, itemType } = event
              const currentFavorites = { ...context.favorites }

              // Создаем массив, если его еще нет
              if (!currentFavorites[itemType]) {
                currentFavorites[itemType] = []
              }

              // Проверяем, есть ли уже такой элемент в избранном
              const isAlreadyFavorite = currentFavorites[itemType].some(
                (favItem: any) => favItem.id === item.id,
              )

              // Если элемента еще нет в избранном, добавляем его
              if (!isAlreadyFavorite) {
                currentFavorites[itemType] = [...currentFavorites[itemType], item]
              }

              return currentFavorites
            },
          }),
        },
        REMOVE_FROM_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const { item, itemType } = event
              const currentFavorites = { ...context.favorites }

              // Если массив существует, удаляем элемент
              if (currentFavorites[itemType]) {
                currentFavorites[itemType] = currentFavorites[itemType].filter(
                  (favItem: any) => favItem.id !== item.id,
                )
              }

              return currentFavorites
            },
          }),
        },
        CLEAR_FAVORITES: {
          actions: assign({
            favorites: ({ context, event }) => {
              const currentFavorites = { ...context.favorites }

              // Если указан тип, очищаем только его
              if (event.itemType) {
                currentFavorites[event.itemType] = []
              } else {
                // Иначе очищаем все типы
                Object.keys(currentFavorites).forEach((key) => {
                  currentFavorites[key] = []
                })
              }

              return currentFavorites
            },
          }),
        },
        RELOAD: "loading",
      },
    },
    error: {
      on: {
        RELOAD: "loading",
      },
    },
  },
})
