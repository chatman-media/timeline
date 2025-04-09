import { createStore } from "@xstate/store"

import { areStatesEqual } from "@/lib/db-init"
import { forceSaveState, lastSavedState } from "@/lib/db-init"
import {
  EventPayloadMap,
  MontageSegment,
  StateContext,
  StorableStateContext,
  StoreEffect,
} from "@/lib/state-types"
import { TimeRange } from "@/types/time-range"
import type { MediaFile, ScreenLayout, Track } from "@/types/videos"
import { FfprobeData } from "@/types/ffprobe"

// Утилита для генерации ID сегмента
const generateSegmentId = (): string => crypto.randomUUID()

// Определяем тип для enqueue
type EnqueueObject = {
  effect: (callback: () => void | Promise<void>) => void
}

type EventHandlerArgs = {
  enqueue?: EnqueueObject
}

// Обновляем тип для новых файлов
type NewMediaFile = Omit<MediaFile, "probeData"> & {
  probeData: FfprobeData
}

type TrackType = "video" | "audio"

interface NewTrack extends Track {
  timeRanges: []
}

/**
 * Начальное состояние корневого хранилища
 * ЭКСПОРТИРУЕТСЯ для использования в StateInitializer
 */
export const initialContext: StateContext = {
  media: [] as MediaFile[],
  isLoading: true,
  hasMedia: false,
  isPlaying: false,
  currentTime: 0,
  timeRanges: {} as Record<string, TimeRange[]>,
  tracks: [] as Track[],
  videoRefs: {} as { [key: string]: HTMLVideoElement },
  activeVideo: null as MediaFile | null,
  hasFetched: false,
  activeTrackId: null as string | null,
  isChangingCamera: false,
  metadataCache: {} as Record<string, any>,
  thumbnailCache: {} as Record<string, string>,
  currentLayout: { type: "1x1", activeTracks: [] } as ScreenLayout,
  addedFiles: new Set<string>(),
  isSaved: true,
  scale: 1,
  volume: 1,
  trackVolumes: {} as Record<string, number>,
  isSeeking: false,
  // История снимков
  historySnapshotIds: [] as number[],
  currentHistoryIndex: -1,
  layoutMode: "default" as string,
  panelLayouts: {} as Record<string, number[]>,
  isDirty: false,
  montageSchema: [],
  isRecordingSchema: false,
  currentRecordingSegmentId: null,
}

/**
 * Утилита для безопасного преобразования Partial<StateContext> или StorableStateContext
 * в Partial<StateContext> с правильным типом addedFiles (Set).
 */
function normalizeStateForStore(
  state: Partial<StateContext> | Partial<StorableStateContext> | null | undefined,
): Partial<StateContext> {
  // Если state null или undefined, возвращаем пустой объект или можем кинуть ошибку
  if (!state) {
    return {}
  }
  const normalizedState = { ...state } as Partial<StateContext> // Начинаем с копии

  // Преобразуем addedFiles из массива строк (если он такой) в Set
  if (state.addedFiles && Array.isArray(state.addedFiles)) {
    normalizedState.addedFiles = new Set(state.addedFiles)
  } else if (state.addedFiles instanceof Set) {
    // Если это уже Set, создаем копию, чтобы избежать мутаций, если нужно
    // normalizedState.addedFiles = new Set(state.addedFiles);
    // Оставляем пока копирование по ссылке (spread operator)
  } else {
    // Если addedFiles null/undefined или другого типа, установим пустой Set
    normalizedState.addedFiles = new Set<string>()
  }

  // Нормализуем другие поля при необходимости, например, вложенные объекты
  // или гарантируем наличие обязательных полей из StateContext (если это не Partial)

  return normalizedState
}

/**
 * Корневое хранилище приложения
 * Управляет состоянием видео, треков, метаданных и UI
 */
