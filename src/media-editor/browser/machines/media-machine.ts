import { assign, createMachine, fromPromise } from "xstate"

import { indexedDBService } from "@/media-editor/browser/services/indexed-db-service"
import { socketService } from "@/media-editor/browser/services/socket-service"
import { MediaFile } from "@/types/media"
import { FileWatcherData,FileWatcherEvent } from "@/types/socket"

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
  error: string | null
  isLoading: boolean
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
  | { type: "CONNECT_SOCKET" }
  | { type: "DISCONNECT_SOCKET" }
  | { type: "FILE_ADDED"; data: FileWatcherData }
  | { type: "FILE_CHANGED"; data: FileWatcherData }
  | { type: "FILE_REMOVED"; data: FileWatcherData }

const fetchMedia = fromPromise(async () => {
  try {
    // Проверяем, есть ли данные в IndexedDB и не устарели ли они
    const shouldRefresh = await indexedDBService.shouldRefreshData()

    // Если данные есть и они не устарели, используем их
    if (!shouldRefresh) {
      const cachedFiles = await indexedDBService.loadMediaFiles()
      if (cachedFiles && cachedFiles.length > 0) {
        console.log(`[mediaMachine] Используем ${cachedFiles.length} файлов из IndexedDB`)
        return cachedFiles
      }
    }

    // Если данных нет или они устарели, загружаем с сервера
    console.log("[mediaMachine] Загружаем файлы с сервера")
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

    // Обновляем временную метку проверки для всех файлов
    const filesWithTimestamp = indexedDBService.updateLastCheckedTimestamp(validFiles)

    // Сохраняем файлы в IndexedDB
    await indexedDBService.saveMediaFiles(filesWithTimestamp)

    return filesWithTimestamp
  } catch (error) {
    console.error("[mediaMachine] Ошибка при загрузке файлов:", error)

    // В случае ошибки пытаемся загрузить из кэша
    const cachedFiles = await indexedDBService.loadMediaFiles()
    if (cachedFiles && cachedFiles.length > 0) {
      console.log(`[mediaMachine] Используем ${cachedFiles.length} файлов из кэша после ошибки`)
      return cachedFiles
    }

    // Если и в кэше ничего нет, пробрасываем ошибку дальше
    throw error
  }
})

// Обработчик события добавления файла
const handleFileAdded = (data: FileWatcherData) => {
  console.log(`[mediaMachine] Файл добавлен: ${data.path}`)

  // Проверяем, является ли файл медиафайлом или музыкой
  const isMediaFile = data.path.startsWith("/media/")
  const isMusicFile = data.path.startsWith("/music/")

  if (!isMediaFile && !isMusicFile) {
    return
  }

  // Перезагружаем медиафайлы
  return { type: "RELOAD" }
}

// Обработчик события изменения файла
const handleFileChanged = (data: FileWatcherData) => {
  console.log(`[mediaMachine] Файл изменен: ${data.path}`)

  // Проверяем, является ли файл медиафайлом или музыкой
  const isMediaFile = data.path.startsWith("/media/")
  const isMusicFile = data.path.startsWith("/music/")

  if (!isMediaFile && !isMusicFile) {
    return
  }

  // Перезагружаем медиафайлы
  return { type: "RELOAD" }
}

// Обработчик события удаления файла
const handleFileRemoved = (data: FileWatcherData) => {
  console.log(`[mediaMachine] Файл удален: ${data.path}`)

  // Проверяем, является ли файл медиафайлом или музыкой
  const isMediaFile = data.path.startsWith("/media/")
  const isMusicFile = data.path.startsWith("/music/")

  if (!isMediaFile && !isMusicFile) {
    return
  }

  // Перезагружаем медиафайлы
  return { type: "RELOAD" }
}

