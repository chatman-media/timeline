import { assign, createMachine } from "xstate"

import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimeRange } from "@/types/time-range"
import { createTracksFromFiles } from "@/utils/media-utils"

interface TimelineContext {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  history: TimelineContext[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
}

type ZoomEvent = {
  type: "ZOOM"
  level: number
}

type SetTimeRangesEvent = {
  type: "setTimeRanges"
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
  type: "setTime"
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

type SeekEvent = {
  type: "SEEK"
  time: number
}

type SetDurationEvent = {
  type: "setDuration"
  duration: number
}

type SetActiveTrackEvent = {
  type: "setActiveTrack"
  trackId: string | null
}

type SetVolumeEvent = {
  type: "setVolume"
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

type addMediaFilesEvent = {
  type: "addMediaFiles"
  files: MediaFile[]
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
  | SetLayoutModeEvent
  | SetCurrentTimeEvent
  | SetPlayingEvent
  | SetRecordingEvent
  | SetActiveVideoEvent
  | SeekEvent
  | SetActiveTrackEvent
  | SetTrackVolumeEvent
  | SetSeekingEvent
  | ResetChangingCameraEvent
  | UndoEvent
  | RedoEvent
  | SetLayoutEvent
  | addMediaFilesEvent
  | RemoveFromAddedFilesEvent
  | StopRecordingSchemaEvent
  | StartRecordingSchemaEvent
  | SetTimeRangesEvent

export const timelineMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBcCWBbMAbVA7MAdKhFmAMQBaA8lQLIDaADALqKgAOA9rKmp7mxAAPRAEYATAA4C48QDYArHIDsjSZNUBmOXIA0IAJ6IAnMbkEFyyY1MAWeQsm3RAXxf60mHPiIlysMGQAFQwwACUAQ1wYWCZWJBAuHj4BBJEEMxllZU0FTWNJBSVbRgV9IwzGRgIJW2NsxmzRHUk3D1DvQmJSMgBlAFEggH0gsIBBAGEAaSGANSoAGQBVWn64wSTeVH5BdOVbAg1RUUZNcRzm201lcsRrTQIVUULbZXP9szaQT2w8Lr8+oMhgN+lMAJIAOQA4usEpsUrsxIxxAQ3opsgpxJpsQVRLcEKplDJnjksVZsVivj9Or4emF+gNhhMABJjaGQqFDCZjVbjWEcbhbHZpRB1AjInIlErKApnWx6QyIOQnVGKZVVKTGUQKKkdP60-yBMYAYzQADcwEEAE4RY0Aa35iUFCJFGWkJwU8ustmsCmMtjKioQClEB00tQ0Kn99WUuq8+u65CWEIAIlRHfDtqlQOkJNJZGrVOotDp8c4iYVjNo8poqt7bHHfj5E2R6WmM86s4iEHmZA4VGoNKdS0GzqICCU5OJ7AVGDpww33N89c2AREIBBaJBUBEAGKoUixFgbTvCnMmYyPOQlT2vOpyKqafGyA7GPISOfh6eOWNL6kJgF6VoKhZn6IZdzCOghjGFMU36FNwLBBYGQ7ZIu1dex8V7OpTAKKRnikSw3CXXBOAgOBBH-fATzQs9hEQABaBUKiYxsaUTGihWzeie3yVFsk0HCp2KacsJsaRTgkcRRGyB9GG1YiXCAA */
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
    canUndo: false,
    canRedo: false,
  } as TimelineContext,
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  states: {
    idle: {
      on: {
        ZOOM: {
          actions: assign(({ context, event }) => ({
            zoomLevel: (event as ZoomEvent).level,
          })),
        },
        setTimeRanges: {
          actions: assign({
            timeRanges: ({ event }) => (event as SetTimeRangesEvent).ranges,
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
        setActiveTrack: {
          actions: assign({
            activeTrackId: ({ event }) => (event as SetActiveTrackEvent).trackId,
          }),
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
        addMediaFiles: {
          actions: assign(({ context, event }) => {
            const newTracks = createTracksFromFiles(
              (event as addMediaFilesEvent).files,
              context.tracks.length,
              context.tracks,
            )
            return {
              tracks: [...context.tracks, ...newTracks],
              isDirty: true,
            }
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
