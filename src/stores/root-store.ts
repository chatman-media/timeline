import { createStore } from "@xstate/store"
import { historyDB } from "@/lib/indexed-db"

import { STORAGE_KEYS } from "@/lib/constants"
import { generateVideoId } from "@/lib/utils"
import type { MediaFile, ScreenLayout, TimeRange, Track } from "@/types/videos"
import { createTracksFromFiles } from "@/utils/media-utils"

interface Action {
  id: number
  type: string
  data: any
  timestamp: number
}

/**
 * Начальное состояние корневого хранилища
 */
const initialContext = {
  media: [] as MediaFile[],
  isLoading: true,
  hasMedia: false,
  isPlaying: false,
  currentTime: 0,
  timeRanges: {} as Record<string, TimeRange[]>,
  tracks: [] as Track[],
  videoRefs: {} as { [key: string]: HTMLVideoElement },
  activeVideo: undefined as MediaFile | undefined,
  hasFetched: false,
  activeTrackId: null as string | null,
  isChangingCamera: false,
  metadataCache: {} as Record<string, any>,
  thumbnailCache: {} as Record<string, string>,
  currentLayout: { type: "1x1", activeTracks: ["T1"] } as ScreenLayout,
  addedFiles: new Set<string>(),
  isSaved: true,
  scale: 1,
  volume: 1,
  trackVolumes: {} as Record<string, number>,
  isSeeking: false,
  // История действий
  actionHistory: [] as Action[],
  currentActionIndex: -1,
}

/**
 * Корневое хранилище приложения
 * Управляет состоянием видео, треков, метаданных и UI
 */
