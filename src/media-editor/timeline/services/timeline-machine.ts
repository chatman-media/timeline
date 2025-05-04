import { assign, createMachine } from "xstate"

import { createTracksFromFiles, Sector } from "@/media-editor/browser/utils/media-files"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimeRange } from "@/types/time-range"

export interface TimelineContext {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  sectors: Sector[]
  canUndo: boolean
  canRedo: boolean
  videoRefs: Record<string, HTMLVideoElement | null>
  loadedVideos: Record<string, boolean>
  previousStates: TimelineContext[]
  currentStateIndex: number
}

export type TimelineEvent =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "ZOOM"; level: number }
  | { type: "SET_TIME_RANGES"; ranges: Record<string, TimeRange[]> }
  | { type: "SET_ACTIVE_TRACK"; trackId: string | null }
  | { type: "SEEK"; time: number }
  | { type: "SET_TRACK_VOLUME"; trackId: string; volume: number }
  | { type: "SET_SEEKING"; isSeeking: boolean }
  | { type: "SET_CHANGING_CAMERA"; isChangingCamera: boolean }
  | { type: "ADD_MEDIA_FILES"; files: MediaFile[] }
  | { type: "REMOVE_MEDIA_FILE"; fileId: string }
  | { type: "SET_VIDEO_REF"; fileId: string; video: HTMLVideoElement | null }
  | { type: "SET_LOADED_VIDEO"; fileId: string; loaded: boolean }
  | { type: "PRELOAD_ALL_VIDEOS" }
  | { type: "SET_TRACKS"; tracks: Track[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "PERSIST_STATE" }
  | { type: "RESTORE_STATE"; state: Partial<TimelineContext> }

const initialContext: TimelineContext = {
  isDirty: false,
  zoomLevel: 1,
  timeRanges: {},
  activeTrackId: null,
  trackVolumes: {},
  isSeeking: false,
  isChangingCamera: false,
  tracks: [],
  sectors: [],
  canUndo: false,
  canRedo: false,
  videoRefs: {},
  loadedVideos: {},
  previousStates: [],
  currentStateIndex: -1,
}

const persistState = ({ context }: { context: TimelineContext }): void => {
  try {
    localStorage.setItem("timeline-state", JSON.stringify(context))
  } catch (error) {
    console.error("Failed to persist timeline state:", error)
  }
}

const addToHistory = ({
  context,
  newState,
}: {
  context: TimelineContext
  newState: Partial<TimelineContext>
}): TimelineContext => {
  const newStates = context.previousStates.slice(0, context.currentStateIndex + 1)
  return {
    ...context,
    ...newState,
    previousStates: [...newStates, { ...context, ...newState }],
    currentStateIndex: context.currentStateIndex + 1,
    canUndo: true,
    canRedo: false,
    isDirty: true,
  }
}

export const timelineMachine = createMachine({
  id: "timeline",
  initial: "idle",
  context: initialContext,
  types: {
    context: {} as TimelineContext,
    events: {} as TimelineEvent,
  },
  entry: [persistState],
  states: {
    idle: {
      on: {
        PLAY: "playing",
        RESTORE_STATE: {
          guard: ({ event }) => {
            return event.type === "RESTORE_STATE" && Object.keys(event.state).length > 0
          },
          actions: [
            assign(({ event }) => ({
              ...initialContext,
              ...(event.type === "RESTORE_STATE" ? event.state : {}),
            })),
            persistState,
          ],
        },
      },
    },
    playing: {
      on: {
        PAUSE: "paused",
        SEEK: {
          actions: assign({ isSeeking: true }),
        },
      },
    },
    paused: {
      on: {
        PLAY: "playing",
      },
    },
    loading: {
      on: {
        SET_LOADED_VIDEO: {
          target: "idle",
          actions: [
            assign({
              loadedVideos: ({ context, event }) => ({
                ...context.loadedVideos,
                [event.fileId]: event.loaded,
              }),
            }),
          ],
        },
      },
    },
  },
  on: {
    ZOOM: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ZOOM") return context
          return addToHistory({
            context,
            newState: { zoomLevel: event.level },
          })
        }),
      ],
    },
    SET_TIME_RANGES: {
      actions: [
        assign(({ context, event }) =>
          addToHistory({
            context,
            newState: { timeRanges: event.ranges },
          }),
        ),
      ],
    },
    SET_ACTIVE_TRACK: {
      actions: assign({
        activeTrackId: ({ event }) => event.trackId,
      }),
    },
    SET_TRACK_VOLUME: {
      actions: [
        assign(({ context, event }) => ({
          trackVolumes: {
            ...context.trackVolumes,
            [event.trackId]: event.volume,
          },
          isDirty: true,
        })),
      ],
    },
    SET_SEEKING: {
      actions: assign({
        isSeeking: ({ event }) => event.isSeeking,
      }),
    },
    SET_CHANGING_CAMERA: {
      actions: assign({
        isChangingCamera: ({ event }) => event.isChangingCamera,
      }),
    },
    ADD_MEDIA_FILES: {
      actions: [
        assign(({ context, event }) => {
          if (event.type !== "ADD_MEDIA_FILES") return context

          const newSectors = createTracksFromFiles(event.files, context.tracks)
          const updatedSectors = [...(context.sectors || []), ...newSectors].map((sector) => ({
            ...sector,
            tracks: sector.tracks.map((track) => ({
              ...track,
              id:
                track.id || event.files.find((f) => f.name === track.name)?.id || event.files[0].id,
            })),
          }))

          return addToHistory({
            context,
            newState: { sectors: updatedSectors },
          })
        }),
      ],
    },
    REMOVE_MEDIA_FILE: {
      actions: [
        assign(({ context, event }) => {
          const updatedSectors = context.sectors
            .map((sector) => ({
              ...sector,
              tracks: sector.tracks.filter((track) => track.id !== event.fileId),
            }))
            .filter((sector) => sector.tracks.length > 0)

          return addToHistory({
            context,
            newState: { sectors: updatedSectors },
          })
        }),
      ],
    },
    SET_VIDEO_REF: {
      actions: assign({
        videoRefs: ({ context, event }) => ({
          ...context.videoRefs,
          [event.fileId]: event.video,
        }),
      }),
    },
    PRELOAD_ALL_VIDEOS: {
      actions: assign({
        loadedVideos: ({ context }) => {
          const newLoadedVideos = { ...context.loadedVideos }
          Object.entries(context.videoRefs).forEach(([fileId, video]) => {
            if (video && !newLoadedVideos[fileId]) {
              newLoadedVideos[fileId] = true
            }
          })
          return newLoadedVideos
        },
      }),
    },
    SET_TRACKS: {
      actions: [
        assign(({ context, event }) =>
          addToHistory({
            context,
            newState: { tracks: event.tracks },
          }),
        ),
      ],
    },
    UNDO: {
      actions: [
        assign(({ context }) => {
          if (context.currentStateIndex < 0) return context

          const newIndex = context.currentStateIndex - 1
          const previousState = context.previousStates[newIndex]

          if (!previousState) {
            return {
              ...initialContext,
              previousStates: context.previousStates,
              currentStateIndex: -1,
              canUndo: false,
              canRedo: true,
            }
          }

          return {
            ...previousState,
            previousStates: context.previousStates,
            currentStateIndex: newIndex,
            canUndo: newIndex >= 0,
            canRedo: true,
          }
        }),
      ],
    },
    REDO: {
      actions: [
        assign(({ context }) => {
          if (context.currentStateIndex >= context.previousStates.length - 1) return context

          const newIndex = context.currentStateIndex + 1
          const nextState = context.previousStates[newIndex]

          if (!nextState) return context

          return {
            ...nextState,
            previousStates: context.previousStates,
            currentStateIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < context.previousStates.length - 1,
          }
        }),
      ],
    },
  },
})
