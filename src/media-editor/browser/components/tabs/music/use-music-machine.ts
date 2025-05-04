import { useMachine } from "@xstate/react"

import { musicMachine } from "./music-machine"

export function useMusicMachine() {
  const [state, send] = useMachine(musicMachine)

  const {
    musicFiles,
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    error,
  } = state.context

  const isPlaying = state.matches("playing")
  const isLoading = state.matches("loading")
  const isError = state.matches("error")

  const search = (query: string) => {
    send({ type: "SEARCH", query })
  }

  const sort = (sortBy: string) => {
    send({ type: "SORT", sortBy })
  }

  const filter = (filterType: string) => {
    send({ type: "FILTER", filterType })
  }

  const changeOrder = () => {
    send({ type: "CHANGE_ORDER" })
  }

  const changeViewMode = (mode: "list" | "thumbnails") => {
    send({ type: "CHANGE_VIEW_MODE", mode })
  }

  const changeGroupBy = (groupBy: "none" | "artist" | "genre" | "album") => {
    send({ type: "CHANGE_GROUP_BY", groupBy })
  }

  const retry = () => {
    send({ type: "RETRY" })
  }

  return {
    // Состояния
    musicFiles,
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    error,
    isPlaying,
    isLoading,
    isError,

    // Методы
    search,
    sort,
    filter,
    changeOrder,
    changeViewMode,
    changeGroupBy,
    retry,
  }
}