export const rootStore = createStore<StateContext, EventPayloadMap, StoreEffect>({
  context: initialContext,

  on: {
    setLoadingState: (context, event) => ({
      ...context,
      isLoading: event.isLoading,
    }),

    setState: (context, event) => {
      const normalizedEventState = normalizeStateForStore(event.state)
      const newState = {
        ...context,
        ...normalizedEventState,
        isDirty: false,
        isSeeking: false,
        isChangingCamera: false,
        isPlaying: normalizedEventState.isPlaying ?? context.isPlaying,
        videoRefs: {},
      }

      if (!(newState.addedFiles instanceof Set)) {
        console.warn("setState: addedFiles is not a Set after merge, resetting.")
        newState.addedFiles = new Set<string>()
      }

      return newState
    },

    setMedia: (context, event) => ({
      ...context,
      media: event.media,
      hasMedia: true,
      isLoading: false,
    }),

    setScreenLayout: (context: StateContext, event: { layout: ScreenLayout }) => ({
      ...context,
      currentLayout: event.layout,
      isDirty: true,
    }),

    setActiveVideo: (context: StateContext, event: { videoId: string }) => ({
      ...context,
      activeVideo: context.media.find((m) => m.id === event.videoId) ?? null,
      isDirty: true,
    }),

    setActiveTrack: (context: StateContext, event: { trackId: string }) => ({
      ...context,
      activeTrackId: event.trackId,
      isChangingCamera: false,
      isDirty: true,
    }),

    setTracks: (context: StateContext, event: { tracks: Track[] }) => ({
      ...context,
      tracks: event.tracks,
      isDirty: true,
    }),

    addNewTracks: (context: StateContext, event: { media: MediaFile[] }) => ({
      ...context,
      tracks: [
        ...context.tracks,
        ...event.media.map(
          (media) =>
            ({
              id: generateSegmentId(),
              name: media.name,
              type: "video" as TrackType,
              isActive: false,
              videos: [media],
              startTime: 0,
              endTime: 0,
              combinedDuration: 0,
              timeRanges: [],
              index: context.tracks.length,
            }) as NewTrack,
        ),
      ],
      isDirty: true,
    }),

    setLayoutMode: (context: StateContext, event: { mode: string }) => ({
      ...context,
      layoutMode: event.mode,
      isDirty: true,
    }),

    setPanelLayout: (context: StateContext, event: { id: string; sizes: number[] }) => ({
      ...context,
      panelLayouts: {
        ...context.panelLayouts,
        [event.id]: event.sizes,
      },
      isDirty: true,
    }),

    startRecordingSchema: (
      context: StateContext,
      event: { trackId: string; startTime: number },
    ) => {
      if (context.isRecordingSchema) return context

      const activeSourceTrackId = context.currentLayout.activeTracks[0]
      if (!activeSourceTrackId) {
        console.warn("Невозможно начать запись: нет активного трека в текущем макете.")
        return context
      }

      const newSegmentId = generateSegmentId()
      const newSegment: MontageSegment = {
        id: newSegmentId,
        sourceTrackIds: [activeSourceTrackId],
        startTime: Date.now() / 1000,
        endTime: null,
        settings: {},
      }

      console.log("Начало записи сегмента:", newSegment)

      const nextState = {
        ...context,
        montageSchema: [...context.montageSchema, newSegment],
        isRecordingSchema: true,
        currentRecordingSegmentId: newSegmentId,
        isPlaying: true,
        isDirty: true,
      }

      console.log("[startRecordingSchema] Returning state:", {
        isPlaying: nextState.isPlaying,
        isRecordingSchema: nextState.isRecordingSchema,
      })

      return nextState
    },

    stopRecordingSchema: (context: StateContext, event: {}, args: {}) => {
      if (!context.isRecordingSchema || !context.currentRecordingSegmentId) return context

      const segmentIndex = context.montageSchema.findIndex(
        (seg) => seg.id === context.currentRecordingSegmentId,
      )
      if (segmentIndex === -1) {
        console.error("Не найден текущий записываемый сегмент для остановки.")
        return {
          ...context,
          isRecordingSchema: false,
          currentRecordingSegmentId: null,
          isPlaying: false,
        }
      }

      const updatedSchema = [...context.montageSchema]
      const currentTime = Date.now() / 1000

      if (updatedSchema[segmentIndex].startTime >= currentTime) {
        console.warn("Остановка записи: сегмент нулевой или отрицательной длительности, удаляем.")
        updatedSchema.splice(segmentIndex, 1)
      } else {
        updatedSchema[segmentIndex] = {
          ...updatedSchema[segmentIndex],
          endTime: currentTime,
        }
        console.log("Остановка записи сегмента:", updatedSchema[segmentIndex])
      }

      const newState = {
        ...context,
        montageSchema: updatedSchema,
        isRecordingSchema: false,
        currentRecordingSegmentId: null,
        isPlaying: false,
        isDirty: true,
      }

      if (args && typeof args === "function") {
        args(() => rootStore.send({ type: "createHistoryPoint", stateForHistory: newState }))
      }

      return newState
    },

    addMediaFiles: (context: StateContext, event: { files: File[] }) => {
      const newMedia: MediaFile[] = event.files.map(
        (file): MediaFile => ({
          id: generateSegmentId(),
          name: file.name,
          path: URL.createObjectURL(file),
          type: file.type,
          probeData: {
            format: {
              duration: 0,
              size: file.size,
              bit_rate: 0,
            },
            streams: [
              {
                codec_type: "video",
                codec_name: "unknown",
                width: 1920,
                height: 1080,
                duration: 0,
              },
            ],
          },
        }),
      )

      return {
        ...context,
        media: [...context.media, ...newMedia],
        hasMedia: true,
        isLoading: false,
      }
    },

    removeMediaFile: (context: StateContext, event: { id: string }) => ({
      ...context,
      media: context.media.filter((file) => file.id !== event.id),
      hasMedia: context.media.length > 1,
      isLoading: false,
    }),

    clearCache: async (_context: StateContext) => {
      const { resetDatabases } = await import("@/lib/db-reset")
      await resetDatabases()

      // Возвращаем начальное состояние
      return {
        ...initialContext,
        isLoading: true, // Устанавливаем isLoading в true, так как базы будут пересоздаваться
        hasFetched: false,
      }
    },

    fetchVideos: async (context, _event, { effect }) => {
      if (context.isLoading) {
        return context
      }

      const loadingState = {
        ...context,
        isLoading: true,
        hasMedia: false,
      }

      effect(async () => {
        try {
          const response = await fetch("/api/media")
          if (!response.ok) {
            console.error("Failed to fetch media:", response.statusText)
            return
          }

          const data = await response.json()
          if (!Array.isArray(data)) {
            console.error("Invalid media data format:", data)
            return
          }

          const validMedia = data
            .filter((item): item is MediaFile => {
              return (
                item && typeof item === "object" && "id" in item && "name" in item && "path" in item
              )
            })
            .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

          rootStore.send({
            type: "setMedia",
            media: validMedia,
          })

          // Запускаем периодическую проверку файлов
          setInterval(async () => {
            try {
              const response = await fetch("/api/media")
              if (!response.ok) return

              const data = await response.json()
              if (!Array.isArray(data)) return

              const validMedia = data
                .filter((item): item is MediaFile => {
                  return (
                    item &&
                    typeof item === "object" &&
                    "id" in item &&
                    "name" in item &&
                    "path" in item
                  )
                })
                .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

              rootStore.send({
                type: "setMedia",
                media: validMedia,
              })
            } catch (error) {
              console.error("Error checking for new files:", error)
            }
          }, 5000) // Проверяем каждые 5 секунд
        } catch (error) {
          console.error("Error fetching media:", error)
        }
      })

      return loadingState
    },
  },
})

