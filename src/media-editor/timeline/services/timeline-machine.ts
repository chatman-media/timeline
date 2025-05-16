import { assign, createMachine, fromPromise } from "xstate"
import { timelineIndexedDBService } from "./timeline-indexed-db-service"

import { VideoEffect } from "@/media-editor/browser/components/tabs/effects/effects"
import { VideoFilter } from "@/media-editor/browser/components/tabs/filters/filters"
import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { createTracksFromFiles, Sector } from "@/media-editor/browser/utils/media-files"
import {
  convertSectorsToEditSegments,
  createTracksFromTemplate,
  generateConcatCommand,
  generateSegmentCommand,
} from "@/media-editor/timeline/utils/edit-schema-utils"
import { EditResource, EditSegment, EditTrack } from "@/types/edit-schema"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import {
  createEffectResource,
  createFilterResource,
  createMusicResource,
  createTemplateResource,
  createTransitionResource,
  TimelineResource,
} from "@/types/resources"
import { TimeRange } from "@/types/time-range"
import { TransitionEffect } from "@/types/transitions"

// Интерфейс для сообщений чата
export interface ChatMessage {
  id: string
  text: string
  sender: "user" | "agent"
  agentId?: string
  timestamp: string
  isProcessing?: boolean
}

export interface TimelineContext {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  trackVisibility: Record<string, boolean> // Видимость дорожек
  trackLocked: Record<string, boolean> // Блокировка дорожек
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  sectors: Sector[]
  activeSector: Sector | null // Активный сектор
  sectorTimes: Record<string, number> // Время для каждого сектора
  sectorZoomLevels: Record<string, number> // Масштаб для каждого сектора
  canUndo: boolean
  canRedo: boolean
  videoRefs: Record<string, HTMLVideoElement | null>
  loadedVideos: Record<string, boolean>
  previousStates: TimelineContext[]
  currentStateIndex: number

  // Ресурсы
  resources: TimelineResource[] // Все добавленные ресурсы
  effectResources: TimelineResource[] // Эффекты
  filterResources: TimelineResource[] // Фильтры
  transitionResources: TimelineResource[] // Переходы
  templateResources: TimelineResource[] // Шаблоны
  musicResources: TimelineResource[] // Музыкальные файлы

  // Схема монтажа
  editSegments: EditSegment[] // Последовательность сегментов монтажа
  activeEditSegmentId: string | null // Активный сегмент монтажа

  // Чат
  chatMessages: ChatMessage[] // Сообщения чата
  selectedAgentId: string | null // Выбранный агент
}

