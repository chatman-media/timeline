import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createActor } from "xstate"

import { timelineMachine } from "@/machines/timeline-machine"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimeRange } from "@/types/time-range"

interface TimelineProviderProps {
  children: React.ReactNode
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [trackVolumes, setTrackVolumes] = useState<Record<string, number>>({})
  const [isSeeking, setIsSeeking] = useState(false)
  const [isChangingCamera, setIsChangingCamera] = useState(false)
  const [timeRanges, setTimeRanges] = useState<Record<string, TimeRange[]>>({})

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

  const setActiveTrack = useCallback(
    (trackId: string | null) => {
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
        timelineActor.send({ type: "REMOVE_FROM_ADDED_FILES", fileId })
      })
    },
    [timelineActor],
  )

  const handleSetPlaying = useCallback(
    (playing: boolean) => {
      timelineActor.send({ type: "SET_PLAYING", playing })
    },
    [timelineActor],
  )

  const handleSeek = useCallback(
    (time: number) => {
      timelineActor.send({ type: "SEEK", time })
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

  const handleSetTimeRanges = useCallback(
    (timeRanges: Record<string, TimeRange[]>) => {
      timelineActor.send({ type: "setTimeRanges", ranges: timeRanges })
    },
    [timelineActor],
  )

  useEffect(() => {
    const subscription = timelineActor.subscribe((state) => {
      setZoomLevel(state.context.zoomLevel)
      setCanUndo(false)
      setCanRedo(false)
      setTracks(state.context.tracks)
      setActiveTrackId(state.context.activeTrackId)
      setTrackVolumes(state.context.trackVolumes)
      setIsSeeking(state.context.isSeeking)
      setIsChangingCamera(state.context.isChangingCamera)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [timelineActor])

  const value = {
    timeRanges,
    zoomLevel,
    zoom: handleZoom,
    tracks,
    setTracks,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    activeTrackId,
    seek: handleSeek,
    setTrack: setActiveTrack,
    removeFiles: handleRemoveFromAddedFiles,
    addMediaFiles,
    setPlaying: handleSetPlaying,
    setTrackVolume: handleSetTrackVolume,
    setSeeking: handleSetSeeking,
    isSeeking,
    isChangingCamera,
    trackVolumes,
    setTimeRanges: handleSetTimeRanges,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

export const TimelineContext = React.createContext<{
  zoomLevel: number
  zoom: (level: number) => void
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  activeTrackId: string | null
  seek: (time: number) => void
  setTrack: (trackId: string | null) => void
  addMediaFiles: (files: MediaFile[]) => void
  removeFiles: (fileIds: string[]) => void
  setPlaying: (playing: boolean) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setSeeking: (isSeeking: boolean) => void
  setTimeRanges: (timeRanges: Record<string, TimeRange[]>) => void
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  timeRanges: Record<string, TimeRange[]>
    } | null>(null)

// Хук для использования контекста таймлайна
export function useTimelineContext() {
  const context = React.useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }
  return context
}
