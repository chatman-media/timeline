import { useActorRef, useSelector } from "@xstate/react"
import React, { createContext, ReactNode, useContext } from "react"

import { Sector } from "@/media-editor/browser"
import {
  type TimelineContext,
  timelineMachine,
} from "@/media-editor/timeline/services/timeline-machine"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimeRange } from "@/types/time-range"

interface TimelineContextType {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  sectors: Sector[]
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  canUndo: boolean
  canRedo: boolean
  videoRefs: Record<string, HTMLVideoElement | null>
  loadedVideos: Record<string, boolean>
  previousStates: TimelineContext[]
  currentStateIndex: number

  zoom: (level: number) => void
  fitToScreen: (containerWidth: number) => void
  undo: () => void
  redo: () => void
  setTracks: (tracks: Track[]) => void
  setActiveTrack: (id: string) => void
  seek: (time: number) => void
  removeFiles: (fileIds: string[]) => void
  addMediaFiles: (files: MediaFile[]) => void
  setPlaying: (playing: boolean) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setSeeking: (isSeeking: boolean) => void
  setTimeRanges: (timeRanges: Record<string, TimeRange[]>) => void
  setVideoRef: (fileId: string, video: HTMLVideoElement | null) => void
  setLoadedVideo: (fileId: string, loaded: boolean) => void
  preloadAllVideos: () => void
  setIsChangingCamera: (isChangingCamera: boolean) => void
}

interface TimelineProviderProps {
  children: ReactNode
}

const TimelineContext = createContext<TimelineContextType | null>(null)

export function useTimeline(): TimelineContextType {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }
  return context
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const timelineActor = useActorRef(timelineMachine)
  const state = useSelector(timelineActor, (state) => state.context)
  const send = timelineActor.send

  const handleZoom = React.useCallback(
    (level: number) => {
      send({ type: "ZOOM", level })
    },
    [send],
  )

  const handleUndo = React.useCallback(() => {
    send({ type: "UNDO" })
  }, [send])

  const handleRedo = React.useCallback(() => {
    send({ type: "REDO" })
  }, [send])

  const setActiveTrack = React.useCallback(
    (trackId: string) => {
      send({ type: "SET_ACTIVE_TRACK", trackId })
    },
    [send],
  )

  const handleSetTracks = React.useCallback(
    (tracks: Track[]) => {
      send({ type: "SET_TRACKS", tracks })
    },
    [send],
  )

  const handleSeek = React.useCallback(
    (time: number) => {
      send({ type: "SEEK", time })
    },
    [send],
  )

  const handleRemoveFromAddedFiles = React.useCallback(
    (fileIds: string[]) => {
      fileIds.forEach((fileId) => {
        send({ type: "REMOVE_MEDIA_FILE", fileId })
      })
    },
    [send],
  )

  const handleAddMediaFiles = React.useCallback(
    (files: MediaFile[]) => {
      send({ type: "ADD_MEDIA_FILES", files })
    },
    [send],
  )

  const handleSetPlaying = React.useCallback(
    (playing: boolean) => {
      send({ type: playing ? "PLAY" : "PAUSE" })
    },
    [send],
  )

  const handleSetTrackVolume = React.useCallback(
    (trackId: string, volume: number) => {
      send({ type: "SET_TRACK_VOLUME", trackId, volume })
    },
    [send],
  )

  const handleSetSeeking = React.useCallback(
    (isSeeking: boolean) => {
      send({ type: "SET_SEEKING", isSeeking })
    },
    [send],
  )

  const handleSetTimeRanges = React.useCallback(
    (timeRanges: Record<string, TimeRange[]>) => {
      send({ type: "SET_TIME_RANGES", ranges: timeRanges })
    },
    [send],
  )

  const handleSetVideoRef = React.useCallback(
    (fileId: string, video: HTMLVideoElement | null) => {
      send({ type: "SET_VIDEO_REF", fileId, video })
    },
    [send],
  )

  const handleSetLoadedVideo = React.useCallback(
    (fileId: string, loaded: boolean) => {
      send({ type: "SET_LOADED_VIDEO", fileId, loaded })
    },
    [send],
  )

  const handlePreloadAllVideos = React.useCallback(() => {
    send({ type: "PRELOAD_ALL_VIDEOS" })
  }, [send])

  const handleFitToScreen = React.useCallback(
    (containerWidth: number) => {
      send({ type: "FIT_TO_SCREEN", containerWidth })
    },
    [send],
  )

  const handleSetIsChangingCamera = React.useCallback(
    (isChangingCamera: boolean) => {
      send({ type: "SET_CHANGING_CAMERA", isChangingCamera })
    },
    [send],
  )

  const value: TimelineContextType = {
    ...state,
    zoom: handleZoom,
    fitToScreen: handleFitToScreen,
    undo: handleUndo,
    redo: handleRedo,
    setTracks: handleSetTracks,
    setActiveTrack,
    seek: handleSeek,
    removeFiles: handleRemoveFromAddedFiles,
    addMediaFiles: handleAddMediaFiles,
    setPlaying: handleSetPlaying,
    setTrackVolume: handleSetTrackVolume,
    setSeeking: handleSetSeeking,
    setTimeRanges: handleSetTimeRanges,
    setVideoRef: handleSetVideoRef,
    setLoadedVideo: handleSetLoadedVideo,
    preloadAllVideos: handlePreloadAllVideos,
    setIsChangingCamera: handleSetIsChangingCamera,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}