export const mediaMachine = createMachine({
  id: "media",
  initial: "idle",
  context: {
    allMediaFiles: [],
    error: null,
    isLoading: false,
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
        CONNECT_SOCKET: {
          actions: () => {
            // Подключаемся к Socket.IO серверу
            socketService.connect()

            // Регистрируем обработчики событий
            socketService.on(FileWatcherEvent.MEDIA_ADDED, (data) => {
              console.log(`[mediaMachine] Медиафайл добавлен: ${data.path}`)
              return { type: "RELOAD" }
            })

            socketService.on(FileWatcherEvent.MEDIA_CHANGED, (data) => {
              console.log(`[mediaMachine] Медиафайл изменен: ${data.path}`)
              return { type: "RELOAD" }
            })

            socketService.on(FileWatcherEvent.MEDIA_REMOVED, (data) => {
              console.log(`[mediaMachine] Медиафайл удален: ${data.path}`)
              return { type: "RELOAD" }
            })

            socketService.on(FileWatcherEvent.MUSIC_ADDED, (data) => {
              console.log(`[mediaMachine] Музыкальный файл добавлен: ${data.path}`)
              return { type: "RELOAD" }
            })

            socketService.on(FileWatcherEvent.MUSIC_CHANGED, (data) => {
              console.log(`[mediaMachine] Музыкальный файл изменен: ${data.path}`)
              return { type: "RELOAD" }
            })

            socketService.on(FileWatcherEvent.MUSIC_REMOVED, (data) => {
              console.log(`[mediaMachine] Музыкальный файл удален: ${data.path}`)
              return { type: "RELOAD" }
            })
          },
        },
        DISCONNECT_SOCKET: {
          actions: () => {
            // Отключаемся от Socket.IO сервера
            socketService.disconnect()
          },
        },
        FILE_ADDED: {
          actions: ({ event }) => {
            if (event.type === "FILE_ADDED") {
              const result = handleFileAdded(event.data)
              if (result) {
                return result
              }
            }
          },
        },
        FILE_CHANGED: {
          actions: ({ event }) => {
            if (event.type === "FILE_CHANGED") {
              const result = handleFileChanged(event.data)
              if (result) {
                return result
              }
            }
          },
        },
        FILE_REMOVED: {
          actions: ({ event }) => {
            if (event.type === "FILE_REMOVED") {
              const result = handleFileRemoved(event.data)
              if (result) {
                return result
              }
            }
          },
        },
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
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  if (isInEventFiles) {
                    return {
                      ...file,
                      isIncluded: true,
                      lastCheckedAt: Date.now(), // Обновляем временную метку
                    }
                  }
                  return file
                })
              },
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
        },
        REMOVE_FILE: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                return context.allMediaFiles.map((file) => {
                  if (file.path === event.path) {
                    return {
                      ...file,
                      isIncluded: false,
                      lastCheckedAt: Date.now(), // Обновляем временную метку
                    }
                  }
                  return file
                })
              },
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
        },
        CLEAR_FILES: {
          actions: [
            assign({
              allMediaFiles: ({ context }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  return {
                    ...file,
                    isIncluded: false,
                    lastCheckedAt: now, // Обновляем временную метку
                  }
                })
              },
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
        },
        setAllMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ event }) => event.files,
            }),
            // Сохраняем файлы в IndexedDB
            ({ event }) => {
              indexedDBService.saveMediaFiles(event.files)
            },
          ],
        },
        addMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                // Обновляем временную метку проверки для новых файлов
                const filesWithTimestamp = indexedDBService.updateLastCheckedTimestamp(event.files)
                return [...context.allMediaFiles, ...filesWithTimestamp]
              },
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
        },
        removeMediaFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) =>
                context.allMediaFiles.filter(
                  (f) => !event.files.some((e: MediaFile) => e.path === f.path),
                ),
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
        },
        setIncludedFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  return {
                    ...file,
                    isIncluded: isInEventFiles,
                    lastCheckedAt: now, // Обновляем временную метку
                  }
                })
              },
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
        },
        setUnavailableFiles: {
          actions: [
            assign({
              allMediaFiles: ({ context, event }) => {
                const now = Date.now()
                return context.allMediaFiles.map((file) => {
                  const isInEventFiles = event.files.some((f: MediaFile) => f.path === file.path)
                  if (isInEventFiles) {
                    return {
                      ...file,
                      isUnavailable: true,
                      lastCheckedAt: now, // Обновляем временную метку
                    }
                  }
                  return file
                })
              },
            }),
            // Сохраняем обновленные файлы в IndexedDB
            ({ context }) => {
              indexedDBService.saveMediaFiles(context.allMediaFiles)
            },
          ],
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
