import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { createActor } from "xstate"

import { timelineMachine } from "@/timeline/services/timeline-machine"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimeRange } from "@/types/time-range"
import { Sector } from "@/browser"

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
  history: TimelineContextType[]
  historyIndex: number
  future: TimelineContextType[]
  canUndo: boolean
  canRedo: boolean
  videoRefs: Record<string, HTMLVideoElement | null>
  loadedVideos: Record<string, boolean>

  zoom: (level: number) => void
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
}

const TimelineContext = createContext<TimelineContextType | null>(null)

interface TimelineProviderProps {
  children: ReactNode
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [state, setState] = useState<TimelineContextType | undefined>(undefined)

  const timelineActor = useMemo(() => createActor(timelineMachine), [])

  useEffect(() => {
    timelineActor.start()
    return () => {
      timelineActor.stop()
    }
  }, [timelineActor])

  const handleZoom = useCallback(
    (level: number) => {
      console.log("TimelineProvider zoom:", level)
      timelineActor.send({ type: "zoom", level })
    },
    [timelineActor],
  )

  const handleUndo = useCallback(() => {
    timelineActor.send({ type: "undo" })
  }, [timelineActor])

  const handleRedo = useCallback(() => {
    timelineActor.send({ type: "redo" })
  }, [timelineActor])

  const setActiveTrack = useCallback(
    (trackId: string) => {
      timelineActor.send({ type: "setActiveTrack", trackId })
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
        timelineActor.send({ type: "removeFromAddedFiles", fileId })
      })
    },
    [timelineActor],
  )

  const handleSetPlaying = useCallback(
    (playing: boolean) => {
      timelineActor.send({ type: "setPlaying", playing })
    },
    [timelineActor],
  )

  const handleSeek = useCallback(
    (time: number) => {
      timelineActor.send({ type: "seek", time })
    },
    [timelineActor],
  )

  const handleSetTrackVolume = useCallback(
    (trackId: string, volume: number) => {
      timelineActor.send({ type: "setTrackVolume", trackId, volume })
    },
    [timelineActor],
  )

  const handleSetSeeking = useCallback(
    (isSeeking: boolean) => {
      timelineActor.send({ type: "setSeeking", isSeeking })
    },
    [timelineActor],
  )

  const handleSetTimeRanges = useCallback(
    (timeRanges: Record<string, TimeRange[]>) => {
      timelineActor.send({ type: "setTimeRanges", ranges: timeRanges })
    },
    [timelineActor],
  )

  const setVideoRef = useCallback(
    (fileId: string, video: HTMLVideoElement | null) => {
      timelineActor.send({ type: "setVideoRef", fileId, video })
    },
    [timelineActor],
  )

  const setLoadedVideo = useCallback(
    (fileId: string, loaded: boolean) => {
      timelineActor.send({ type: "setLoadedVideo", fileId, loaded })
    },
    [timelineActor],
  )

  const preloadAllVideos = useCallback(() => {
    timelineActor.send({ type: "preloadAllVideos" })
  }, [timelineActor])

  const setTracks = useCallback(
    (tracks: Track[]) => {
      timelineActor.send({ type: "setTracks", tracks })
    },
    [timelineActor],
  )

  useEffect(() => {
    const subscription = timelineActor.subscribe((snapshot) => {
      setState((prev: TimelineContextType) => ({
        ...prev,
        ...snapshot.context,
      }))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [timelineActor])

  const value = {
    isDirty: state?.isDirty,
    zoomLevel: state?.zoomLevel,
    timeRanges: state?.timeRanges,
    sectors: state?.sectors,
    activeTrackId: state?.activeTrackId,
    trackVolumes: state?.trackVolumes,
    isSeeking: state?.isSeeking,
    isChangingCamera: state?.isChangingCamera,
    tracks: state?.tracks,
    history: state?.history,
    historyIndex: state?.historyIndex,
    future: state?.future,
    canUndo: state?.canUndo,
    canRedo: state?.canRedo,
    videoRefs: state?.videoRefs,
    loadedVideos: state?.loadedVideos,
    zoom: handleZoom,
    undo: handleUndo,
    redo: handleRedo,
    setActiveTrack,
    setTracks,
    seek: handleSeek,
    removeFiles: handleRemoveFromAddedFiles,
    addMediaFiles,
    setPlaying: handleSetPlaying,
    setTrackVolume: handleSetTrackVolume,
    setSeeking: handleSetSeeking,
    setTimeRanges: handleSetTimeRanges,
    setVideoRef,
    setLoadedVideo,
    preloadAllVideos,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

export function useTimelineContext() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimelineContext must be used within a TimelineProvider")
  }
  return context
}
