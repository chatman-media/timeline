import { useActorRef, useSelector } from "@xstate/react"
import React, { createContext, ReactNode, useContext } from "react"

import { Sector } from "@/media-editor/browser"
import { VideoEffect } from "@/media-editor/browser/components/tabs/effects/effects"
import { VideoFilter } from "@/media-editor/browser/components/tabs/filters/filters"
import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import {
  type TimelineContext,
  timelineMachine,
} from "@/media-editor/timeline/services/timeline-machine"
import { Track } from "@/types/media"
import { MediaFile } from "@/types/media"
import { TimelineResource } from "@/types/resources"
import { TimeRange } from "@/types/time-range"
import { TransitionEffect } from "@/types/transitions"

interface TimelineContextType {
  isDirty: boolean
  zoomLevel: number
  timeRanges: Record<string, TimeRange[]>
  sectors: Sector[]
  activeTrackId: string | null
  trackVolumes: Record<string, number>
  isSeeking: boolean
  isChangingCamera: boolean
  tracks: Track[]
  canUndo: boolean
  canRedo: boolean
  videoRefs: Record<string, HTMLVideoElement | null>
  loadedVideos: Record<string, boolean>
  previousStates: TimelineContext[]
  currentStateIndex: number

  // Ресурсы
  resources: TimelineResource[] // Все добавленные ресурсы
  effectResources: TimelineResource[] // Эффекты
  filterResources: TimelineResource[] // Фильтры
  transitionResources: TimelineResource[] // Переходы
  templateResources: TimelineResource[] // Шаблоны
  musicResources: TimelineResource[] // Музыкальные файлы

  zoom: (level: number) => void
  fitToScreen: (containerWidth: number) => void
  undo: () => void
  redo: () => void
  setTracks: (tracks: Track[]) => void
  setActiveTrack: (id: string) => void
  seek: (time: number) => void
  removeFiles: (fileIds: string[]) => void
  addMediaFiles: (files: MediaFile[]) => void
  setPlaying: (playing: boolean) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setSeeking: (isSeeking: boolean) => void
  setTimeRanges: (timeRanges: Record<string, TimeRange[]>) => void
  setVideoRef: (fileId: string, video: HTMLVideoElement | null) => void
  setLoadedVideo: (fileId: string, loaded: boolean) => void
  preloadAllVideos: () => void
  setIsChangingCamera: (isChangingCamera: boolean) => void

  // Методы для работы с ресурсами
  addEffect: (effect: VideoEffect) => void
  addFilter: (filter: VideoFilter) => void
  addTransition: (transition: TransitionEffect) => void
  addTemplate: (template: MediaTemplate) => void
  addMusic: (file: MediaFile) => void
  removeResource: (resourceId: string) => void
  updateResource: (resourceId: string, params: Record<string, any>) => void

  // Методы для проверки наличия ресурса в хранилище
  isEffectAdded: (effect: VideoEffect) => boolean
  isFilterAdded: (filter: VideoFilter) => boolean
  isTransitionAdded: (transition: TransitionEffect) => boolean
  isTemplateAdded: (template: MediaTemplate) => boolean
  isMusicFileAdded: (file: MediaFile) => boolean
}

interface TimelineProviderProps {
  children: ReactNode
}

const TimelineContext = createContext<TimelineContextType | null>(null)

