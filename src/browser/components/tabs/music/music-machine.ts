import { assign, createMachine, fromPromise } from "xstate"

import { MediaFile } from "@/types/media"

type MusicContext = {
  musicFiles: MediaFile[]
  filteredFiles: MediaFile[]
  searchQuery: string
  page: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  sortBy: string
  sortOrder: "asc" | "desc"
  filterType: string
  viewMode: "list" | "thumbnails"
}

type SearchEvent = {
  type: "SEARCH"
  query: string
}

type LoadMoreEvent = {
  type: "LOAD_MORE"
}

type SortEvent = {
  type: "SORT"
  sortBy: string
}

type FilterEvent = {
  type: "FILTER"
  filterType: string
}

type ChangeOrderEvent = {
  type: "CHANGE_ORDER"
}

type ChangeViewModeEvent = {
  type: "CHANGE_VIEW_MODE"
  mode: "list" | "thumbnails"
}

type RetryEvent = {
  type: "RETRY"
}

type MusicEvent =
  | SearchEvent
  | LoadMoreEvent
  | SortEvent
  | FilterEvent
  | ChangeOrderEvent
  | ChangeViewModeEvent
  | RetryEvent

type FetchInput = {
  page: number
  sortBy: string
  sortOrder: "asc" | "desc"
  filterType: string
}

type FetchOutput = {
  media: MediaFile[]
  total: number
}

const filterFiles = (files: MediaFile[], query: string) => {
  if (!query.trim()) return files
  return files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()))
}

const fetchMusicFiles = fromPromise<FetchInput, FetchOutput>(async ({ input }) => {
  const { page, sortBy, sortOrder, filterType } = input
  const response = await fetch(
    `/api/music?page=${page}&limit=20&sort=${sortBy}&order=${sortOrder}&filter=${filterType}`,
  )
  const data = await response.json()
  return data
})

export const musicMachine = createMachine({
  id: "music",
  initial: "loading",
  context: {
    musicFiles: [],
    filteredFiles: [],
    searchQuery: "",
    page: 1,
    hasMore: true,
    isLoading: true,
    isLoadingMore: false,
    sortBy: "name",
    sortOrder: "desc",
    filterType: "all",
    viewMode: "list",
  } as MusicContext,
  types: {
    context: {} as MusicContext,
    events: {} as MusicEvent,
  },
  states: {
    loading: {
      invoke: {
        id: "fetchFiles",
        src: fetchMusicFiles,
        input: ({ context }) => ({
          page: context.page,
          sortBy: context.sortBy,
          sortOrder: context.sortOrder,
          filterType: context.filterType,
        }),
        onDone: {
          target: "success",
          actions: assign(({ event, context }) => ({
            musicFiles: event.output.media,
            filteredFiles: filterFiles(event.output.media, context.searchQuery),
            hasMore: event.output.media.length > 0 && event.output.media.length === 20,
            isLoading: false,
          })),
        },
        onError: {
          target: "error",
          actions: assign({
            isLoading: false,
          }),
        },
      },
    },
    success: {
      on: {
        SEARCH: {
          target: "searching",
          actions: assign(({ event, context }) => ({
            searchQuery: event.query,
            filteredFiles: filterFiles(context.musicFiles, event.query),
          })),
        },
        LOAD_MORE: {
          target: "loadingMore",
        },
        SORT: {
          target: "loading",
          actions: assign(({ event }) => ({
            sortBy: event.sortBy,
            page: 1,
          })),
        },
        FILTER: {
          target: "loading",
          actions: assign(({ event }) => ({
            filterType: event.filterType,
            page: 1,
          })),
        },
        CHANGE_ORDER: {
          target: "loading",
          actions: assign(({ context }) => ({
            sortOrder: context.sortOrder === "asc" ? "desc" : ("asc" as "asc" | "desc"),
            page: 1,
          })),
        },
        CHANGE_VIEW_MODE: {
          actions: assign(({ event }) => ({
            viewMode: event.mode,
          })),
        },
      },
    },
    loadingMore: {
      invoke: {
        id: "fetchMoreFiles",
        src: fetchMusicFiles,
        input: ({ context }) => ({
          page: context.page + 1,
          sortBy: context.sortBy,
          sortOrder: context.sortOrder,
          filterType: context.filterType,
        }),
        onDone: {
          target: "success",
          actions: assign(({ context, event }) => {
            const newFiles = [...context.musicFiles, ...event.output.media]
            return {
              musicFiles: newFiles,
              filteredFiles: filterFiles(newFiles, context.searchQuery),
              hasMore: event.output.media.length > 0 && event.output.media.length === 20,
              isLoadingMore: false,
              page: context.page + 1,
            }
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            isLoadingMore: false,
          }),
        },
      },
    },
    searching: {
      on: {
        SEARCH: {
          target: "searching",
          actions: assign(({ event, context }) => ({
            searchQuery: event.query,
            filteredFiles: filterFiles(context.musicFiles, event.query),
          })),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "loading",
        },
      },
    },
  },
})
