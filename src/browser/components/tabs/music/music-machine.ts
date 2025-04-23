import { assign, createMachine, fromPromise } from "xstate"

import { MediaFile } from "@/types/media"

interface MusicContext {
  musicFiles: MediaFile[]
  filteredFiles: MediaFile[]
  searchQuery: string
  sortBy: string
  sortOrder: "asc" | "desc"
  filterType: string
  viewMode: "list" | "thumbnails"
  availableExtensions: string[]
  error?: string
}

type SearchEvent = {
  type: "SEARCH"
  query: string
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
  | SortEvent
  | FilterEvent
  | ChangeOrderEvent
  | ChangeViewModeEvent
  | RetryEvent

type FetchInput = {
  // пустой тип, так как параметры не нужны
}

type FetchOutput = {
  media: MediaFile[]
}

const sortFiles = (files: MediaFile[], sortBy: string, sortOrder: "asc" | "desc") => {
  return [...files].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
    case "name":
      comparison = a.name.localeCompare(b.name)
      break
    case "duration":
      comparison = (a.probeData?.format.duration || 0) - (b.probeData?.format.duration || 0)
      break
    case "size":
      comparison = (a.probeData?.format.size || 0) - (b.probeData?.format.size || 0)
      break
    case "genre":
      const genreA = String(a.probeData?.format.tags?.genre || "")
      const genreB = String(b.probeData?.format.tags?.genre || "")
      comparison = genreA.localeCompare(genreB)
      break
    default:
      comparison = 0
    }

    return sortOrder === "asc" ? comparison : -comparison
  })
}

const filterFiles = (files: MediaFile[], searchQuery: string, filterType: string) => {
  let filtered = files
  console.log("Всего файлов:", files.length)

  // Фильтрация по типу файла
  if (filterType !== "all") {
    filtered = filtered.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase()
      return extension === filterType
    })
    console.log("После фильтрации по типу:", filtered.length)
  }

  // Фильтрация по поисковому запросу
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        String(file.probeData?.format.tags?.title || "")
          .toLowerCase()
          .includes(query) ||
        String(file.probeData?.format.tags?.artist || "")
          .toLowerCase()
          .includes(query) ||
        String(file.probeData?.format.tags?.genre || "")
          .toLowerCase()
          .includes(query),
    )
    console.log("После фильтрации по поиску:", filtered.length)
  }

  return filtered
}

const fetchMusicFiles = fromPromise<FetchOutput, FetchInput>(async () => {
  const response = await fetch(`/api/music`)
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
    sortBy: "name",
    sortOrder: "desc",
    filterType: "all",
    viewMode: "list",
    availableExtensions: [],
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
        input: () => ({}),
        onDone: {
          target: "success",
          actions: assign({
            musicFiles: ({ event }) => {
              console.log("Получено файлов из API:", event.output.media.length)
              return event.output.media
            },
            filteredFiles: ({ event, context }) => {
              const filtered = filterFiles(
                event.output.media,
                context.searchQuery,
                context.filterType,
              )
              console.log("Итоговое количество файлов:", filtered.length)
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
            availableExtensions: ({ event }) => {
              const extensions = new Set<string>()
              event.output.media.forEach((file: MediaFile) => {
                const extension = file.name.split(".").pop()?.toLowerCase()
                if (extension) {
                  extensions.add(extension)
                }
              })
              return Array.from(extensions).sort()
            },
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    success: {
      on: {
        SEARCH: {
          actions: assign({
            searchQuery: ({ event }) => event.query,
            filteredFiles: ({ context, event }) => {
              const filtered = filterFiles(context.musicFiles, event.query, context.filterType)
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },
        SORT: {
          actions: assign({
            sortBy: ({ event }) => event.sortBy,
            filteredFiles: ({ context, event }) => {
              return sortFiles(context.filteredFiles, event.sortBy, context.sortOrder)
            },
          }),
        },
        FILTER: {
          actions: assign({
            filterType: ({ event }) => event.filterType,
            filteredFiles: ({ context, event }) => {
              const filtered = filterFiles(
                context.musicFiles,
                context.searchQuery,
                event.filterType,
              )
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },
        CHANGE_ORDER: {
          actions: assign({
            sortOrder: ({ context }) => (context.sortOrder === "asc" ? "desc" : "asc"),
            filteredFiles: ({ context }) => {
              const newOrder = context.sortOrder === "asc" ? "desc" : "asc"
              return sortFiles(context.filteredFiles, context.sortBy, newOrder)
            },
          }),
        },
        CHANGE_VIEW_MODE: {
          actions: assign(({ event }) => ({
            viewMode: event.mode,
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
