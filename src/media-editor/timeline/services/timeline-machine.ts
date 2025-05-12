import { assign, createMachine } from "xstate"

import { VideoEffect } from "@/media-editor/browser/components/tabs/effects/effects"
import { VideoFilter } from "@/media-editor/browser/components/tabs/filters/filters"
import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { createTracksFromFiles, Sector } from "@/media-editor/browser/utils/media-files"
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

export interface TimelineContext {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  sectors: Sector[]
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
}

export type TimelineEvent =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "ZOOM"; level: number }
  | { type: "FIT_TO_SCREEN"; containerWidth: number }
  | { type: "SET_TIME_RANGES"; ranges: Record<string, TimeRange[]> }
  | { type: "SET_ACTIVE_TRACK"; trackId: string | null }
  | { type: "SEEK"; time: number }
  | { type: "SET_TRACK_VOLUME"; trackId: string; volume: number }
  | { type: "SET_SEEKING"; isSeeking: boolean }
  | { type: "SET_CHANGING_CAMERA"; isChangingCamera: boolean }
  | { type: "ADD_MEDIA_FILES"; files: MediaFile[] }
  | { type: "REMOVE_MEDIA_FILE"; fileId: string }
  | { type: "SET_VIDEO_REF"; fileId: string; video: HTMLVideoElement | null }
  | { type: "SET_LOADED_VIDEO"; fileId: string; loaded: boolean }
  | { type: "PRELOAD_ALL_VIDEOS" }
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

const initialContext: TimelineContext = {
  isDirty: false,
  zoomLevel: 1,
  timeRanges: {},
  activeTrackId: null,
  trackVolumes: {},
  isSeeking: false,
  isChangingCamera: false,
  tracks: [],
  sectors: [],
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
}

const addToHistory = ({
  context,
  newState,
}: {
  context: TimelineContext
  newState: Partial<TimelineContext>
}): TimelineContext => {
  const newStates = context.previousStates.slice(0, context.currentStateIndex + 1)
  return {
    ...context,
    ...newState,
    previousStates: [...newStates, { ...context, ...newState }],
    currentStateIndex: context.currentStateIndex + 1,
    canUndo: true,
    canRedo: false,
    isDirty: true,
  }
}

export const timelineMachine = createMachine({
  id: "timeline",
  initial: "idle",
  context: initialContext,
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  states: {
    idle: {
      on: {
        PLAY: "playing",
        RESTORE_STATE: {
          guard: ({ event }) => {
            return event.type === "RESTORE_STATE" && Object.keys(event.state).length > 0
          },
          actions: [
            assign(({ event }) => ({
              ...initialContext,
              ...(event.type === "RESTORE_STATE" ? event.state : {}),
            })),
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
    SET_CHANGING_CAMERA: {
      actions: assign({
        isChangingCamera: ({ event }) => event.isChangingCamera,
      }),
    },
    ADD_MEDIA_FILES: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_MEDIA_FILES") return context

          console.log(
            "ADD_MEDIA_FILES event received with files:",
            event.files.map((f) => f.name),
          )
          console.log(
            "Current context.tracks:",
            context.tracks.map((t) => t.name),
          )
          console.log(
            "Current context.sectors:",
            context.sectors.map((s) => s.name),
          )

          const newSectors = createTracksFromFiles(event.files, context.tracks)
          console.log(
            "New sectors created:",
            newSectors.map((s) => s.name),
          )

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
                    // Всегда устанавливаем имя в формате "Камера X" для видео треков
                    name:
                      updatedTracks[existingTrackIndex].type === "video"
                        ? `Камера ${trackIndex}`
                        : updatedTracks[existingTrackIndex].name,
                    // Всегда устанавливаем cameraName в формате "Камера X" для видео треков
                    cameraName:
                      updatedTracks[existingTrackIndex].type === "video"
                        ? `Камера ${trackIndex}`
                        : updatedTracks[existingTrackIndex].cameraName,
                  }
                } else {
                  // Добавляем новый трек
                  // Всегда устанавливаем имя в формате "Камера X" для видео треков
                  if (newTrack.type === "video") {
                    newTrack.name = `Камера ${newTrack.index}`
                    newTrack.cameraName = `Камера ${newTrack.index}`
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

          console.log(
            "Final updated sectors:",
            updatedSectors.map((s) => ({
              name: s.name,
              tracksCount: s.tracks.length,
            })),
          )

          console.log(
            "Updated sectors:",
            updatedSectors.map((s) => ({
              name: s.name,
              tracksCount: s.tracks.length,
            })),
          )

          // Обновляем также tracks для совместимости
          const allTracks = updatedSectors.flatMap((sector) => sector.tracks)
          console.log(
            "Updating tracks in context:",
            allTracks.map((t) => ({
              name: t.name,
              videosCount: t.videos?.length || 0,
            })),
          )

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
  },
})
