import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createActor } from "xstate"

import { timelineMachine } from "@/machines/timeline-machine"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimelineVideo } from "@/types/timeline"

interface TimelineProviderProps {
  children: React.ReactNode
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentLayout, setCurrentLayout] = useState("default")
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [isRecordingSchema, setIsRecordingSchema] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [volume, setVolume] = useState(1)
  const [trackVolumes, setTrackVolumes] = useState<Record<string, number>>({})
  const [isSeeking, setIsSeeking] = useState(false)
  const [isChangingCamera, setIsChangingCamera] = useState(false)
  const [videoRefs, setVideoRefs] = useState<Record<string, HTMLVideoElement>>({})
  const [videos, setVideos] = useState<Record<string, TimelineVideo>>({})
  const [localActiveVideo, setLocalActiveVideo] = useState<MediaFile | null>(null)

  const timelineActor = useMemo(() => createActor(timelineMachine), [])

  useEffect(() => {
    timelineActor.start()
    return () => {
      timelineActor.stop()
    }
  }, [timelineActor])

  const handleZoom = useCallback(
    (level: number) => {
      timelineActor.send({ type: "ZOOM", level })
    },
    [timelineActor],
  )

  const handleUndo = useCallback(() => {
    timelineActor.send({ type: "UNDO" })
  }, [timelineActor])

  const handleRedo = useCallback(() => {
    timelineActor.send({ type: "REDO" })
  }, [timelineActor])

  const handleSetLayout = useCallback(
    (layout: string) => {
      timelineActor.send({ type: "SET_LAYOUT", layout })
    },
    [timelineActor],
  )

  const handleSetActiveTrack = useCallback(
    (trackId: string | null) => {
      timelineActor.send({ type: "SET_ACTIVE_TRACK", trackId })
    },
    [timelineActor],
  )

  const addMediaFiles = useCallback(
    (files: MediaFile[]) => {
      timelineActor.send({ type: "addMediaFiles", files })
    },
    [timelineActor],
  )

  const handleRemoveFromAddedFiles = useCallback(
    (fileIds: string[]) => {
      fileIds.forEach((fileId) => {
        timelineActor.send({ type: "REMOVE_FROM_ADDED_FILES", fileId })
      })
    },
    [timelineActor],
  )

  const handleStopRecordingSchema = useCallback(() => {
    timelineActor.send({ type: "STOP_RECORDING_SCHEMA" })
  }, [timelineActor])

  const handleSetCurrentTime = useCallback(
    (time: number) => {
      timelineActor.send({ type: "SET_CURRENT_TIME", time })
    },
    [timelineActor],
  )

  const handleSetPlaying = useCallback(
    (playing: boolean) => {
      timelineActor.send({ type: "SET_PLAYING", playing })
    },
    [timelineActor],
  )

  const handleSetActiveVideo = useCallback(
    (videoId: string | null) => {
      timelineActor.send({ type: "SET_ACTIVE_VIDEO", videoId })
    },
    [timelineActor],
  )

  const handleSeek = useCallback(
    (time: number) => {
      timelineActor.send({ type: "SEEK", time })
    },
    [timelineActor],
  )

  const handleStartRecordingSchema = useCallback(
    (trackId: string, time: number) => {
      timelineActor.send({ type: "START_RECORDING_SCHEMA", trackId, time })
    },
    [timelineActor],
  )

  const handleSetTrackVolume = useCallback(
    (trackId: string, volume: number) => {
      timelineActor.send({ type: "SET_TRACK_VOLUME", trackId, volume })
    },
    [timelineActor],
  )

  const handleSetSeeking = useCallback(
    (isSeeking: boolean) => {
      timelineActor.send({ type: "SET_SEEKING", isSeeking })
    },
    [timelineActor],
  )

  const handleResetChangingCamera = useCallback(() => {
    timelineActor.send({ type: "RESET_CHANGING_CAMERA" })
  }, [timelineActor])

  useEffect(() => {
    const subscription = timelineActor.subscribe((state) => {
      setZoomLevel(state.context.zoomLevel)
      setCanUndo(false)
      setCanRedo(false)
      setTracks(state.context.tracks)
      setActiveTrackId(state.context.activeTrackId)
      setIsRecordingSchema(state.context.isRecordingSchema)
      setCurrentTime(state.context.currentTime)
      setTrackVolumes(state.context.trackVolumes)
      setIsSeeking(state.context.isSeeking)
      setIsChangingCamera(state.context.isChangingCamera)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [timelineActor])

  const activeVideo = useMemo(() => {
    if (!activeVideoId) return null
    return videos[activeVideoId]
  }, [activeVideoId, videos])

  const { send } = timelineActor

  const setVideo = (video: MediaFile | null) => {
    send({ type: "SET_ACTIVE_VIDEO", videoId: video?.id || null })
  }

  const value = {
    zoomLevel,
    zoom: handleZoom,
    tracks,
    setTracks,
    currentLayout,
    setLayout: handleSetLayout,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    currentTime,
    duration,
    isPlaying,
    isRecordingSchema,
    activeTrackId,
    activeVideoId: localActiveVideo?.id || null,
    activeVideo: localActiveVideo,
    setVideo,
    seek: handleSeek,
    setTrack: handleSetActiveTrack,
    stopRecording: handleStopRecordingSchema,
    startRecording: handleStartRecordingSchema,
    removeFiles: handleRemoveFromAddedFiles,
    addMediaFiles,
    setTime: handleSetCurrentTime,
    setPlaying: handleSetPlaying,
    setTrackVolume: handleSetTrackVolume,
    setSeeking: handleSetSeeking,
    resetCamera: handleResetChangingCamera,
    videoRefs,
    volume,
    isSeeking,
    isChangingCamera,
    videoPath: localActiveVideo?.path || null,
    trackVolumes,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

export const TimelineContext = React.createContext<{
  zoomLevel: number
  zoom: (level: number) => void
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
  currentLayout: string
  setLayout: (layout: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  currentTime: number
  duration: number
  isPlaying: boolean
  isRecordingSchema: boolean
  activeTrackId: string | null
  activeVideoId: string | null
  activeVideo: MediaFile | null
  setVideo: (video: MediaFile | null) => void
  seek: (time: number) => void
  setTrack: (trackId: string | null) => void
  addMediaFiles: (files: MediaFile[]) => void
  removeFiles: (fileIds: string[]) => void
  setTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setSeeking: (isSeeking: boolean) => void
  resetCamera: () => void
  trackVolumes: Record<string, number>
  videoRefs: Record<string, HTMLVideoElement>
  volume: number
  isSeeking: boolean
  isChangingCamera: boolean
  videoPath: string | null
} | null>(null)

// Хук для использования контекста таймлайна
export function useTimeline() {
  const context = React.useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }
  return context
}