export function useTimeline(): TimelineContextType {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }
  return context
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const timelineActor = useActorRef(timelineMachine)
  const state = useSelector(timelineActor, (state) => state.context)
  const send = timelineActor.send

  const handleZoom = React.useCallback(
    (level: number) => {
      send({ type: "ZOOM", level })
    },
    [send],
  )

  const handleUndo = React.useCallback(() => {
    send({ type: "UNDO" })
  }, [send])

  const handleRedo = React.useCallback(() => {
    send({ type: "REDO" })
  }, [send])

  const setActiveTrack = React.useCallback(
    (trackId: string) => {
      send({ type: "SET_ACTIVE_TRACK", trackId })
    },
    [send],
  )

  const handleSetTracks = React.useCallback(
    (tracks: Track[]) => {
      send({ type: "SET_TRACKS", tracks })
    },
    [send],
  )

  const handleSeek = React.useCallback(
    (time: number) => {
      send({ type: "SEEK", time })
    },
    [send],
  )

  const handleRemoveFromAddedFiles = React.useCallback(
    (fileIds: string[]) => {
      fileIds.forEach((fileId) => {
        send({ type: "REMOVE_MEDIA_FILE", fileId })
      })
    },
    [send],
  )

  const handleAddMediaFiles = React.useCallback(
    (files: MediaFile[]) => {
      send({ type: "ADD_MEDIA_FILES", files })
    },
    [send],
  )

  const handleSetPlaying = React.useCallback(
    (playing: boolean) => {
      send({ type: playing ? "PLAY" : "PAUSE" })
    },
    [send],
  )

  const handleSetTrackVolume = React.useCallback(
    (trackId: string, volume: number) => {
      send({ type: "SET_TRACK_VOLUME", trackId, volume })
    },
    [send],
  )

  const handleSetSeeking = React.useCallback(
    (isSeeking: boolean) => {
      send({ type: "SET_SEEKING", isSeeking })
    },
    [send],
  )

  const handleSetTimeRanges = React.useCallback(
    (timeRanges: Record<string, TimeRange[]>) => {
      send({ type: "SET_TIME_RANGES", ranges: timeRanges })
    },
    [send],
  )

  const handleSetVideoRef = React.useCallback(
    (fileId: string, video: HTMLVideoElement | null) => {
      send({ type: "SET_VIDEO_REF", fileId, video })
    },
    [send],
  )

  const handleSetLoadedVideo = React.useCallback(
    (fileId: string, loaded: boolean) => {
      send({ type: "SET_LOADED_VIDEO", fileId, loaded })
    },
    [send],
  )

  const handlePreloadAllVideos = React.useCallback(() => {
    send({ type: "PRELOAD_ALL_VIDEOS" })
  }, [send])

  const handleFitToScreen = React.useCallback(
    (containerWidth: number) => {
      send({ type: "FIT_TO_SCREEN", containerWidth })
    },
    [send],
  )

  const handleSetIsChangingCamera = React.useCallback(
    (isChangingCamera: boolean) => {
      send({ type: "SET_CHANGING_CAMERA", isChangingCamera })
    },
    [send],
  )

  // Методы для работы с ресурсами
  const handleAddEffect = React.useCallback(
    (effect: VideoEffect) => {
      send({ type: "ADD_EFFECT", effect })
    },
    [send],
  )

  const handleAddFilter = React.useCallback(
    (filter: VideoFilter) => {
      send({ type: "ADD_FILTER", filter })
    },
    [send],
  )

  const handleAddTransition = React.useCallback(
    (transition: TransitionEffect) => {
      console.log("Adding transition:", transition)
      send({ type: "ADD_TRANSITION", transition })
    },
    [send],
  )

  const handleAddTemplate = React.useCallback(
    (template: MediaTemplate) => {
      send({ type: "ADD_TEMPLATE", template })
    },
    [send],
  )

  const handleAddMusic = React.useCallback(
    (file: MediaFile) => {
      console.log("Adding music file to resources:", file.name)
      send({ type: "ADD_MUSIC", file })
    },
    [send],
  )

  const handleRemoveResource = React.useCallback(
    (resourceId: string) => {
      send({ type: "REMOVE_RESOURCE", resourceId })
    },
    [send],
  )

  const handleUpdateResource = React.useCallback(
    (resourceId: string, params: Record<string, any>) => {
      send({ type: "UPDATE_RESOURCE", resourceId, params })
    },
    [send],
  )

  // Методы для проверки наличия ресурса в хранилище
  // Создаем кэш для результатов проверки эффектов
  const effectAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении effectResources
  React.useEffect(() => {
    effectAddedCache.current = {}
  }, [state.effectResources])

  const isEffectAdded = React.useCallback(
    (effect: VideoEffect) => {
      // Проверяем, есть ли результат в кэше
      if (effectAddedCache.current[effect.id] !== undefined) {
        return effectAddedCache.current[effect.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = state.effectResources.some((resource) => resource.resourceId === effect.id)

      // Сохраняем результат в кэше
      effectAddedCache.current[effect.id] = isAdded

      return isAdded
    },
    [state.effectResources],
  )

  // Создаем кэш для результатов проверки фильтров
  const filterAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении filterResources
  React.useEffect(() => {
    filterAddedCache.current = {}
  }, [state.filterResources])

  const isFilterAdded = React.useCallback(
    (filter: VideoFilter) => {
      // Проверяем, есть ли результат в кэше
      if (filterAddedCache.current[filter.id] !== undefined) {
        return filterAddedCache.current[filter.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = state.filterResources.some((resource) => resource.resourceId === filter.id)

      // Сохраняем результат в кэше
      filterAddedCache.current[filter.id] = isAdded

      return isAdded
    },
    [state.filterResources],
  )

  // Создаем кэш для результатов проверки переходов
  const transitionAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении transitionResources
  React.useEffect(() => {
    transitionAddedCache.current = {}
  }, [state.transitionResources])

  const isTransitionAdded = React.useCallback(
    (transition: TransitionEffect) => {
      // Проверяем, есть ли результат в кэше
      const cacheKey = transition.id || transition.type
      if (transitionAddedCache.current[cacheKey] !== undefined) {
        return transitionAddedCache.current[cacheKey]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = state.transitionResources.some((resource) => {
        return resource.resourceId === transition.id || resource.resourceId === transition.type
      })

      // Сохраняем результат в кэше
      transitionAddedCache.current[cacheKey] = isAdded

      // Логируем только при первой проверке для каждого перехода
      // console.log("Checking if transition is added:", transition)
      // console.log("Current transitionResources:", state.transitionResources)
      // console.log("Transition isAdded result:", isAdded)

      return isAdded
    },
    [state.transitionResources],
  )

  // Создаем кэш для результатов проверки шаблонов
  const templateAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении templateResources
  React.useEffect(() => {
    templateAddedCache.current = {}
  }, [state.templateResources])

  const isTemplateAdded = React.useCallback(
    (template: MediaTemplate) => {
      // Проверяем, есть ли результат в кэше
      if (templateAddedCache.current[template.id] !== undefined) {
        return templateAddedCache.current[template.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = state.templateResources.some(
        (resource) => resource.resourceId === template.id,
      )

      // Сохраняем результат в кэше
      templateAddedCache.current[template.id] = isAdded

      return isAdded
    },
    [state.templateResources],
  )

  // Создаем кэш для результатов проверки музыкальных файлов
  const musicFileAddedCache = React.useRef<Record<string, boolean>>({})

  // Сбрасываем кэш при изменении musicResources
  React.useEffect(() => {
    musicFileAddedCache.current = {}
  }, [state.musicResources])

  const isMusicFileAdded = React.useCallback(
    (file: MediaFile) => {
      // Проверяем, есть ли результат в кэше
      if (musicFileAddedCache.current[file.id] !== undefined) {
        return musicFileAddedCache.current[file.id]
      }

      // Если результата нет в кэше, вычисляем его
      const isAdded = state.musicResources.some(
        (resource) => resource.type === "music" && resource.resourceId === file.id,
      )

      // Сохраняем результат в кэше
      musicFileAddedCache.current[file.id] = isAdded

      // Логируем только при первой проверке для каждого файла
      // console.log("Checking if music file is added:", file.name, file.id)
      // console.log("Current music resources:", state.musicResources)
      // console.log("Music file isAdded result:", isAdded)

      return isAdded
    },
    [state.musicResources],
  )

  const value: TimelineContextType = {
    ...state,
    zoom: handleZoom,
    fitToScreen: handleFitToScreen,
    undo: handleUndo,
    redo: handleRedo,
    setTracks: handleSetTracks,
    setActiveTrack,
    seek: handleSeek,
    removeFiles: handleRemoveFromAddedFiles,
    addMediaFiles: handleAddMediaFiles,
    setPlaying: handleSetPlaying,
    setTrackVolume: handleSetTrackVolume,
    setSeeking: handleSetSeeking,
    setTimeRanges: handleSetTimeRanges,
    setVideoRef: handleSetVideoRef,
    setLoadedVideo: handleSetLoadedVideo,
    preloadAllVideos: handlePreloadAllVideos,
    setIsChangingCamera: handleSetIsChangingCamera,

    // Методы для работы с ресурсами
    addEffect: handleAddEffect,
    addFilter: handleAddFilter,
    addTransition: handleAddTransition,
    addTemplate: handleAddTemplate,
    addMusic: handleAddMusic,
    removeResource: handleRemoveResource,
    updateResource: handleUpdateResource,

    // Методы для проверки наличия ресурса в хранилище
    isEffectAdded,
    isFilterAdded,
    isTransitionAdded,
    isTemplateAdded,
    isMusicFileAdded,
  }

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}
