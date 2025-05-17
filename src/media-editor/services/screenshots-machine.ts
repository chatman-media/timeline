import { assign, createMachine } from "xstate"

import { screenshotsIndexedDBService } from "./screenshots-indexeddb-service"

// Интерфейс для информации о детекции объекта
export interface ObjectDetection {
  class_id: number
  class_name: string
  confidence: number
  bbox: [number, number, number, number] // [x1, y1, x2, y2]
}

// Интерфейс для информации о скриншоте
export interface Screenshot {
  path: string
  timestamp: number
  frame: number
  type: "initial" | "regular"
  detections?: ObjectDetection[]
}

// Интерфейс для информации о видео
export interface VideoScreenshotData {
  videoId: string
  videoPath?: string
  videoName?: string
  duration?: number
  fps?: number
  frameCount?: number
  screenshotsGenerated: boolean
  objectsDetected: boolean
  screenshotCount: number
  detectionCount: number
  screenshots: Screenshot[]
}

// Интерфейс для контекста машины состояний
export interface ScreenshotsMachineContext {
  videos: Record<string, VideoScreenshotData>
}

// Типы событий для машины состояний
export type ScreenshotsMachineEvent =
  | { type: "SCREENSHOT_GENERATION_START"; videoId: string; videoName?: string; videoPath?: string }
  | {
      type: "SCREENSHOT_GENERATION_COMPLETE"
      videoId: string
      videoName?: string
      duration?: number
      fps?: number
      frameCount?: number
      screenshots: Screenshot[]
    }
  | { type: "SCREENSHOT_GENERATION_ERROR"; videoId: string; error: string }
  | { type: "OBJECT_DETECTION_START"; videoId: string; screenshotCount: number }
  | { type: "OBJECT_DETECTION_COMPLETE"; videoId: string; detectionResults: any }
  | { type: "OBJECT_DETECTION_ERROR"; videoId: string; error: string }
  | { type: "LOAD_VIDEO_DATA"; videoId: string; data: Partial<VideoScreenshotData> }
  | { type: "CLEAR_VIDEO_DATA"; videoId: string }
  | { type: "CLEAR_ALL_DATA" }
  | { type: "PERSIST_STATE" }
  | { type: "RESTORE_STATE"; state: Partial<ScreenshotsMachineContext> }

// Начальный контекст
const initialContext: ScreenshotsMachineContext = {
  videos: {},
}

// Функция для сохранения состояния в IndexedDB
const saveStateToIndexedDB = (context: ScreenshotsMachineContext) => {
  // Запускаем асинхронное сохранение, но не ждем его завершения
  screenshotsIndexedDBService
    .saveScreenshotsState(context)
    .then(() => {
      console.log(`[ScreenshotsMachine] Состояние сохранено в IndexedDB`)
    })
    .catch((error) => {
      console.error(`[ScreenshotsMachine] Ошибка при сохранении состояния в IndexedDB:`, error)
    })
}

// Функция для загрузки состояния из IndexedDB
const loadStateFromIndexedDB = async (): Promise<Partial<ScreenshotsMachineContext>> => {
  try {
    const state = await screenshotsIndexedDBService.loadScreenshotsState()
    if (state) {
      console.log(`[ScreenshotsMachine] Состояние загружено из IndexedDB`)
      return state
    }
    console.log(`[ScreenshotsMachine] В IndexedDB нет сохраненного состояния`)
    return { videos: {} }
  } catch (error) {
    console.error(`[ScreenshotsMachine] Ошибка при загрузке состояния из IndexedDB:`, error)
    // Возвращаем пустое состояние вместо null, чтобы избежать ошибок
    return { videos: {} }
  }
}

