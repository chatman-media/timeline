import { useSelector } from "@xstate/store/react"
import { useCallback } from "react"

import { StateContext } from "@/lib/state-types"
import { rootStore } from "@/stores/root-store"
import type { MediaFile, ScreenLayout, Track } from "@/types/videos"

/**
 * Хук для доступа к корневому хранилищу приложения
 * Предоставляет доступ к состоянию и действиям для управления медиафайлами,
 * треками, метаданными и UI
 */
export function useRootStore() {
  const { send } = rootStore
  const context = useSelector(rootStore, (state) => state.context)

  const {
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
    scale,
    volume,
    trackVolumes,
    isSeeking,
    historySnapshotIds,
    currentHistoryIndex,
    layoutMode,
    panelLayouts,
    isDirty,
    isRecordingSchema,
  } = context

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
    (time: number, source?: "playback" | "user") => {
      send({ type: "setCurrentTime", time, source })
    },
    [send],
  )

  const setScale = useCallback(
    (scale: number) => {
      send({ type: "setScale", scale })
    },
    [send],
  )

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

  const addToAddedFiles = useCallback(
    (filePaths: string[]) => {
      send({ type: "addToAddedFiles", filePaths })
    },
    [send],
  )

  const removeFromAddedFiles = useCallback(
    (filePaths: string[]) => {
      send({ type: "removeFromAddedFiles", filePaths })
    },
    [send],
  )

  const play = useCallback(() => {
    send({ type: "setIsPlaying", isPlaying: !isPlaying })
  }, [send, isPlaying])

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

  const initializeHistory = useCallback(() => {
    send({ type: "initializeHistory" })
  }, [send])

  const setVolume = useCallback(
    (volume: number) => {
      send({ type: "setVolume", volume })
    },
    [send],
  )

  const setTrackVolume = useCallback(
    (trackId: string, volume: number) => {
      send({ type: "setTrackVolume", trackId, volume })
    },
    [send],
  )

  const setIsSeeking = useCallback(
    (isSeeking: boolean) => {
      send({ type: "setIsSeeking", isSeeking })
    },
    [send],
  )

  const resetChangingCamera = useCallback(() => {
    send({ type: "resetChangingCamera" })
  }, [send])

  const fetchVideos = useCallback(() => {
    console.log("[useRootStore] Вызван fetchVideos()")
    send({ type: "fetchVideos" })
  }, [send])

  const startRecordingSchema = useCallback(
    (trackId: string, startTime: number) => {
      send({ type: "startRecordingSchema", trackId, startTime })
    },
    [send],
  )

  const stopRecordingSchema = useCallback(() => {
    send({ type: "stopRecordingSchema" })
  }, [send])

  const undo = useCallback(() => {
    send({ type: "undo" })
  }, [send])

  const redo = useCallback(() => {
    send({ type: "redo" })
  }, [send])

  const canUndo = currentHistoryIndex > 0
  const canRedo = currentHistoryIndex < historySnapshotIds.length - 1

  const setLayoutMode = useCallback(
    (mode: string) => {
      send({ type: "setLayoutMode", mode })
    },
    [send],
  )

  const setPanelLayout = useCallback(
    (id: string, sizes: number[]) => {
      send({ type: "setPanelLayout", id, sizes })
    },
    [send],
  )

  const clearHistory = useCallback(() => {
    send({ type: "clearHistory" })
  }, [send])

  const saveState = useCallback(() => {
    send({ type: "saveState" })
  }, [send])

  const markAsSaved = useCallback(() => {
    send({ type: "markAsSaved" })
  }, [send])

  return {
    context,
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
    scale,
    volume,
    trackVolumes,
    isSeeking,
    layoutMode,
    panelLayouts,
    isDirty,
    historySnapshotIds,
    currentHistoryIndex,
    isRecordingSchema,
    canUndo,
    canRedo,

    initializeHistory,
    fetchVideos,
    startRecordingSchema,
    stopRecordingSchema,
    setActiveTrack,
    setActiveVideo,
    setIsPlaying,
    setCurrentTime,
    setScale,
    setTracks,
    setScreenLayout,
    addToMetadataCache,
    addToThumbnailCache,
    addNewTracks,
    addToAddedFiles,
    removeFromAddedFiles,
    play,
    timeToPercent,
    percentToTime,
    hasFetched,
    isChangingCamera,
    metadataCache,
    thumbnailCache,
    setVolume,
    setTrackVolume,
    setIsSeeking,
    resetChangingCamera,
    undo,
    redo,
    setLayoutMode,
    setPanelLayout,
    clearHistory,
    saveState,
    markAsSaved,
    isSaved,
  }
}