/**
 * Конвертирует время в процентное значение относительно длительности активного трека
 * @param time - Время в секундах
 * @returns Процентное значение (0-100)
 */
export function timeToPercent(time: number) {
  const { context } = rootStore.getSnapshot()
  const track = context.tracks.find((t) => t.id === context.activeTrackId)
  if (!track || !track.combinedDuration || track.combinedDuration === 0) return 0
  return (time / track.combinedDuration) * 100
}

/**
 * Конвертирует процентное значение в время относительно длительности активного трека
 * @param percent - Процентное значение (0-100)
 * @returns Время в секундах
 */
export function percentToTime(percent: number) {
  const { context } = rootStore.getSnapshot()
  const track = context.tracks.find((t) => t.id === context.activeTrackId)
  if (!track || !track.combinedDuration) return 0
  return (percent / 100) * track.combinedDuration
}

// Обработчик для принудительного сохранения перед закрытием вкладки
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (event) => {
    const currentState = rootStore.getSnapshot().context
    // Сравниваем с последним сохраненным в памяти db-init
    if (currentState && !areStatesEqual(currentState, lastSavedState)) {
      console.log("Window closing: Forcing state save...")
      // Асинхронная операция, может не успеть завершиться
      forceSaveState(currentState)
    }
  })
}
