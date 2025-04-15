import { assign, createMachine } from "xstate"

import { TimeRange } from "@/types/time-range"
import { Track } from "@/types/videos"
import { MediaFile } from "@/types/videos"

export interface TimelineVideo {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  path: string
  metadata: {
    filename: string
    codecName: string
    width: number
    height: number
    aspectRatio: string
    bitrate: number
    duration: number
  }
  position: {
    x: number
    width: number
  }
}

interface TimelineContext {
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  montageSchema: any[]
  isDirty: boolean
  currentTime: number
  isPlaying: boolean
  isRecordingSchema: boolean
  activeVideoId: string | null
  videos: Record<string, TimelineVideo>
  duration: number
  activeTrackId: string | null
  volume: number
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  videoRefs: Record<string, HTMLVideoElement>
  tracks: Track[]
  history: TimelineContext[]
  historyIndex: number
  currentLayout: string
  activeVideo: MediaFile | null
}

type ZoomEvent = {
  type: "ZOOM"
  level: number
}

type SetTimeRangesEvent = {
  type: "SET_TIME_RANGES"
  ranges: Record<string, TimeRange[]>
}

type SetLayoutModeEvent = {
  type: "SET_LAYOUT_MODE"
  mode: string
}

type SetMontageSchemaEvent = {
  type: "SET_MONTAGE_SCHEMA"
  schema: any[]
}

type SetCurrentTimeEvent = {
  type: "SET_CURRENT_TIME"
  time: number
}

type SetPlayingEvent = {
  type: "SET_PLAYING"
  playing: boolean
}

type SetRecordingEvent = {
  type: "SET_RECORDING"
  recording: boolean
}

type SetActiveVideoEvent = {
  type: "SET_ACTIVE_VIDEO"
  videoId: string | null
}

type SetVideosEvent = {
  type: "SET_VIDEOS"
  videos: Record<string, TimelineVideo>
}

type PlayEvent = {
  type: "PLAY"
}

type PauseEvent = {
  type: "PAUSE"
}

type SeekEvent = {
  type: "SEEK"
  time: number
}

type SetDurationEvent = {
  type: "SET_DURATION"
  duration: number
}

type SetActiveTrackEvent = {
  type: "SET_ACTIVE_TRACK"
  trackId: string | null
}

type SetVolumeEvent = {
  type: "SET_VOLUME"
  volume: number
}

type SetTrackVolumeEvent = {
  type: "SET_TRACK_VOLUME"
  trackId: string
  volume: number
}

type SetSeekingEvent = {
  type: "SET_SEEKING"
  isSeeking: boolean
}

type ResetChangingCameraEvent = {
  type: "RESET_CHANGING_CAMERA"
}

type AddTrackEvent = {
  type: "ADD_TRACK"
  track: Track
}

type UndoEvent = {
  type: "UNDO"
}

type RedoEvent = {
  type: "REDO"
}

type SetLayoutEvent = {
  type: "SET_LAYOUT"
  layout: string
}

type SetTracksEvent = {
  type: "SET_TRACKS"
  tracks: Track[]
}

type RemoveFromAddedFilesEvent = {
  type: "REMOVE_FROM_ADDED_FILES"
  fileId: string
}

type StopRecordingSchemaEvent = {
  type: "STOP_RECORDING_SCHEMA"
}

type StartRecordingSchemaEvent = {
  type: "START_RECORDING_SCHEMA"
  trackId: string
  time: number
}

type TimelineEvent =
  | ZoomEvent
  | SetTimeRangesEvent
  | SetLayoutModeEvent
  | SetMontageSchemaEvent
  | SetCurrentTimeEvent
  | SetPlayingEvent
  | SetRecordingEvent
  | SetActiveVideoEvent
  | SetVideosEvent
  | PlayEvent
  | PauseEvent
  | SeekEvent
  | SetDurationEvent
  | SetActiveTrackEvent
  | SetVolumeEvent
  | SetTrackVolumeEvent
  | SetSeekingEvent
  | ResetChangingCameraEvent
  | AddTrackEvent
  | UndoEvent
  | RedoEvent
  | SetLayoutEvent
  | SetTracksEvent
  | RemoveFromAddedFilesEvent
  | StopRecordingSchemaEvent
  | StartRecordingSchemaEvent
  | { type: "SET_VIDEO"; video: MediaFile | null }