export type TimelineEvent =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "ZOOM"; level: number }
  | { type: "FIT_TO_SCREEN"; containerWidth: number }
  | { type: "SET_TIME_RANGES"; ranges: Record<string, TimeRange[]> }
  | { type: "SET_ACTIVE_TRACK"; trackId: string | null }
  | { type: "SET_ACTIVE_SECTOR"; sectorId: string | null }
  | { type: "SEEK"; time: number }
  | { type: "SET_TRACK_VOLUME"; trackId: string; volume: number }
  | { type: "SET_SEEKING"; isSeeking: boolean }
  | { type: "SET_CHANGING_CAMERA"; isChangingCamera: boolean }
  | { type: "ADD_MEDIA_FILES"; files: MediaFile[] }
  | { type: "REMOVE_MEDIA_FILE"; fileId: string }
  | { type: "SET_VIDEO_REF"; fileId: string; video: HTMLVideoElement | null }
  | { type: "SET_LOADED_VIDEO"; fileId: string; loaded: boolean }
  | { type: "PRELOAD_ALL_VIDEOS" }
  | { type: "SAVE_ALL_SECTORS_TIME"; videoId: string; displayTime: number; currentTime: number }
  | { type: "SET_SECTOR_TIME"; sectorId: string; time: number; isActiveOnly?: boolean }
  // События для чата
  | { type: "SEND_CHAT_MESSAGE"; message: string }
  | { type: "RECEIVE_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "SELECT_AGENT"; agentId: string }
  | { type: "SET_TRACKS"; tracks: Track[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "PERSIST_STATE" }
  | { type: "RESTORE_STATE"; state: Partial<TimelineContext> }
  // События для работы с ресурсами
  | { type: "ADD_EFFECT"; effect: VideoEffect }
  | { type: "ADD_FILTER"; filter: VideoFilter }
  | { type: "ADD_TRANSITION"; transition: TransitionEffect }
  | { type: "ADD_TEMPLATE"; template: MediaTemplate }
  | { type: "ADD_MUSIC"; file: MediaFile }
  | { type: "REMOVE_RESOURCE"; resourceId: string }
  | { type: "UPDATE_RESOURCE"; resourceId: string; params: Record<string, any> }
  // События для работы со схемой монтажа
  | { type: "ADD_EDIT_SEGMENT"; segment: EditSegment }
  | { type: "UPDATE_EDIT_SEGMENT"; segmentId: string; updates: Partial<EditSegment> }
  | { type: "REMOVE_EDIT_SEGMENT"; segmentId: string }
  | { type: "REORDER_EDIT_SEGMENTS"; segmentIds: string[] }
  | { type: "SET_ACTIVE_EDIT_SEGMENT"; segmentId: string | null }
  | { type: "ADD_EDIT_TRACK"; segmentId: string; track: EditTrack }
  | { type: "UPDATE_EDIT_TRACK"; segmentId: string; trackId: string; updates: Partial<EditTrack> }
  | { type: "REMOVE_EDIT_TRACK"; segmentId: string; trackId: string }
  | { type: "ADD_EDIT_RESOURCE"; segmentId: string; trackId: string; resource: EditResource }
  | {
      type: "UPDATE_EDIT_RESOURCE"
      segmentId: string
      trackId: string
      resourceId: string
      updates: Partial<EditResource>
    }
  | { type: "REMOVE_EDIT_RESOURCE"; segmentId: string; trackId: string; resourceId: string }
  | {
      type: "APPLY_TEMPLATE_TO_SEGMENT"
      segmentId: string
      templateId: string
      params?: Record<string, any>
    }
  | { type: "GENERATE_FFMPEG_COMMAND"; outputPath: string }
  | { type: "CONVERT_SECTORS_TO_EDIT_SEGMENTS" }
  | { type: "SET_SECTOR_ZOOM"; sectorId: string; zoomLevel: number }
  | { type: "SET_TRACK_VISIBILITY"; trackId: string; visible: boolean }
  | { type: "SET_TRACK_LOCKED"; trackId: string; locked: boolean }
  | { type: "FIT_SECTOR_TO_SCREEN"; sectorId: string; containerWidth: number }

const initialContext: TimelineContext = {
  isDirty: false,
  zoomLevel: 1,
  timeRanges: {},
  activeTrackId: null,
  trackVolumes: {},
  trackVisibility: {}, // Видимость дорожек (по умолчанию все видимы)
  trackLocked: {}, // Блокировка дорожек (по умолчанию все разблокированы)
  isSeeking: false,
  isChangingCamera: false,
  tracks: [],
  sectors: [],
  activeSector: null, // Активный сектор
  sectorTimes: {}, // Время для каждого сектора
  sectorZoomLevels: {}, // Масштаб для каждого сектора
  canUndo: false,
  canRedo: false,
  videoRefs: {},
  loadedVideos: {},
  previousStates: [],
  currentStateIndex: -1,

  // Ресурсы
  resources: [],
  effectResources: [],
  filterResources: [],
  transitionResources: [],
  templateResources: [],
  musicResources: [],

  // Схема монтажа
  editSegments: [],
  activeEditSegmentId: null,

  // Чат
  chatMessages: [],
  selectedAgentId: null,
}

const addToHistory = ({
  context,
  newState,
}: {
  context: TimelineContext
  newState: Partial<TimelineContext>
}): TimelineContext => {
  const newStates = context.previousStates.slice(0, context.currentStateIndex + 1)
  const updatedContext = {
    ...context,
    ...newState,
    previousStates: [...newStates, { ...context, ...newState }],
    currentStateIndex: context.currentStateIndex + 1,
    canUndo: true,
    canRedo: false,
    isDirty: true,
  }

  // Сохраняем состояние в IndexedDB
  timelineIndexedDBService.saveTimelineState(updatedContext)

  return updatedContext
}

// Функция для загрузки состояния таймлайна из IndexedDB
const loadTimelineState = fromPromise(async () => {
  try {
    // Загружаем состояние из IndexedDB
    const state = await timelineIndexedDBService.loadTimelineState()
    if (state && Object.keys(state).length > 0) {
      console.log(`[timelineMachine] Состояние таймлайна загружено из IndexedDB`)
      return state
    }
    console.log("[timelineMachine] В IndexedDB нет сохраненного состояния таймлайна")
    return null
  } catch (error) {
    console.error("[timelineMachine] Ошибка при загрузке состояния таймлайна:", error)
    return null
  }
})

export const timelineMachine = createMachine({
  id: "timeline",
  initial: "initializing", // Начинаем с инициализации
  context: initialContext,
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  states: {
    // Добавляем состояние initializing для загрузки данных из IndexedDB
    initializing: {
      invoke: {
        src: loadTimelineState,
        onDone: {
          target: "idle",
          actions: [
            assign(({ event }) => {
              const loadedState = event.output
              if (loadedState) {
                console.log("[timelineMachine] Восстанавливаем состояние из IndexedDB")
                return {
                  ...initialContext,
                  ...loadedState,
                }
              }
              return initialContext
            }),
          ],
        },
        onError: {
          target: "idle",
          actions: [
            ({ event }) => {
              if (event && event.error) {
                console.error("[timelineMachine] Ошибка при загрузке состояния:", event.error)
              } else {
                console.error("[timelineMachine] Неизвестная ошибка при загрузке состояния")
              }
            },
          ],
        },
      },
    },
    idle: {
      on: {
        PLAY: "playing",
        RESTORE_STATE: {
          guard: ({ event }) => {
            return event.type === "RESTORE_STATE" && Object.keys(event.state).length > 0
          },
          actions: [
            assign(({ event }) => {
              const restoredState = {
                ...initialContext,
                ...(event.type === "RESTORE_STATE" ? event.state : {}),
              }

              // Сохраняем восстановленное состояние в IndexedDB
              timelineIndexedDBService.saveTimelineState(restoredState)

              return restoredState
            }),
          ],
        },
      },
    },
    playing: {
      on: {
        PAUSE: "paused",
        SEEK: {
          actions: assign({ isSeeking: true }),
        },
      },
    },
    paused: {
      on: {
        PLAY: "playing",
      },
    },
    loading: {
      on: {
        SET_LOADED_VIDEO: {
          target: "idle",
          actions: [
            assign({
              loadedVideos: ({ context, event }) => ({
                ...context.loadedVideos,
                [event.fileId]: event.loaded,
              }),
            }),
          ],
        },
      },
    },
  },
  on: {
    ZOOM: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ZOOM") return context
          return addToHistory({
            context,
            newState: { zoomLevel: event.level },
          })
        }),
      ],
    },
    SET_SECTOR_ZOOM: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SET_SECTOR_ZOOM") return context

          // Обновляем масштаб для конкретного сектора
          const newSectorZoomLevels = {
            ...context.sectorZoomLevels,
            [event.sectorId]: event.zoomLevel,
          }

          console.log(
            `[TimelineMachine] Установлен масштаб ${event.zoomLevel} для сектора ${event.sectorId}`,
          )

          return { sectorZoomLevels: newSectorZoomLevels }
        }),
      ],
    },
    SET_TRACK_VISIBILITY: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SET_TRACK_VISIBILITY") return context

          // Обновляем видимость дорожки
          const newTrackVisibility = {
            ...context.trackVisibility,
            [event.trackId]: event.visible,
          }

          console.log(
            `[TimelineMachine] Установлена видимость ${event.visible} для дорожки ${event.trackId}`,
          )

          return { trackVisibility: newTrackVisibility }
        }),
      ],
    },
    SET_TRACK_LOCKED: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SET_TRACK_LOCKED") return context

          // Обновляем блокировку дорожки
          const newTrackLocked = {
            ...context.trackLocked,
            [event.trackId]: event.locked,
          }

          console.log(
            `[TimelineMachine] Установлена блокировка ${event.locked} для дорожки ${event.trackId}`,
          )

          return { trackLocked: newTrackLocked }
        }),
      ],
    },
    FIT_SECTOR_TO_SCREEN: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "FIT_SECTOR_TO_SCREEN") return context

          // Находим сектор по ID
          const sector = context.sectors.find((s) => s.id === event.sectorId)

          // Если сектор не найден, возвращаем текущий контекст
          if (!sector) {
            console.warn(`[TimelineMachine] Сектор с ID ${event.sectorId} не найден`)
            return context
          }

          // Находим минимальное время начала видео в секторе
          const minStartTime = Math.min(
            ...sector.tracks.flatMap((t) => (t.videos || []).map((v) => v.startTime || 0)),
            sector.startTime || 0, // Используем startTime сектора как запасной вариант
          )

          // Находим максимальное время окончания видео в секторе
          const maxEndTime = Math.max(
            ...sector.tracks.flatMap((t) =>
              (t.videos || []).map((v) => (v.startTime || 0) + (v.duration || 0)),
            ),
            sector.endTime || 0, // Используем endTime сектора как запасной вариант
          )

          // Вычисляем длительность секции
          const sectionDuration = maxEndTime - minStartTime

          // Вычисляем ширину контейнера для скролла
          const containerWidth = event.containerWidth

          // Вычисляем новый масштаб, чтобы секция поместилась в контейнер
          // Формула: containerWidth = sectionDuration * 2 * newZoomLevel
          // Отсюда: newZoomLevel = containerWidth / (sectionDuration * 2)
          // Добавляем небольшой отступ (90%), чтобы видео не занимало всю ширину контейнера
          const newZoomLevel = (containerWidth * 0.9) / (sectionDuration * 2)

          // Ограничиваем минимальный и максимальный уровень масштаба
          // Минимальный уровень: 0.005 (24 часа на всю ширину)
          // Максимальный уровень: 200 (2 секунды на всю ширину)
          const clampedZoomLevel = Math.max(0.005, Math.min(200, newZoomLevel))

          console.log(
            `[TimelineMachine] Установлен масштаб ${clampedZoomLevel} для сектора ${event.sectorId} (подгонка под экран)`,
          )

          // Обновляем масштаб для конкретного сектора
          const newSectorZoomLevels = {
            ...context.sectorZoomLevels,
            [event.sectorId]: clampedZoomLevel,
          }

          return { sectorZoomLevels: newSectorZoomLevels }
        }),
      ],
    },
    FIT_TO_SCREEN: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "FIT_TO_SCREEN") return context

          // Находим максимальную длительность среди всех секторов
          let maxDuration = 0
          context.sectors.forEach((sector) => {
            const sectorDuration = Math.max(
              ...sector.tracks.map((track) => track.combinedDuration || 0),
              0, // Добавляем 0 как минимальное значение, чтобы избежать ошибок с пустыми массивами
            )
            maxDuration = Math.max(maxDuration, sectorDuration)
          })

          // Если нет секторов или треков, используем минимальную длительность
          if (maxDuration === 0) {
            maxDuration = 60 // Минимальная длительность 60 секунд
          }

          // Рассчитываем новый уровень масштаба
          // Текущий масштаб: 2 пикселя за секунду
          // Новый масштаб: containerWidth / maxDuration
          const currentScale = 2 // пикселей за секунду
          const containerWidth = event.containerWidth

          // Добавляем небольшой отступ (10%), чтобы контент не был прижат к краям
          const adjustedWidth = containerWidth * 0.9

          const targetScale = adjustedWidth / maxDuration

          // Преобразуем в уровень масштаба для zoomLevel
          // zoomLevel = targetScale / currentScale
          const newZoomLevel = targetScale / currentScale

          // Ограничиваем минимальный и максимальный уровень масштаба
          // Минимальный уровень: 0.005 (24 часа на всю ширину)
          // Максимальный уровень: 200 (2 секунды на всю ширину)
          const clampedZoomLevel = Math.max(0.005, Math.min(200, newZoomLevel))

          console.log(
            `Fitting to screen: maxDuration=${maxDuration}s, containerWidth=${containerWidth}px, adjustedWidth=${adjustedWidth}px, targetScale=${targetScale}, newZoomLevel=${newZoomLevel}, clampedZoomLevel=${clampedZoomLevel}`,
          )

          return addToHistory({
            context,
            newState: { zoomLevel: clampedZoomLevel },
          })
        }),
      ],
    },
    SET_TIME_RANGES: {
      actions: [
        assign(({ context, event }) =>
          addToHistory({
            context,
            newState: { timeRanges: event.ranges },
          }),
        ),
      ],
    },
    SET_ACTIVE_TRACK: {
      actions: assign({
        activeTrackId: ({ event }) => event.trackId,
      }),
    },
    SET_ACTIVE_SECTOR: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SET_ACTIVE_SECTOR") return context

          // Если sectorId равен null, устанавливаем activeSector в null
          if (event.sectorId === null) {
            return { activeSector: null }
          }

          // Проверяем, является ли sectorId датой в формате YYYY-MM-DD
          const isDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(event.sectorId as string)

          // Находим сектор по ID
          let sector = context.sectors.find((s) => s.id === event.sectorId)

          // Если сектор не найден по ID и это дата, пробуем найти по другим критериям
          if (!sector && isDateFormat) {
            const dateStr = event.sectorId as string

            // Пробуем найти по ID, который совпадает с датой
            sector = context.sectors.find((s) => s.id === dateStr)

            // Если не нашли, пробуем найти по имени, содержащему дату
            if (!sector) {
              sector = context.sectors.find((s) => s.name.includes(dateStr))
            }

            // Если не нашли, пробуем найти по имени, содержащему "Сектор" + дата
            if (!sector) {
              sector = context.sectors.find((s) => s.name.includes(`Сектор ${dateStr}`))
            }

            // Если не нашли, пробуем найти по имени, содержащему дату в другом формате
            if (!sector) {
              // Преобразуем YYYY-MM-DD в объект Date
              const dateParts = dateStr.split('-')
              const year = parseInt(dateParts[0])
              const month = parseInt(dateParts[1]) - 1 // Месяцы в JS начинаются с 0
              const day = parseInt(dateParts[2])
              const date = new Date(year, month, day)

              // Проверяем секторы, содержащие эту дату в разных форматах
              sector = context.sectors.find((s) => {
                // Проверяем разные форматы даты в имени сектора
                return (
                  s.name.includes(date.toLocaleDateString('ru-RU')) || // DD.MM.YYYY
                  s.name.includes(date.toLocaleDateString('en-US')) || // MM/DD/YYYY
                  s.name.includes(date.toLocaleDateString('en-GB'))    // DD/MM/YYYY
                )
              })
            }
          }

          // Если сектор не найден ни по ID, ни по имени, создаем временный сектор
          if (!sector) {
            console.warn(`Сектор с ID ${event.sectorId} не найден, создаем временный сектор`)

            // Создаем временный сектор с минимальными данными
            sector = {
              id: event.sectorId as string,
              name: `Сектор ${event.sectorId}`,
              tracks: [],
              timeRanges: [],
              startTime: 0,
              endTime: 0,
            }

            // Если это дата, добавляем сектор в список секторов
            if (isDateFormat) {
              context.sectors.push(sector)
              console.log(`[TimelineMachine] Добавлен новый сектор с ID ${event.sectorId}`)
            }
          }

          // Устанавливаем активный сектор
          console.log(`[TimelineMachine] Устанавливаем активный сектор: ${sector.id}`, sector)

          // Сохраняем состояние в IndexedDB
          const updatedContext = {
            ...context,
            activeSector: sector,
            isDirty: true
          }
          timelineIndexedDBService.saveTimelineState(updatedContext)

          return { activeSector: sector, isDirty: true }
        }),
        // Отдельное действие для установки времени из сохраненного времени сектора
        ({ context, event, self }) => {
          if (event.type !== "SET_ACTIVE_SECTOR" || event.sectorId === null) return

          // Находим сохраненное время для сектора
          const sectorId = event.sectorId
          const savedTime = context.sectorTimes[sectorId]

          if (savedTime !== undefined) {
            console.log(
              `[TimelineMachine] Восстанавливаем время ${savedTime.toFixed(2)} для сектора ${sectorId}`,
            )

            // Отправляем событие SET_SECTOR_TIME для установки времени
            self.send({ type: "SET_SECTOR_TIME", sectorId, time: savedTime, isActiveOnly: true })

            console.log(
              `[TimelineMachine] Отправлено событие SET_SECTOR_TIME для сектора ${sectorId} со временем ${savedTime.toFixed(2)}`,
            )
          }
        },
      ],
    },
    SET_TRACK_VOLUME: {
      actions: [
        assign(({ context, event }) => ({
          trackVolumes: {
            ...context.trackVolumes,
            [event.trackId]: event.volume,
          },
          isDirty: true,
        })),
      ],
    },
    SET_SEEKING: {
      actions: assign({
        isSeeking: ({ event }) => event.isSeeking,
      }),
    },
    SEEK: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SEEK") return context

          // Устанавливаем флаг isSeeking
          const newContext = { ...context, isSeeking: true }

          // Если есть активный сектор, сохраняем время только для него
          if (context.activeSector) {
            const sectorId = context.activeSector.id

            // Сохраняем время для активного сектора
            newContext.sectorTimes = {
              ...context.sectorTimes,
              [sectorId]: event.time,
            }

            // Отключаем логирование для уменьшения количества сообщений в консоли
            // console.log(
            //   `[TimelineMachine] Сохраняем время ${event.time.toFixed(2)} для сектора ${sectorId}`,
            // )

            // Сохраняем состояние в IndexedDB
            timelineIndexedDBService.saveTimelineState(newContext)
          }

          return newContext
        }),
      ],
    },
    SET_CHANGING_CAMERA: {
      actions: assign({
        isChangingCamera: ({ event }) => event.isChangingCamera,
      }),
    },
    ADD_MEDIA_FILES: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_MEDIA_FILES") return context

          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   "ADD_MEDIA_FILES event received with files:",
          //   event.files.map((f) => f.name),
          // )
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   "Current context.tracks:",
          //   context.tracks.map((t) => t.name),
          // )
          // console.log(
          //   "Current context.sectors:",
          //   context.sectors.map((s) => s.name),
          // )

          const newSectors = createTracksFromFiles(event.files, context.tracks)
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   "New sectors created:",
          //   newSectors.map((s) => s.name),
          // )

          // Объединяем секторы с одинаковыми датами
          const sectorsByDate = new Map<string, Sector>()

          // Сначала добавляем существующие секторы
          context.sectors.forEach((sector) => {
            const date = sector.name.replace("Сектор ", "")
            sectorsByDate.set(date, sector)
          })

          // Затем добавляем или обновляем новые секторы
          newSectors.forEach((sector) => {
            const date = sector.name.replace("Сектор ", "")

            if (sectorsByDate.has(date)) {
              // Объединяем треки
              const existingSector = sectorsByDate.get(date)!
              const updatedTracks = [...existingSector.tracks]

              // Добавляем новые треки
              sector.tracks.forEach((newTrack) => {
                // Проверяем, есть ли уже такой трек
                const existingTrackIndex = updatedTracks.findIndex(
                  (t) => t.type === newTrack.type && t.index === newTrack.index,
                )

                if (existingTrackIndex >= 0) {
                  // Обновляем существующий трек
                  const trackIndex = updatedTracks[existingTrackIndex].index
                  updatedTracks[existingTrackIndex] = {
                    ...updatedTracks[existingTrackIndex],
                    videos: [
                      ...(updatedTracks[existingTrackIndex].videos || []),
                      ...(newTrack.videos || []),
                    ],
                    startTime: Math.min(
                      updatedTracks[existingTrackIndex].startTime || Infinity,
                      newTrack.startTime || Infinity,
                    ),
                    endTime: Math.max(
                      updatedTracks[existingTrackIndex].endTime || 0,
                      newTrack.endTime || 0,
                    ),
                    combinedDuration:
                      (updatedTracks[existingTrackIndex].combinedDuration || 0) +
                      (newTrack.combinedDuration || 0),
                    // Всегда устанавливаем имя в формате "Camera X" для видео треков
                    name:
                      updatedTracks[existingTrackIndex].type === "video"
                        ? `Camera ${trackIndex}`
                        : updatedTracks[existingTrackIndex].name,
                    // Всегда устанавливаем cameraName в формате "Camera X" для видео треков
                    cameraName:
                      updatedTracks[existingTrackIndex].type === "video"
                        ? `Camera ${trackIndex}`
                        : updatedTracks[existingTrackIndex].cameraName,
                  }
                } else {
                  // Добавляем новый трек
                  // Всегда устанавливаем имя в формате "Camera X" для видео треков
                  if (newTrack.type === "video") {
                    newTrack.name = `Camera ${newTrack.index}`
                    newTrack.cameraName = `Camera ${newTrack.index}`
                  }
                  updatedTracks.push(newTrack)
                }
              })

              // Обновляем сектор
              sectorsByDate.set(date, {
                ...existingSector,
                tracks: updatedTracks,
                timeRanges: [...(existingSector.timeRanges || []), ...(sector.timeRanges || [])],
              })
            } else {
              // Добавляем новый сектор
              sectorsByDate.set(date, sector)
            }
          })

          // Преобразуем Map обратно в массив
          const updatedSectors = Array.from(sectorsByDate.values()).map((sector) => ({
            ...sector,
            tracks: sector.tracks.map((track) => ({
              ...track,
              id:
                track.id || event.files.find((f) => f.name === track.name)?.id || event.files[0].id,
            })),
          }))

          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   "Final updated sectors:",
          //   updatedSectors.map((s) => ({
          //     name: s.name,
          //     tracksCount: s.tracks.length,
          //   })),
          // )

          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   "Updated sectors:",
          //   updatedSectors.map((s) => ({
          //     name: s.name,
          //     tracksCount: s.tracks.length,
          //   })),
          // )

          // Обновляем также tracks для совместимости
          const allTracks = updatedSectors.flatMap((sector) => sector.tracks)
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(
          //   "Updating tracks in context:",
          //   allTracks.map((t) => ({
          //     name: t.name,
          //     videosCount: t.videos?.length || 0,
          //   })),
          // )

          return addToHistory({
            context,
            newState: {
              sectors: updatedSectors,
              tracks: allTracks,
            },
          })
        }),
      ],
    },
    REMOVE_MEDIA_FILE: {
      actions: [
        assign(({ context, event }) => {
          const updatedSectors = context.sectors
            .map((sector) => ({
              ...sector,
              tracks: sector.tracks.filter((track) => track.id !== event.fileId),
            }))
            .filter((sector) => sector.tracks.length > 0)

          return addToHistory({
            context,
            newState: { sectors: updatedSectors },
          })
        }),
      ],
    },
    SET_VIDEO_REF: {
      actions: assign({
        videoRefs: ({ context, event }) => ({
          ...context.videoRefs,
          [event.fileId]: event.video,
        }),
      }),
    },
    PRELOAD_ALL_VIDEOS: {
      actions: assign({
        loadedVideos: ({ context }) => {
          const newLoadedVideos = { ...context.loadedVideos }
          Object.entries(context.videoRefs).forEach(([fileId, video]) => {
            if (video && !newLoadedVideos[fileId]) {
              newLoadedVideos[fileId] = true
            }
          })
          return newLoadedVideos
        },
      }),
    },
    SET_TRACKS: {
      actions: [
        assign(({ context, event }) =>
          addToHistory({
            context,
            newState: { tracks: event.tracks },
          }),
        ),
      ],
    },
    // Обработчики для схемы монтажа
    CONVERT_SECTORS_TO_EDIT_SEGMENTS: {
      actions: [
        assign(({ context }) => {
          const editSegments = convertSectorsToEditSegments(context.sectors)
          return {
            ...context,
            editSegments,
            isDirty: true,
          }
        }),
      ],
    },

    ADD_EDIT_SEGMENT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_EDIT_SEGMENT") return context

          return addToHistory({
            context,
            newState: {
              editSegments: [...context.editSegments, event.segment],
            },
          })
        }),
      ],
    },

    UPDATE_EDIT_SEGMENT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "UPDATE_EDIT_SEGMENT") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              return { ...segment, ...event.updates }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    REMOVE_EDIT_SEGMENT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "REMOVE_EDIT_SEGMENT") return context

          const updatedSegments = context.editSegments.filter(
            (segment) => segment.id !== event.segmentId,
          )

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
              activeEditSegmentId:
                context.activeEditSegmentId === event.segmentId
                  ? null
                  : context.activeEditSegmentId,
            },
          })
        }),
      ],
    },

    REORDER_EDIT_SEGMENTS: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "REORDER_EDIT_SEGMENTS") return context

          // Создаем новый массив сегментов в порядке, указанном в event.segmentIds
          const segmentsMap = new Map(context.editSegments.map((segment) => [segment.id, segment]))

          const reorderedSegments = event.segmentIds
            .map((id) => segmentsMap.get(id))
            .filter(Boolean) as EditSegment[]

          return addToHistory({
            context,
            newState: {
              editSegments: reorderedSegments,
            },
          })
        }),
      ],
    },

    SET_ACTIVE_EDIT_SEGMENT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SET_ACTIVE_EDIT_SEGMENT") return context

          return {
            ...context,
            activeEditSegmentId: event.segmentId,
          }
        }),
      ],
    },

    ADD_EDIT_TRACK: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_EDIT_TRACK") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              return {
                ...segment,
                tracks: [...segment.tracks, event.track],
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    UPDATE_EDIT_TRACK: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "UPDATE_EDIT_TRACK") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              const updatedTracks = segment.tracks.map((track) => {
                if (track.id === event.trackId) {
                  return { ...track, ...event.updates }
                }
                return track
              })

              return {
                ...segment,
                tracks: updatedTracks,
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    REMOVE_EDIT_TRACK: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "REMOVE_EDIT_TRACK") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              return {
                ...segment,
                tracks: segment.tracks.filter((track) => track.id !== event.trackId),
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    ADD_EDIT_RESOURCE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_EDIT_RESOURCE") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              const updatedTracks = segment.tracks.map((track) => {
                if (track.id === event.trackId) {
                  return {
                    ...track,
                    resources: [...track.resources, event.resource],
                  }
                }
                return track
              })

              return {
                ...segment,
                tracks: updatedTracks,
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    UPDATE_EDIT_RESOURCE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "UPDATE_EDIT_RESOURCE") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              const updatedTracks = segment.tracks.map((track) => {
                if (track.id === event.trackId) {
                  const updatedResources = track.resources.map((resource) => {
                    if (resource.id === event.resourceId) {
                      return { ...resource, ...event.updates }
                    }
                    return resource
                  })

                  return {
                    ...track,
                    resources: updatedResources,
                  }
                }
                return track
              })

              return {
                ...segment,
                tracks: updatedTracks,
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    REMOVE_EDIT_RESOURCE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "REMOVE_EDIT_RESOURCE") return context

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === event.segmentId) {
              const updatedTracks = segment.tracks.map((track) => {
                if (track.id === event.trackId) {
                  return {
                    ...track,
                    resources: track.resources.filter(
                      (resource) => resource.id !== event.resourceId,
                    ),
                  }
                }
                return track
              })

              return {
                ...segment,
                tracks: updatedTracks,
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    APPLY_TEMPLATE_TO_SEGMENT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "APPLY_TEMPLATE_TO_SEGMENT") return context

          const { segmentId, templateId, params } = event
          const templateResource = context.templateResources.find(
            (t) => t.resourceId === templateId,
          ) as { template: MediaTemplate } | undefined

          if (!templateResource?.template) return context

          const template = templateResource.template

          const updatedSegments = context.editSegments.map((segment) => {
            if (segment.id === segmentId) {
              // Создаем дорожки на основе шаблона
              const tracksFromTemplate = createTracksFromTemplate(template, segment.tracks, params)

              return {
                ...segment,
                template: templateId,
                templateParams: params || {},
                tracks: tracksFromTemplate,
              }
            }
            return segment
          })

          return addToHistory({
            context,
            newState: {
              editSegments: updatedSegments,
            },
          })
        }),
      ],
    },

    GENERATE_FFMPEG_COMMAND: {
      actions: [
        ({ context, event }) => {
          if (event.type !== "GENERATE_FFMPEG_COMMAND") return

          const { editSegments } = context
          const { outputPath } = event

          // Генерация временных файлов для каждого сегмента
          const segmentCommands = editSegments.map((segment, index) => {
            return generateSegmentCommand(segment, `temp_segment_${index}.mp4`)
          })

          // Команда для объединения всех сегментов
          const concatCommand = generateConcatCommand(editSegments.length, outputPath)

          // Полная команда FFmpeg
          const fullCommand = [...segmentCommands, concatCommand].join(" && ")

          console.log("FFmpeg command:", fullCommand)
          // Здесь можно вызвать функцию для выполнения команды или сохранить её
        },
      ],
    },

    // Обработчики для ресурсов
    ADD_EFFECT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_EFFECT") return context

          const newResource = createEffectResource(event.effect)
          return {
            ...context,
            resources: [...context.resources, newResource],
            effectResources: [...context.effectResources, newResource],
            isDirty: true,
          }
        }),
      ],
    },
    ADD_FILTER: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_FILTER") return context

          const newResource = createFilterResource(event.filter)
          return {
            ...context,
            resources: [...context.resources, newResource],
            filterResources: [...context.filterResources, newResource],
            isDirty: true,
          }
        }),
      ],
    },
    ADD_TRANSITION: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_TRANSITION") return context

          console.log("ADD_TRANSITION event received with transition:", event.transition)
          const newResource = createTransitionResource(event.transition)
          console.log("Created transition resource:", newResource)

          return {
            ...context,
            resources: [...context.resources, newResource],
            transitionResources: [...context.transitionResources, newResource],
            isDirty: true,
          }
        }),
      ],
    },
    ADD_TEMPLATE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_TEMPLATE") return context

          const newResource = createTemplateResource(event.template)
          return {
            ...context,
            resources: [...context.resources, newResource],
            templateResources: [...context.templateResources, newResource],
            isDirty: true,
          }
        }),
      ],
    },
    ADD_MUSIC: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_MUSIC") return context

          console.log("ADD_MUSIC event received with file:", event.file.name)
          const newResource = createMusicResource(event.file)
          console.log("Created music resource:", newResource)

          return {
            ...context,
            resources: [...context.resources, newResource],
            musicResources: [...context.musicResources, newResource],
            isDirty: true,
          }
        }),
      ],
    },
    REMOVE_RESOURCE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "REMOVE_RESOURCE") return context

          const filteredResources = context.resources.filter(
            (resource) => resource.id !== event.resourceId,
          )

          return {
            ...context,
            resources: filteredResources,
            effectResources: context.effectResources.filter(
              (resource) => resource.id !== event.resourceId,
            ),
            filterResources: context.filterResources.filter(
              (resource) => resource.id !== event.resourceId,
            ),
            transitionResources: context.transitionResources.filter(
              (resource) => resource.id !== event.resourceId,
            ),
            templateResources: context.templateResources.filter(
              (resource) => resource.id !== event.resourceId,
            ),
            musicResources: context.musicResources.filter(
              (resource) => resource.id !== event.resourceId,
            ),
            isDirty: true,
          }
        }),
      ],
    },
    UPDATE_RESOURCE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "UPDATE_RESOURCE") return context

          const updatedResources = context.resources.map((resource) => {
            if (resource.id === event.resourceId) {
              return {
                ...resource,
                params: { ...resource.params, ...event.params },
              }
            }
            return resource
          })

          return {
            ...context,
            resources: updatedResources,
            effectResources: context.effectResources.map((resource) => {
              if (resource.id === event.resourceId) {
                return {
                  ...resource,
                  params: { ...resource.params, ...event.params },
                }
              }
              return resource
            }),
            filterResources: context.filterResources.map((resource) => {
              if (resource.id === event.resourceId) {
                return {
                  ...resource,
                  params: { ...resource.params, ...event.params },
                }
              }
              return resource
            }),
            transitionResources: context.transitionResources.map((resource) => {
              if (resource.id === event.resourceId) {
                return {
                  ...resource,
                  params: { ...resource.params, ...event.params },
                }
              }
              return resource
            }),
            templateResources: context.templateResources.map((resource) => {
              if (resource.id === event.resourceId) {
                return {
                  ...resource,
                  params: { ...resource.params, ...event.params },
                }
              }
              return resource
            }),
            musicResources: context.musicResources.map((resource) => {
              if (resource.id === event.resourceId) {
                return {
                  ...resource,
                  params: { ...resource.params, ...event.params },
                }
              }
              return resource
            }),
            isDirty: true,
          }
        }),
      ],
    },
    UNDO: {
      actions: [
        assign(({ context }) => {
          if (context.currentStateIndex < 0) return context

          const newIndex = context.currentStateIndex - 1
          const previousState = context.previousStates[newIndex]

          if (!previousState) {
            return {
              ...initialContext,
              previousStates: context.previousStates,
              currentStateIndex: -1,
              canUndo: false,
              canRedo: true,
            }
          }

          return {
            ...previousState,
            previousStates: context.previousStates,
            currentStateIndex: newIndex,
            canUndo: newIndex >= 0,
            canRedo: true,
          }
        }),
      ],
    },
    REDO: {
      actions: [
        assign(({ context }) => {
          if (context.currentStateIndex >= context.previousStates.length - 1) return context

          const newIndex = context.currentStateIndex + 1
          const nextState = context.previousStates[newIndex]

          if (!nextState) return context

          return {
            ...nextState,
            previousStates: context.previousStates,
            currentStateIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < context.previousStates.length - 1,
          }
        }),
      ],
    },

    // Обработчики событий для чата
    SEND_CHAT_MESSAGE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SEND_CHAT_MESSAGE") return context

          const newMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: event.message,
            sender: "user",
            timestamp: new Date().toISOString(),
            isProcessing: false,
          }

          return {
            ...context,
            chatMessages: [...context.chatMessages, newMessage],
            isDirty: true,
          }
        }),
      ],
    },

    RECEIVE_CHAT_MESSAGE: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "RECEIVE_CHAT_MESSAGE") return context

          return {
            ...context,
            chatMessages: [...context.chatMessages, event.message],
            isDirty: true,
          }
        }),
      ],
    },

    SELECT_AGENT: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SELECT_AGENT") return context

          return {
            ...context,
            selectedAgentId: event.agentId,
            isDirty: true,
          }
        }),
      ],
    },

    // Обработчик события SAVE_ALL_SECTORS_TIME
    SAVE_ALL_SECTORS_TIME: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SAVE_ALL_SECTORS_TIME") return context

          // Если есть активный сектор, сохраняем время для него
          if (context.activeSector) {
            const sectorId = context.activeSector.id

            // Проверяем, изменилось ли время для сектора
            const currentTime = context.sectorTimes[sectorId]
            const hasTimeChanged =
              currentTime === undefined || Math.abs(currentTime - event.displayTime) > 0.1

            // Сохраняем время только если оно изменилось
            if (hasTimeChanged) {
              // Сохраняем время для активного сектора
              const newSectorTimes = {
                ...context.sectorTimes,
                [sectorId]: event.displayTime,
              }

              // Логируем только при значительном изменении времени
              if (process.env.NODE_ENV === "development") {
                console.log(
                  `[TimelineMachine] Сохранено время ${event.displayTime.toFixed(2)} для сектора ${sectorId} при переключении видео ${event.videoId}`,
                )
              }

              // Создаем обновленный контекст
              const updatedContext = {
                ...context,
                sectorTimes: newSectorTimes,
                isDirty: true,
              }

              // Сохраняем состояние в IndexedDB
              timelineIndexedDBService.saveTimelineState(updatedContext)

              return { sectorTimes: newSectorTimes, isDirty: true }
            }
          }

          return context
        }),
      ],
    },

    // Обработчик события SET_SECTOR_TIME
    SET_SECTOR_TIME: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "SET_SECTOR_TIME") return context

          // Проверяем, изменилось ли время для сектора
          const currentTime = context.sectorTimes[event.sectorId]
          const hasTimeChanged =
            currentTime === undefined || Math.abs(currentTime - event.time) > 0.1

          // Сохраняем время только если оно изменилось
          if (hasTimeChanged) {
            // Сохраняем время для указанного сектора
            const newSectorTimes = {
              ...context.sectorTimes,
              [event.sectorId]: event.time,
            }

            // Логируем только при значительном изменении времени
            if (process.env.NODE_ENV === "development") {
              console.log(
                `[TimelineMachine] Установлено время ${event.time.toFixed(2)} для сектора ${event.sectorId}`,
              )
            }

            // Создаем обновленный контекст
            const updatedContext = {
              ...context,
              sectorTimes: newSectorTimes,
              isDirty: true,
            }

            // Сохраняем состояние в IndexedDB
            timelineIndexedDBService.saveTimelineState(updatedContext)

            return { sectorTimes: newSectorTimes, isDirty: true }
          }

          return context
        }),
      ],
    },
  },
})
