import { assign, createMachine } from "xstate"

import { MediaFile, Track } from "@/types/videos"

interface SelectionContext {
  selectedFile?: MediaFile
  selectedTrack?: Track
  selectedSection?: {
    date: string
    startTime: number
    endTime: number
    duration: number
    tracks: Track[]
  }
}

type SelectFileEvent = {
  type: "SELECT_FILE"
  file: MediaFile
}

type SelectTrackEvent = {
  type: "SELECT_TRACK"
  track: Track
}

type SelectSectionEvent = {
  type: "SELECT_SECTION"
  section: {
    date: string
    startTime: number
    endTime: number
    duration: number
    tracks: Track[]
  }
}

type ClearSelectionEvent = {
  type: "CLEAR_SELECTION"
}

type SelectionEvent = SelectFileEvent | SelectTrackEvent | SelectSectionEvent | ClearSelectionEvent

export const selectionMachine = createMachine({
  id: "selection",
  initial: "idle",
  context: {
    selectedFile: undefined,
    selectedTrack: undefined,
    selectedSection: undefined,
  } as SelectionContext,
  types: {
    context: {} as SelectionContext,
    events: {} as SelectionEvent,
  },
  states: {
    idle: {
      on: {
        SELECT_FILE: {
          actions: assign({
            selectedFile: ({ event }) => (event as SelectFileEvent).file,
          }),
        },
        SELECT_TRACK: {
          actions: assign({
            selectedTrack: ({ event }) => (event as SelectTrackEvent).track,
          }),
        },
        SELECT_SECTION: {
          actions: assign({
            selectedSection: ({ event }) => (event as SelectSectionEvent).section,
          }),
        },
        CLEAR_SELECTION: {
          actions: assign({
            selectedFile: undefined,
            selectedTrack: undefined,
            selectedSection: undefined,
          }),
        },
      },
    },
  },
})
