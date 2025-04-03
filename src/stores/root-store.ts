import { createStore } from "@xstate/store"

import { STORAGE_KEYS } from "@/lib/constants"
import { generateVideoId } from "@/lib/utils"
import type { MediaFile, ScreenLayout, TimeRange, Track } from "@/types/videos"
import { createTracksFromFiles } from "@/utils/media-utils"

/**
 * Начальное состояние корневого хранилища
 */
const initialContext = {
  videos: [] as MediaFile[],
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

    setVideos: (context, event: { videos: MediaFile[] }) => ({
      ...context,
      videos: event.videos,
      activeTrackId: "T1",
      activeVideo: event.videos.find((v) => v.id === "V1") || event.videos[0],
      hasMedia: event.videos.length > 0,
      isChangingCamera: false,
    }),

    setMedia: (context, event: { media: MediaFile[] }) => ({
      ...context,
      media: event.media,
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
      videos: event.videos,
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

    setActiveVideo: (context, event: { videoId: string }) => {
      const targetVideo = context.videos.find((v) => v.id === event.videoId)
      if (targetVideo) {
        return {
          ...context,
          activeVideo: targetVideo,
        }
      }
      return context
    },

    setActiveTrack: (context, event: { trackId: string }) => {
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
    }),

    setTracks: (context, event: { tracks: Track[] }) => ({
      ...context,
      tracks: event.tracks,
    }),

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

    addToAddedFiles: (context, event: { fileIds: string[] }) => ({
      ...context,
      addedFiles: new Set([...Array.from(context.addedFiles), ...event.fileIds]),
    }),

    addNewTracks: (context, event: { media: MediaFile[] }) => {
      const { tracks } = context
      const newTracks = createTracksFromFiles(event.media, tracks.length)
      const uniqueNewTracks = newTracks.filter((t) => !new Set(tracks.map((t) => t.id)).has(t.id))

      // Добавляем ID файлов в addedFiles
      const newFileIds = event.media.map((file) => file.id)

      return {
        ...context,
        tracks: [...tracks, ...uniqueNewTracks],
        addedFiles: new Set([...Array.from(context.addedFiles), ...newFileIds]),
      }
    },

    saveState: (context) => {
      const stateToSave = {
        currentTime: context.currentTime,
        activeTrackId: context.activeTrackId,
        activeVideo: context.activeVideo,
        tracks: context.tracks,
        timeRanges: context.timeRanges,
        currentLayout: context.currentLayout,
      }

      localStorage.setItem(STORAGE_KEYS.TIMELINE_SLICES, JSON.stringify(stateToSave))
      return context
    },

    loadState: (context) => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEYS.TIMELINE_SLICES)
        if (!savedState) return context

        const parsedState = JSON.parse(savedState)

        // Если есть сохраненное активное видео, найдем его в текущих видео
        let activeVideo = context.activeVideo
        if (parsedState.activeVideo) {
          activeVideo =
            context.videos.find((v) => v.id === parsedState.activeVideo.id) || context.activeVideo
        }

        return {
          ...context,
          currentTime: parsedState.currentTime || context.currentTime,
          activeTrackId: parsedState.activeTrackId || context.activeTrackId,
          activeVideo: activeVideo,
          tracks: parsedState.tracks || context.tracks,
          timeRanges: parsedState.timeRanges || context.timeRanges,
          currentLayout: parsedState.currentLayout || context.currentLayout,
        }
      } catch (error) {
        console.error("Ошибка при загрузке состояния:", error)
        return context
      }
    },

    markAsUnsaved: (context) => ({
      ...context,
      isSaved: false,
    }),

    markAsSaved: (context) => ({
      ...context,
      isSaved: true,
    }),
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
