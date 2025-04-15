import { createStore } from "@xstate/store"
import { nanoid } from "nanoid"

import { areStatesEqual } from "@/lib/db-init"
import { forceSaveState, lastSavedState } from "@/lib/db-init"
import {
  EventPayloadMap,
  MontageSegment,
  StateContext,
  StorableStateContext,
  StoreEffect,
} from "@/lib/state-types"
import { FfprobeData } from "@/types/ffprobe"
import { TimeRange } from "@/types/time-range"
import type { MediaFile, ScreenLayout, Track } from "@/types/videos"
import { createTracksFromFiles } from "@/utils/media-utils"

// Определяем тип для enqueue
type EnqueueObject = {
  effect: (callback: () => void | Promise<void>) => void
}

type EventHandlerArgs = {
  enqueue?: EnqueueObject
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
      console.log("[setState] Updating state with:", event.state)
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

      console.log("[setState] New state:", newState)
      return newState
    },

    setHistoryState: (context, event) => {
      const normalizedEventState = normalizeStateForStore(event.state)
      return {
        ...context,
        ...normalizedEventState,
      }
    },

    createHistoryPoint: (context, event) => {
      return {
        ...context,
        ...event.stateForHistory,
      }
    },

    setScale: (context, event) => ({
      ...context,
      scale: event.scale,
    }),

    setVolume: (context, event) => ({
      ...context,
      volume: event.volume,
    }),

    setTrackVolume: (context, event) => ({
      ...context,
      trackVolumes: {
        ...context.trackVolumes,
        [event.trackId]: event.volume,
      },
    }),

    setIsSeeking: (context, event) => ({
      ...context,
      isSeeking: event.isSeeking,
    }),

    addToMetadataCache: (context, event) => ({
      ...context,
      metadataCache: {
        ...context.metadataCache,
        [event.key]: event.data,
      },
    }),

    addToThumbnailCache: (context, event) => ({
      ...context,
      thumbnailCache: {
        ...context.thumbnailCache,
        [event.key]: event.data,
      },
    }),

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

    setActiveVideo: (context: StateContext, event: { videoId: string }) => {
      const newVideo = context.media.find((m) => m.id === event.videoId) ?? null
      return newVideo
        ? {
            ...context,
            activeVideo: newVideo,
            isDirty: true,
          }
        : context
    },

    setActiveTrack: (context: StateContext, event: { trackId: string }) => {
      // Проверяем, меняется ли трек
      const isChangingTrack = context.activeTrackId !== event.trackId

      return {
        ...context,
        activeTrackId: event.trackId,
        // Устанавливаем флаг isChangingCamera только если трек действительно меняется
        isChangingCamera: isChangingTrack,
        isDirty: true,
      }
    },

    resetChangingCamera: (context: StateContext) => {
      return {
        ...context,
        isChangingCamera: false,
      }
    },

    setTracks: (context: StateContext, event: { tracks: Track[] }) => {
      const newState = {
        ...context,
        tracks: event.tracks,
        isDirty: true,
      }

      // Сохраняем состояние после изменения треков
      forceSaveState(newState)

      return newState
    },

    addNewTracks: (context: StateContext, event: { media: MediaFile[] }) => {
      console.log("[addNewTracks] Adding new tracks:", event.media.length, "files")

      // Проверяем, есть ли уже треки с такими файлами
      const filePaths = event.media.map((file) => file.path).filter(Boolean) as string[]
      const existingTrackWithSameFiles = context.tracks.some((track) =>
        track.videos.some((video) => video.path && filePaths.includes(video.path)),
      )

      if (existingTrackWithSameFiles) {
        console.log("[addNewTracks] Some of these files are already in tracks, skipping...")
        return context
      }

      // Используем createTracksFromFiles из media-utils.ts и передаем существующие треки
      const newTracks = createTracksFromFiles(event.media, context.tracks.length, context.tracks)

      const newState = {
        ...context,
        tracks: [...context.tracks, ...newTracks],
        isDirty: true,
      }

      // Сохраняем состояние после добавления новых треков
      forceSaveState(newState)

      return newState
    },

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

    addToAddedFiles: (context: StateContext, event: { filePaths: string[] }) => {
      console.log("[rootStore] Запуск addToAddedFiles()", event.filePaths)
      // Создаем новый Set на основе существующего и добавляем новые пути
      const newAddedFiles = new Set(context.addedFiles)
      event.filePaths.forEach((path) => newAddedFiles.add(path))

      return {
        ...context,
        addedFiles: newAddedFiles,
        isDirty: true,
      }
    },

    removeFromAddedFiles: (context: StateContext, event: { filePaths: string[] }) => {
      console.log("[rootStore] Запуск removeFromAddedFiles()", event.filePaths)
      // Создаем новый Set на основе существующего и удаляем указанные пути
      const newAddedFiles = new Set(context.addedFiles)
      event.filePaths.forEach((path) => newAddedFiles.delete(path))

      return {
        ...context,
        addedFiles: newAddedFiles,
        isDirty: true,
      }
    },

    startRecordingSchema: (
      context: StateContext,
      event: { trackId: string; startTime: number },
    ) => {
      if (context.isRecordingSchema) return context

      // Используем либо активный трек из макета, либо переданный трек из параметра
      const activeSourceTrackId = context.currentLayout.activeTracks[0] || event.trackId

      if (!activeSourceTrackId) {
        console.warn("Невозможно начать запись: нет активного трека ни в макете, ни в параметрах.")
        return context
      }

      const newSegmentId = generateSegmentId()

      // Используем переданное время начала или текущее системное время
      const startTime = event.startTime || Date.now() / 1000
      console.log(`[startRecordingSchema] Время начала записи: ${startTime.toFixed(3)}`)

      const newSegment: MontageSegment = {
        id: newSegmentId,
        sourceTrackIds: [activeSourceTrackId],
        startTime: startTime,
        endTime: null,
        settings: {},
      }

      console.log("Начало записи сегмента:", newSegment)

      // Также обновляем активный трек в макете, если его там нет
      const updatedLayout = { ...context.currentLayout }
      if (updatedLayout.activeTracks.length === 0) {
        updatedLayout.activeTracks = [activeSourceTrackId]
      }

      const nextState = {
        ...context,
        montageSchema: [...context.montageSchema, newSegment],
        isRecordingSchema: true,
        currentRecordingSegmentId: newSegmentId,
        isPlaying: true,
        isDirty: true,
        currentLayout: updatedLayout,
        // Обновляем текущее время, если оно было передано
        currentTime: event.startTime || context.currentTime,
      }

      console.log("[startRecordingSchema] Returning state:", {
        isPlaying: nextState.isPlaying,
        isRecordingSchema: nextState.isRecordingSchema,
        activeTrackId: activeSourceTrackId,
      })

      return nextState
    },

    stopRecordingSchema: (context: StateContext, _event: {}, args: EventHandlerArgs) => {
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
        // Не останавливаем воспроизведение при остановке записи
        // это может быть вызвано переключением дорожки
        isDirty: true,
      }

      if (args?.enqueue) {
        args.enqueue.effect(() =>
          rootStore.send({ type: "createHistoryPoint", stateForHistory: newState }),
        )
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

    clearCache: (context: StateContext, _event: {}, enq: EnqueueObject) => {
      // Устанавливаем начальное состояние для обновления UI
      const initialState = {
        ...context,
        isLoading: true,
        hasFetched: false,
      }

      // // Выполняем асинхронные операции
      // enq.effect(async () => {
      //   const { resetDatabases } = await import("@/lib/db-reset")
      //   await resetDatabases()
      // })

      return initialState
    },

    fetchVideos: (context: StateContext) => {
      console.log("[rootStore] Запуск fetchVideos()")
      return context
    },

    initializeHistory: (context: StateContext) => {
      console.log("[rootStore] Запуск initializeHistory()")
      return context
    },

    undo: (context: StateContext) => {
      console.log("[rootStore] Запуск undo()")
      return context
    },

    redo: (context: StateContext) => {
      console.log("[rootStore] Запуск redo()")
      return context
    },

    clearHistory: (context: StateContext) => {
      console.log("[rootStore] Запуск clearHistory()")
      return context
    },

    saveState: (context: StateContext) => {
      console.log("[rootStore] Запуск saveState()")
      return context
    },

    markAsSaved: (context: StateContext) => {
      console.log("[rootStore] Запуск markAsSaved()")
      return {
        ...context,
        isSaved: true,
        isDirty: false,
      }
    },

    setIsPlaying: (context: StateContext, event: { isPlaying: boolean }) => {
      console.log("[rootStore] Запуск setIsPlaying()", event.isPlaying)
      return {
        ...context,
        isPlaying: event.isPlaying,
      }
    },

    setCurrentTime: (
      context: StateContext,
      event: { time: number; source?: "playback" | "user" },
    ) => {
      // Проверка на валидность времени
      if (!isFinite(event.time) || event.time < 0) {
        console.warn("[setCurrentTime] Некорректное время:", event.time)
        return context
      }

      // Проверяем, что время не слишком большое (больше 100 лет)
      if (event.time > 100 * 365 * 24 * 60 * 60) {
        console.warn("[setCurrentTime] Время слишком большое:", event.time)
        return {
          ...context,
          currentTime: 0,
        }
      }

      // Проверяем, что время не слишком маленькое (меньше 0.001 секунды)
      if (event.time < 0.001) {
        console.warn("[setCurrentTime] Время слишком маленькое:", event.time)
        return {
          ...context,
          currentTime: 0,
        }
      }

      // Проверяем, что время не NaN
      if (isNaN(event.time)) {
        console.warn("[setCurrentTime] Время NaN:", event.time)
        return {
          ...context,
          currentTime: 0,
        }
      }

      // Если есть активное видео, проверяем, что время не выходит за его пределы
      if (context.activeVideo) {
        const videoStartTime = context.activeVideo.startTime || 0
        const videoDuration = context.activeVideo.duration || 0
        const videoEndTime = videoStartTime + videoDuration

        if (event.time > videoEndTime) {
          console.warn("[setCurrentTime] Время больше длительности видео:", event.time)
          return {
            ...context,
            currentTime: videoEndTime,
          }
        }
      }

      // Если все проверки пройдены, обновляем время
      return {
        ...context,
        currentTime: event.time,
      }
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
      console.log("[beforeunload] State forced to save:", currentState)
    }
  })
}

// Генерация уникальных идентификаторов для использования в приложении
export function generateSegmentId(): string {
  return nanoid()
}
