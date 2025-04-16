import { assign, createMachine } from "xstate"

import { MediaFile } from "@/types/media"

export interface MediaContext {
  allMediaFiles: MediaFile[]
  // files that are included in the project
  includedFiles: MediaFile[]
  includedFilePaths: string[]

  unavailableFiles: MediaFile[]
  isLoading: boolean
}

const initialMediaContext: MediaContext = {
  allMediaFiles: [],
  includedFiles: [],
  includedFilePaths: [],
  unavailableFiles: [],
  isLoading: false,
}

type SetLoadingEvent = {
  type: "setLoading"
  loading: boolean
}

type SetAllMediaFilesEvent = {
  type: "setAllMediaFiles"
  files: MediaFile[]
}

type AddMediaFilesEvent = {
  type: "addMediaFiles"
  files: MediaFile[]
}

type RemoveMediaFilesEvent = {
  type: "removeMediaFiles"
  files: MediaFile[]
}

type SetIncludedFilesEvent = {
  type: "setIncludedFiles"
  files: MediaFile[]
}

type IncludeFilesEvent = {
  type: "includeFiles"
  files: MediaFile[]
}

type UnincludeFilesEvent = {
  type: "unincludeFiles"
  files: MediaFile[]
}

type SetUnavailableFilesEvent = {
  type: "setUnavailableFiles"
  files: MediaFile[]
}

export type MediaEvent =
  | SetLoadingEvent
  | SetAllMediaFilesEvent
  | AddMediaFilesEvent
  | RemoveMediaFilesEvent
  | SetIncludedFilesEvent
  | IncludeFilesEvent
  | UnincludeFilesEvent
  | SetUnavailableFilesEvent

export const mediaMachine = createMachine({
  id: "media",
  initial: "idle",
  context: initialMediaContext,
  types: {
    context: {} as MediaContext,
    events: {} as MediaEvent,
  },
  states: {
    idle: {
      on: {
        setLoading: {
          actions: assign({
            isLoading: ({ event }) => event.loading,
          }),
        },
        setAllMediaFiles: {
          actions: assign({
            allMediaFiles: ({ event }) => event.files,
          }),
        },
        addMediaFiles: {
          actions: assign({
            allMediaFiles: ({ context, event: { files } }) => [...context.allMediaFiles, ...files],
          }),
        },
        removeMediaFiles: {
          actions: assign({
            allMediaFiles: ({ context, event: { files } }) =>
              context.allMediaFiles.filter((file) => !files.includes(file)),
          }),
        },
        setIncludedFiles: {
          actions: assign({
            includedFiles: ({ event }) => event.files,
          }),
        },
        includeFiles: {
          actions: assign({
            includedFiles: ({ context, event: { files } }) => [...context.includedFiles, ...files],
            includedFilePaths: ({ context, event: { files } }) => [
              ...context.includedFilePaths,
              ...files.map((file) => file.path),
            ],
          }),
        },
        unincludeFiles: {
          actions: ({ context, event: { files } }) => ({
            ...context,
            includedFiles: context.includedFiles.filter((file) => !files.includes(file)),
            includedFilePaths: context.includedFilePaths.filter(
              (path) => !files.some((file) => file.path === path),
            ),
          }),
        },
        setUnavailableFiles: {
          actions: ({ context, event: { files } }) => ({
            ...context,
            unavailableFiles: files,
          }),
        },
      },
    },
  },
})