// Создаем машину состояний
export const screenshotsMachine = createMachine({
  id: "screenshots",
  initial: "loading",
  context: initialContext,
  types: {
    context: {} as ScreenshotsMachineContext,
    events: {} as ScreenshotsMachineEvent,
  },
  states: {
    loading: {
      invoke: {
        src: () => {
          return screenshotsIndexedDBService
            .loadScreenshotsState()
            .then((state) => {
              console.log(`[ScreenshotsMachine] Состояние загружено из IndexedDB`)
              return state
            })
            .catch((error) => {
              console.error(
                `[ScreenshotsMachine] Ошибка при загрузке состояния из IndexedDB:`,
                error,
              )
              // В случае ошибки возвращаем пустое состояние
              return { videos: {} }
            })
        },
        onDone: {
          target: "idle",
          actions: assign({
            videos: (_, event) => event.data.videos || {},
          }),
        },
      },
    },
    idle: {},
  },
  on: {
    // Обработчик начала генерации скриншотов
    SCREENSHOT_GENERATION_START: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, videoName, videoPath } = event
          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {}),
                videoId,
                videoName,
                videoPath,
                screenshotsGenerated: false,
                objectsDetected: false,
                screenshotCount: 0,
                detectionCount: 0,
                screenshots: context.videos[videoId]?.screenshots || [],
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик завершения генерации скриншотов
    SCREENSHOT_GENERATION_COMPLETE: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, videoName, duration, fps, frameCount, screenshots } = event
          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {}),
                videoId,
                videoName,
                duration,
                fps,
                frameCount,
                screenshotsGenerated: true,
                screenshotCount: screenshots.length,
                screenshots,
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик ошибки генерации скриншотов
    SCREENSHOT_GENERATION_ERROR: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, error } = event
          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {}),
                videoId,
                screenshotsGenerated: false,
                error,
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик начала распознавания объектов
    OBJECT_DETECTION_START: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, screenshotCount } = event
          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {}),
                videoId,
                objectsDetected: false,
                screenshotCount,
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик завершения распознавания объектов
    OBJECT_DETECTION_COMPLETE: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, detectionResults } = event

          // Получаем текущие скриншоты
          const currentScreenshots = context.videos[videoId]?.screenshots || []

          // Обновляем скриншоты с информацией о детекциях
          const updatedScreenshots = currentScreenshots.map((screenshot) => {
            // Находим соответствующий результат детекции по пути к скриншоту
            const detectionResult = detectionResults.results?.find(
              (result: any) => result.image_path === screenshot.path,
            )

            if (detectionResult) {
              return {
                ...screenshot,
                detections: detectionResult.detections || [],
              }
            }

            return screenshot
          })

          // Подсчитываем общее количество детекций
          const detectionCount = updatedScreenshots.reduce(
            (sum, screenshot) => sum + (screenshot.detections?.length || 0),
            0,
          )

          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {}),
                videoId,
                objectsDetected: true,
                detectionCount,
                screenshots: updatedScreenshots,
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик ошибки распознавания объектов
    OBJECT_DETECTION_ERROR: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, error } = event
          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {}),
                videoId,
                objectsDetected: false,
                error,
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик загрузки данных о видео
    LOAD_VIDEO_DATA: {
      actions: [
        assign(({ context, event }) => {
          const { videoId, data } = event
          const updatedContext = {
            videos: {
              ...context.videos,
              [videoId]: {
                ...(context.videos[videoId] || {
                  videoId,
                  screenshotsGenerated: false,
                  objectsDetected: false,
                  screenshotCount: 0,
                  detectionCount: 0,
                  screenshots: [],
                }),
                ...data,
              },
            },
          }

          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик очистки данных о видео
    CLEAR_VIDEO_DATA: {
      actions: [
        assign(({ context, event }) => {
          const { videoId } = event
          const { [videoId]: _, ...restVideos } = context.videos

          const updatedContext = {
            videos: restVideos,
          }

          // Сохраняем обновленное состояние в IndexedDB
          saveStateToIndexedDB(updatedContext)

          return updatedContext
        }),
      ],
    },

    // Обработчик очистки всех данных
    CLEAR_ALL_DATA: {
      actions: [
        assign((_context) => {
          const emptyContext = {
            videos: {},
          }

          // Сохраняем пустое состояние в IndexedDB
          saveStateToIndexedDB(emptyContext)

          return emptyContext
        }),
      ],
    },

    // Обработчик сохранения состояния
    PERSIST_STATE: {
      actions: [
        (context) => {
          // Сохраняем состояние в IndexedDB
          saveStateToIndexedDB(context)
        },
      ],
    },

    // Обработчик восстановления состояния
    RESTORE_STATE: {
      actions: [
        assign(({ event }) => {
          if (event.type !== "RESTORE_STATE") return {}

          // Сохраняем состояние в IndexedDB
          if (event.state) {
            saveStateToIndexedDB(event.state)
          }

          return event.state
        }),
      ],
    },
  },
})

// Экспортируем машину состояний
export { screenshotsMachine }
