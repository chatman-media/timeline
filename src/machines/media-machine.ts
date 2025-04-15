import { assign, createMachine } from "xstate"

import { MediaFile } from "@/types/videos"

export interface MediaContext {
  addedFiles: Set<string>
  filePaths: MediaFile[]
  isLoading: boolean
}

export type MediaEvent =
  | { type: "ADD_FILES"; files: MediaFile[] }
  | { type: "REMOVE_FILES"; files: MediaFile[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "RESET_MEDIA" }

export const mediaMachine = createMachine({
  id: "media-files",
  initial: "idle",
  context: {
    addedFiles: new Set<string>(),
    filePaths: [] as MediaFile[],
    isLoading: false,
  } as MediaContext,
  types: {
    context: {} as MediaContext,
    events: {} as MediaEvent,
  },
  states: {
    idle: {
      on: {
        ADD_FILES: {
          actions: assign({
            addedFiles: ({ context, event }) => {
              const newSet = new Set(context.addedFiles)
              event.files.forEach((file) => {
                if (file.path) {
                  newSet.add(file.path)
                }
              })
              return newSet
            },
            filePaths: ({ context, event }) => [...context.filePaths, ...event.files],
          }),
        },
        REMOVE_FILES: {
          actions: assign({
            addedFiles: ({ context, event }) => {
              const newSet = new Set(context.addedFiles)
              event.files.forEach((file) => {
                if (file.path) {
                  newSet.delete(file.path)
                }
              })
              return newSet
            },
            filePaths: ({ context, event }) =>
              context.filePaths.filter((file) => !event.files.some((f) => f.path === file.path)),
          }),
        },
        SET_LOADING: {
          actions: assign({
            isLoading: ({ event }) => event.loading,
          }),
        },
        RESET_MEDIA: {
          actions: assign({
            addedFiles: new Set<string>(),
            filePaths: [],
            isLoading: false,
          }),
        },
      },
    },
  },
})
