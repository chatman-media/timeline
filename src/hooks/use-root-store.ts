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
  const {
    videos,
    media,
    isLoading,
    hasMedia,
    isPlaying,
    currentTime,
    tracks,
    videoRefs,
    activeVideo,
    activeTrackId,
    currentLayout,
    timeRanges,
    hasFetched,
    isChangingCamera,
    metadataCache,
    thumbnailCache,
    addedFiles,
    isSaved,
  } = useSelector(rootStore, (state) => state.context)

  // Действия
  const setVideos = useCallback(
    (videos: MediaFile[]) => {
      send({ type: "setVideos", videos })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const setMedia = useCallback(
    (media: MediaFile[]) => {
      send({ type: "setMedia", media })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const setActiveTrack = useCallback(
    (trackId: string) => {
      send({ type: "setActiveTrack", trackId })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const setActiveVideo = useCallback(
    (videoId: string) => {
      send({ type: "setActiveVideo", videoId })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const setIsPlaying = useCallback(
    (isPlaying: boolean) => {
      send({ type: "setIsPlaying", isPlaying })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const setCurrentTime = useCallback(
    (time: number) => {
      send({ type: "setCurrentTime", time })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const fetchVideos = useCallback(() => {
    send({ type: "fetchVideos" })
  }, [send])

  const setTracks = useCallback(
    (tracks: Track[]) => {
      send({ type: "setTracks", tracks })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const setScreenLayout = useCallback(
    (layout: ScreenLayout) => {
      send({ type: "setScreenLayout", layout })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const addToMetadataCache = useCallback(
    (key: string, data: any) => {
      send({ type: "addToMetadataCache", key, data })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const addToThumbnailCache = useCallback(
    (key: string, data: string) => {
      send({ type: "addToThumbnailCache", key, data })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const addNewTracks = useCallback(
    (media: MediaFile[]) => {
      send({ type: "addNewTracks", media })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  const addToAddedFiles = useCallback(
    (fileIds: string[]) => {
      send({ type: "addToAddedFiles", fileIds })
      send({ type: "markAsUnsaved" })
    },
    [send],
  )

  // Функция для переключения воспроизведения
  const play = useCallback(() => {
    send({ type: "setIsPlaying", isPlaying: !isPlaying })
    send({ type: "markAsUnsaved" })
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

  const saveState = useCallback(() => {
    send({ type: "saveState" })
    send({ type: "markAsSaved" })
  }, [send])

  const loadState = useCallback(() => {
    send({ type: "loadState" })
  }, [send])

  const markAsUnsaved = useCallback(() => {
    send({ type: "markAsUnsaved" })
  }, [send])

  const markAsSaved = useCallback(() => {
    send({ type: "markAsSaved" })
  }, [send])

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
    addedFiles,
    isSaved,

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
    addToAddedFiles,
    play,
    timeToPercent,
    percentToTime,
    hasFetched,
    isChangingCamera,
    metadataCache,
    thumbnailCache,
    saveState,
    loadState,
    markAsUnsaved,
    markAsSaved,
  }
}