export const timelineMachine = createMachine({
  id: "timeline",
  initial: "idle",
  context: {
    zoomLevel: 1,
    timeRanges: {},
    montageSchema: [],
    isDirty: false,
    currentTime: 0,
    isPlaying: false,
    isRecordingSchema: false,
    activeVideoId: null,
    videos: {},
    duration: 0,
    activeTrackId: null,
    volume: 1,
    trackVolumes: {},
    isSeeking: false,
    isChangingCamera: false,
    videoRefs: {},
    tracks: [],
    history: [],
    historyIndex: -1,
    currentLayout: "default",
    activeVideo: null,
  } as TimelineContext,
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  states: {
    idle: {
      on: {
        ZOOM: {
          actions: assign(({ context }, { zoomLevel }) => ({
            zoomLevel,
            history: [...context.history, { ...context }],
            historyIndex: context.historyIndex + 1,
          })),
        },
        SET_TIME_RANGES: {
          actions: assign({
            timeRanges: ({ event }) => (event as SetTimeRangesEvent).ranges,
            isDirty: true,
          }),
        },
        SET_MONTAGE_SCHEMA: {
          actions: assign({
            montageSchema: ({ event }) => (event as SetMontageSchemaEvent).schema,
            isDirty: true,
          }),
        },
        SET_CURRENT_TIME: {
          actions: assign({
            currentTime: ({ event }) => (event as SetCurrentTimeEvent).time,
          }),
        },
        SET_PLAYING: {
          actions: assign({
            isPlaying: ({ event }) => (event as SetPlayingEvent).playing,
          }),
        },
        SET_RECORDING: {
          actions: assign({
            isRecordingSchema: ({ event }) => (event as SetRecordingEvent).recording,
          }),
        },
        SET_ACTIVE_VIDEO: {
          actions: assign({
            activeVideoId: ({ event }) => (event as SetActiveVideoEvent).videoId,
          }),
        },
        SET_VIDEOS: {
          actions: assign({
            videos: ({ event }) => (event as SetVideosEvent).videos,
          }),
        },
        SET_VOLUME: {
          actions: assign({
            volume: ({ event }) => (event as SetVolumeEvent).volume,
          }),
        },
        SET_TRACK_VOLUME: {
          actions: assign({
            trackVolumes: ({ context, event }) => ({
              ...context.trackVolumes,
              [(event as SetTrackVolumeEvent).trackId]: (event as SetTrackVolumeEvent).volume,
            }),
          }),
        },
        SET_SEEKING: {
          actions: assign({
            isSeeking: ({ event }) => (event as SetSeekingEvent).isSeeking,
          }),
        },
        RESET_CHANGING_CAMERA: {
          actions: assign({
            isChangingCamera: false,
          }),
        },
        PLAY: {
          actions: assign({
            isPlaying: true,
          }),
        },
        PAUSE: {
          actions: assign({
            isPlaying: false,
          }),
        },
        SET_DURATION: {
          actions: assign({
            duration: ({ event }) => (event as SetDurationEvent).duration,
          }),
        },
        SET_ACTIVE_TRACK: {
          actions: assign({
            activeTrackId: ({ event }) => (event as SetActiveTrackEvent).trackId,
          }),
        },
        ADD_TRACK: {
          actions: assign(({ context }, { track }) => ({
            tracks: [...context.tracks, track],
            history: [...context.history, { ...context }],
            historyIndex: context.historyIndex + 1,
          })),
        },
        UNDO: {
          actions: assign(({ context }) => {
            if (context.historyIndex > 0) {
              const newIndex = context.historyIndex - 1
              return {
                ...context.history[newIndex],
                historyIndex: newIndex,
              }
            }
            return {}
          }),
        },
        REDO: {
          actions: assign(({ context }) => {
            if (context.historyIndex < context.history.length - 1) {
              const newIndex = context.historyIndex + 1
              return {
                ...context.history[newIndex],
                historyIndex: newIndex,
              }
            }
            return {}
          }),
        },
        SET_LAYOUT: {
          actions: assign({
            currentLayout: ({ event }) => (event as SetLayoutEvent).layout,
            isDirty: true,
          }),
        },
        SET_TRACKS: {
          actions: assign({
            tracks: ({ event }) => (event as SetTracksEvent).tracks,
            isDirty: true,
          }),
        },
        REMOVE_FROM_ADDED_FILES: {
          actions: assign({
            tracks: ({ context, event }) =>
              context.tracks.filter(
                (track) => track.id !== (event as RemoveFromAddedFilesEvent).fileId,
              ),
          }),
        },
        STOP_RECORDING_SCHEMA: {
          actions: assign({
            isRecordingSchema: false,
          }),
        },
        START_RECORDING_SCHEMA: {
          actions: assign({
            isRecordingSchema: true,
            activeTrackId: ({ event }) => (event as StartRecordingSchemaEvent).trackId,
            currentTime: ({ event }) => (event as StartRecordingSchemaEvent).time,
          }),
        },
        SET_VIDEO: {
          actions: assign(({ context }, { video }) => ({
            activeVideo: video,
            history: [...context.history, { ...context }],
            historyIndex: context.historyIndex + 1,
          })),
        },
      },
    },
  },
  entry: assign(({ context }) => {
    if (context.isDirty) {
      const newHistory = context.history.slice(0, context.historyIndex + 1)
      newHistory.push({ ...context })
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: false,
      }
    }
    return {}
  }),
})