export const rootStore = createStore({
  context: initialContext,
  on: {
    setScreenLayout: (context, event: { layout: ScreenLayout }) => ({
      ...context,
      currentLayout: event.layout,
    }),

    fetchVideos: (context, _event, enqueue) => {
      if (context.hasFetched) return context

      enqueue.effect(async () => {
        try {
          const response = await fetch("/api/media")
          const data = await response.json()

          if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
            console.error("No media received from API")
            rootStore.send({
              type: "setLoadingState",
              isLoading: false,
              hasFetched: true,
            })
            return
          }

          const validMedia = data.media
            .map((file: MediaFile) => ({
              ...file,
              id: file.id || generateVideoId(data.media),
            }))
            .filter((file: MediaFile) => file.duration)
            .sort((a: MediaFile, b: MediaFile) => (a.startTime || 0) - (b.startTime || 0))

          if (validMedia.length === 0) {
            rootStore.send({
              type: "setInitialState",
              videos: [],
              hasMedia: false,
              isLoading: false,
              hasFetched: true,
              media: data.media,
            })
            return
          }

          rootStore.send({
            type: "setInitialState",
            videos: validMedia,
            hasMedia: true,
            isLoading: false,
            hasFetched: true,
            media: data.media,
          })
        } catch (error) {
          console.error("Error fetching videos:", error)
          rootStore.send({
            type: "setLoadingState",
            isLoading: false,
            hasFetched: true,
          })
        }
      })

      return {
        ...context,
        isLoading: true,
        hasFetched: true,
      }
    },

    setInitialState: (
      context,
      event: {
        videos: MediaFile[]
        hasMedia: boolean
        isLoading: boolean
        hasFetched: boolean
        media: MediaFile[]
      },
    ) => ({
      ...context,
      hasMedia: event.hasMedia,
      isLoading: event.isLoading,
      hasFetched: event.hasFetched,
      media: event.media,
    }),

    setLoadingState: (context, event: { isLoading: boolean; hasFetched: boolean }) => ({
      ...context,
      isLoading: event.isLoading,
      hasFetched: event.hasFetched,
    }),

    setActiveVideo: (context, event: { videoId: string }, enqueue) => {
      const targetVideo = context.media.find((v) => v.id === event.videoId)
      if (targetVideo) {
        // Добавляем действие в историю
        enqueue.effect(() => {
          rootStore.send({
            type: "addToHistory",
            data: {
              type: "setActiveVideo",
              previousVideo: context.activeVideo,
              newVideo: targetVideo,
            },
          })
        })

        return {
          ...context,
          activeVideo: targetVideo,
        }
      }
      return context
    },

    setActiveTrack: (context, event: { trackId: string }, enqueue) => {
      const { currentTime, tracks } = context

      try {
        const targetTrack = tracks.find((track) => track.id === event.trackId)

        if (!targetTrack) {
          console.warn(`Track ${event.trackId} not found`)
          return context
        }

        // Find available video with better error handling
        const availableVideo = targetTrack.videos.find((video) => {
          if (!video.probeData?.format.tags?.creation_time) {
            console.warn(`Video ${video.id} missing creation time`)
            return false
          }

          const startTime = new Date(video.probeData.format.tags.creation_time).getTime() / 1000
          const endTime = startTime + (video.probeData.format.duration || 0)
          const tolerance = 0.3
          return currentTime >= startTime - tolerance && currentTime <= endTime + tolerance
        })

        if (availableVideo) {
          // Добавляем действие в историю
          enqueue.effect(() => {
            rootStore.send({
              type: "addToHistory",
              data: {
                type: "setActiveTrack",
                previousTrackId: context.activeTrackId,
                newTrackId: event.trackId,
              },
            })
          })

          return {
            ...context,
            activeTrackId: event.trackId,
            activeVideo: availableVideo,
            isChangingCamera: false,
          }
        } else {
          console.warn(`No available video found for time ${currentTime} in track ${event.trackId}`)
          return { ...context, isChangingCamera: false }
        }
      } catch (error) {
        console.error("Error while changing camera:", error)
        return { ...context, isChangingCamera: false }
      }
    },

    setIsPlaying: (context, event: { isPlaying: boolean }) => ({
      ...context,
      isPlaying: event.isPlaying,
    }),

    setCurrentTime: (context, event: { time: number }) => ({
      ...context,
      currentTime: event.time,
      isSeeking: true,
    }),

    setIsSeeking: (context, event: { isSeeking: boolean }) => ({
      ...context,
      isSeeking: event.isSeeking,
    }),

    setTracks: (context, event: { tracks: Track[] }, enqueue) => {
      // Если треки очищаются (пустой массив), то очищаем и addedFiles
      if (event.tracks.length === 0) {
        localStorage.removeItem(STORAGE_KEYS.ADDED_FILES)
        return {
          ...context,
          tracks: [] as Track[],
          addedFiles: new Set<string>(),
        }
      }

      // Добавляем действие в историю
      enqueue.effect(() => {
        rootStore.send({
          type: "addToHistory",
          data: {
            type: "setTracks",
            previousTracks: context.tracks,
            newTracks: event.tracks,
          },
        })
      })

      return {
        ...context,
        tracks: event.tracks,
      }
    },

    addToMetadataCache: (context, event: { key: string; data: any }) => ({
      ...context,
      metadataCache: {
        ...context.metadataCache,
        [event.key]: event.data,
      },
    }),

    addToThumbnailCache: (context, event: { key: string; data: string }) => ({
      ...context,
      thumbnailCache: {
        ...context.thumbnailCache,
        [event.key]: event.data,
      },
    }),

    addToAddedFiles: (context, event: { filePaths: string[] }) => {
      const newAddedFiles = new Set([...context.addedFiles, ...event.filePaths])
      localStorage.setItem(STORAGE_KEYS.ADDED_FILES, JSON.stringify([...newAddedFiles]))
      return {
        ...context,
        addedFiles: newAddedFiles,
      }
    },

    addNewTracks: (context, event: { media: MediaFile[] }, enqueue) => {
      const { tracks } = context

      // Фильтруем файлы - только с аудио потоком
      const mediaWithAudio = event.media.filter((file) => {
        const hasAudioStream = file.probeData?.streams?.some(
          (stream) => stream.codec_type === "audio",
        )
        return hasAudioStream
      })

      if (mediaWithAudio.length === 0) {
        console.warn("Нет файлов с аудио потоком")
        return context
      }

      const newTracks = createTracksFromFiles(mediaWithAudio, tracks.length)
      const uniqueNewTracks = newTracks.filter((t) => !new Set(tracks.map((t) => t.id)).has(t.id))

      // Добавляем пути файлов в addedFiles
      const newFilePaths = mediaWithAudio
        .filter((file) => file.path)
        .map((file) => file.path as string)
      const updatedAddedFiles = new Set([...Array.from(context.addedFiles), ...newFilePaths])

      // Сохраняем состояние в localStorage
      enqueue.effect(() => {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.ADDED_FILES, JSON.stringify([...updatedAddedFiles]))
        }
      })

      return {
        ...context,
        tracks: [...tracks, ...uniqueNewTracks],
        addedFiles: updatedAddedFiles,
      }
    },

    // Сохранение состояния
    saveState: (context, _event, enqueue) => {
      enqueue.effect(async () => {
        try {
          await historyDB.saveState(context)
        } catch (error) {
          console.error('Ошибка при сохранении состояния:', error)
        }
      })

      return context
    },

    // Загрузка состояния
    loadState: (context, _event, enqueue) => {
      enqueue.effect(async () => {
        try {
          const savedState = await historyDB.getLatestState()
          if (savedState) {
            rootStore.send({
              type: "setState",
              state: savedState
            })
          }
        } catch (error) {
          console.error('Ошибка при загрузке состояния:', error)
        }
      })

      return context
    },

    // Установка состояния
    setState: (context, event: { state: any }) => ({
      ...event.state
    }),

    // Очистка состояния
    clearState: (context, _event, enqueue) => {
      enqueue.effect(async () => {
        try {
          await historyDB.clearState()
        } catch (error) {
          console.error('Ошибка при очистке состояния:', error)
        }
      })

      return initialContext
    },

    markAsUnsaved: (context) => ({
      ...context,
      isSaved: false,
    }),

    markAsSaved: (context) => ({
      ...context,
      isSaved: true,
    }),

    setScale: (context, event: { scale: number }) => ({
      ...context,
      scale: event.scale,
    }),

    setVolume: (context, event: { volume: number }) => ({
      ...context,
      volume: event.volume,
    }),

    setTrackVolume: (context, event: { trackId: string; volume: number }) => ({
      ...context,
      trackVolumes: {
        ...context.trackVolumes,
        [event.trackId]: event.volume,
      },
    }),

    // Добавляем действие в историю
    addToHistory: (context, event: { type: string; data: any }, enqueue) => {
      enqueue.effect(async () => {
        try {
          const id = await historyDB.addAction({
            type: event.type,
            data: event.data,
            timestamp: Date.now(),
          })

          // Если мы находимся не в конце истории, удаляем все действия после текущего
          const newHistory = context.actionHistory.slice(0, context.currentActionIndex + 1)
          newHistory.push({ 
            id, 
            type: event.type, 
            data: event.data,
            timestamp: Date.now(),
          })
          
          rootStore.send({
            type: "updateHistory",
            history: newHistory,
            currentIndex: newHistory.length - 1,
          })
        } catch (error) {
          console.error('Ошибка при сохранении действия в историю:', error)
        }
      })

      return context
    },

    // Обновление истории
    updateHistory: (context, event: { history: Action[]; currentIndex: number }) => ({
      ...context,
      actionHistory: event.history,
      currentActionIndex: event.currentIndex,
    }),

    // Загрузка истории при инициализации
    loadHistory: (context, _event, enqueue) => {
      enqueue.effect(async () => {
        try {
          const actions = await historyDB.getActions()
          rootStore.send({
            type: "updateHistory",
            history: actions,
            currentIndex: actions.length - 1,
          })
        } catch (error) {
          console.error('Ошибка при загрузке истории:', error)
        }
      })

      return context
    },

    // Отмена действия
    undo: (context) => {
      if (context.currentActionIndex < 0) return context
      
      const action = context.actionHistory[context.currentActionIndex]
      let newContext = { ...context }
      
      // Восстанавливаем предыдущее состояние в зависимости от типа действия
      switch (action.type) {
        case 'setTracks':
          newContext.tracks = action.data.previousTracks
          break
        case 'setActiveTrack':
          newContext.activeTrackId = action.data.previousTrackId
          break
        case 'setActiveVideo':
          newContext.activeVideo = action.data.previousVideo
          break
        // Добавьте другие типы действий по необходимости
      }
      
      return {
        ...newContext,
        currentActionIndex: context.currentActionIndex - 1,
      }
    },

    // Повтор действия
    redo: (context) => {
      if (context.currentActionIndex >= context.actionHistory.length - 1) return context
      
      const action = context.actionHistory[context.currentActionIndex + 1]
      let newContext = { ...context }
      
      // Применяем действие в зависимости от его типа
      switch (action.type) {
        case 'setTracks':
          newContext.tracks = action.data.newTracks
          break
        case 'setActiveTrack':
          newContext.activeTrackId = action.data.newTrackId
          break
        case 'setActiveVideo':
          newContext.activeVideo = action.data.newVideo
          break
        // Добавьте другие типы действий по необходимости
      }
      
      return {
        ...newContext,
        currentActionIndex: context.currentActionIndex + 1,
      }
    },

    // Очистка истории
    clearHistory: (context, _event, enqueue) => {
      enqueue.effect(async () => {
        try {
          await historyDB.clearHistory()
          rootStore.send({
            type: "updateHistory",
            history: [],
            currentIndex: -1,
          })
        } catch (error) {
          console.error('Ошибка при очистке истории:', error)
        }
      })

      return context
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
  return (time / (track?.combinedDuration || 0)) * 100
}

/**
 * Конвертирует процентное значение в время относительно длительности активного трека
 * @param percent - Процентное значение (0-100)
 * @returns Время в секундах
 */
export function percentToTime(percent: number) {
  const { context } = rootStore.getSnapshot()
  const track = context.tracks.find((t) => t.id === context.activeTrackId)
  return (percent / 100) * (track?.combinedDuration || 0)
}
