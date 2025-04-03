import { useSelector } from "@xstate/store/react"
import { useCallback } from "react"

import { rootStore } from "@/stores/root-store"
import type { MediaFile, ScreenLayout, Track } from "@/types/videos"

/**
 * Хук для доступа к корневому хранилищу приложения
 * Предоставляет доступ к состоянию и действиям для управления медиафайлами,
 * треками, метаданными и UI
 */
export function useRootStore() {
  const { send } = rootStore

  // Селекторы для доступа к состоянию
  const videos = useSelector(rootStore, (state) => state.context.videos)
  const media = useSelector(rootStore, (state) => state.context.media)
  const isLoading = useSelector(rootStore, (state) => state.context.isLoading)
  const hasMedia = useSelector(rootStore, (state) => state.context.hasMedia)
  const isPlaying = useSelector(rootStore, (state) => state.context.isPlaying)
  const currentTime = useSelector(rootStore, (state) => state.context.currentTime)
  const tracks = useSelector(rootStore, (state) => state.context.tracks)
  const videoRefs = useSelector(rootStore, (state) => state.context.videoRefs)
  const activeVideo = useSelector(rootStore, (state) => state.context.activeVideo)
  const activeTrackId = useSelector(rootStore, (state) => state.context.activeTrackId)
  const currentLayout = useSelector(rootStore, (state) => state.context.currentLayout)
  const timeRanges = useSelector(rootStore, (state) => state.context.timeRanges)
  const hasFetched = useSelector(rootStore, (state) => state.context.hasFetched)
  const isChangingCamera = useSelector(rootStore, (state) => state.context.isChangingCamera)
  const metadataCache = useSelector(rootStore, (state) => state.context.metadataCache)
  const thumbnailCache = useSelector(rootStore, (state) => state.context.thumbnailCache)


  // Действия
  const setVideos = useCallback(
    (videos: MediaFile[]) => {
      send({ type: "setVideos", videos })
    },
    [send],
  )

  const setMedia = useCallback(
    (media: MediaFile[]) => {
      send({ type: "setMedia", media })
    },
    [send],
  )

  const setActiveTrack = useCallback(
    (trackId: string) => {
      send({ type: "setActiveTrack", trackId })
    },
    [send],
  )

  const setActiveVideo = useCallback(
    (videoId: string) => {
      send({ type: "setActiveVideo", videoId })
    },
    [send],
  )

  const setIsPlaying = useCallback(
    (isPlaying: boolean) => {
      send({ type: "setIsPlaying", isPlaying })
    },
    [send],
  )

  const setCurrentTime = useCallback(
    (time: number) => {
      send({ type: "setCurrentTime", time })
    },
    [send],
  )

  const fetchVideos = useCallback(() => {
    send({ type: "fetchVideos" })
  }, [send])

  const setTracks = useCallback(
    (tracks: Track[]) => {
      send({ type: "setTracks", tracks })
    },
    [send],
  )

  const setScreenLayout = useCallback(
    (layout: ScreenLayout) => {
      send({ type: "setScreenLayout", layout })
    },
    [send],
  )

  const addToMetadataCache = useCallback(
    (key: string, data: any) => {
      send({ type: "addToMetadataCache", key, data })
    },
    [send],
  )

  const addToThumbnailCache = useCallback(
    (key: string, data: string) => {
      send({ type: "addToThumbnailCache", key, data })
    },
    [send],
  )

  const addNewTracks = useCallback(
    (media: MediaFile[]) => {
      send({ type: "addNewTracks", media })
    },
    [send],
  )

  // Функция для переключения воспроизведения
  const play = useCallback(() => {
    send({ type: "setIsPlaying", isPlaying: !isPlaying })
  }, [send, isPlaying])

  // Функции для работы с временем
  const timeToPercent = useCallback(
    (time: number) => {
      const track = tracks.find((t) => t.id === activeTrackId)
      return (time / (track?.combinedDuration || 0)) * 100
    },
    [tracks, activeTrackId],
  )

  const percentToTime = useCallback(
    (percent: number) => {
      const track = tracks.find((t) => t.id === activeTrackId)
      return (percent / 100) * (track?.combinedDuration || 0)
    },
    [tracks, activeTrackId],
  )

  return {
    // Состояние
    videos,
    media,
    isLoading,
    hasMedia,
    isPlaying,
    currentTime,
    timeRanges,
    tracks,
    videoRefs,
    activeVideo,
    activeTrackId,
    currentLayout,

    // Действия
    setVideos,
    setMedia,
    setActiveTrack,
    setActiveVideo,
    setIsPlaying,
    setCurrentTime,
    fetchVideos,
    setTracks,
    setScreenLayout,
    addToMetadataCache,
    addToThumbnailCache,
    addNewTracks,
    play,

    // Вспомогательные функции
    timeToPercent,
    percentToTime,
    hasFetched,
    isChangingCamera,
    metadataCache,
    thumbnailCache,
  }
}
