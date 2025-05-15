import { useMachine } from "@xstate/react"
import { createContext, useContext } from "react"

import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { MediaFile } from "@/types/media"
import { TimelineVideo } from "@/types/timeline"

import { playerMachine } from "."
import { AppliedTemplate } from "./template-service"

// Ключ для хранения состояния плеера в IndexedDB
const PLAYER_STORAGE_KEY = "player-state"

interface PlayerContextType {
  video: MediaFile | null
  currentTime: number
  duration: number
  volume: number

  isPlaying: boolean
  isSeeking: boolean
  isChangingCamera: boolean
  isRecording: boolean
  isVideoLoading: boolean
  isVideoReady: boolean
  isResizableMode: boolean // Флаг, указывающий, что шаблоны должны быть resizable

  videoRefs: Record<string, HTMLVideoElement>
  videos: Record<string, TimelineVideo>

  // Поля для поддержки параллельных видео
  parallelVideos: MediaFile[] // Список всех параллельных видео, которые должны воспроизводиться одновременно
  activeVideoId: string | null // ID активного видео, которое отображается

  // Поля для поддержки шаблонов
  appliedTemplate: AppliedTemplate | null // Примененный шаблон
  preferredSource: "media" | "timeline" // Предпочтительный источник видео (браузер или таймлайн)
  lastAppliedTemplate: AppliedTemplate | null // Последний примененный шаблон

  // Новые поля для хранения видео по источникам
  timelineVideos: MediaFile[] // Видео из таймлайна
  browserVideos: MediaFile[] // Видео из браузера

  // Информация о источнике каждого видео
  videoSources: Record<string, "media" | "timeline">

  setVideoRefs: (videoRefs: Record<string, HTMLVideoElement>) => void
  setVideo: (video: MediaFile) => void
  setVideos: (videos: Record<string, TimelineVideo>) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setCurrentTime: (currentTime: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsSeeking: (isSeeking: boolean) => void
  setIsChangingCamera: (isChangingCamera: boolean) => void
  setIsRecording: (isRecording: boolean) => void
  setVideoLoading: (isLoading: boolean) => void
  setVideoReady: (isReady: boolean) => void

  // Методы для управления параллельными видео
  setParallelVideos: (videos: MediaFile[]) => void
  setActiveVideoId: (videoId: string | null) => void

  // Методы для управления шаблонами
  setAppliedTemplate: (template: AppliedTemplate | null) => void
  setIsResizableMode: (isResizableMode: boolean) => void

  // Методы для управления предпочтительным источником видео
  setPreferredSource: (source: "media" | "timeline") => void

  // Метод для переключения источника видео с обновлением шаблона
  switchVideoSource: (
    tracks: any[],
    activeTrackId: string | null,
    parallelVideos: MediaFile[],
  ) => void

  // Методы для управления последним примененным шаблоном
  setLastAppliedTemplate: (template: AppliedTemplate | null) => void

  // Методы для работы с источниками видео
  updateTimelineVideos: (videos: MediaFile[]) => void
  updateBrowserVideos: (videos: MediaFile[]) => void
  updateVideoSources: (videoSources: Record<string, "media" | "timeline">) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

interface PlayerProviderProps {
  children: React.ReactNode
}

// Объявляем глобальный тип для window
declare global {
  interface Window {
    playerContext?: PlayerContextType
    videoElementCache?: Map<string, HTMLVideoElement>
  }
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  // Отключаем инспектор XState для предотвращения ошибок сериализации
  const [state, send] = useMachine(playerMachine)

  // // Временно отключаем загрузку и сохранение состояния плеера
  // useEffect(() => {
  //   // Очищаем существующие данные в localStorage и IndexedDB
  //   const clearPersistedState = async (): Promise<void> => {
  //     try {
  //       // Очищаем данные в localStorage
  //       localStorage.removeItem("player-state")
  //       console.log("Temporarily disabled player state persistence in localStorage")

  //       // Очищаем данные в IndexedDB
  //       await set(PLAYER_STORAGE_KEY, null)
  //       console.log("Temporarily disabled player state persistence in IndexedDB")
  //     } catch (error) {
  //       console.error("Failed to clear persisted player state:", error)
  //     }
  //   }

  //   // Очищаем сохраненное состояние
  //   clearPersistedState()

  //   // Создаем обработчик события сохранения состояния, который ничего не делает
  //   const handlePersistState = (): void => {
  //     console.log("Player state persistence is temporarily disabled")
  //   }

  //   // Добавляем обработчик события сохранения состояния
  //   window.addEventListener("persist-player-state", handlePersistState)

  //   return () => {
  //     // Удаляем обработчик события при размонтировании
  //     window.removeEventListener("persist-player-state", handlePersistState)
  //   }
  // }, [])

  const contextValue = {
    ...state.context,
    setCurrentTime: (currentTime: number) => send({ type: "setCurrentTime", currentTime }),
    setIsPlaying: (isPlaying: boolean) => send({ type: "setIsPlaying", isPlaying }),
    setIsSeeking: (isSeeking: boolean) => send({ type: "setIsSeeking", isSeeking }),
    setIsChangingCamera: (isChangingCamera: boolean) => {
      console.log(`[PlayerProvider] setIsChangingCamera: ${isChangingCamera}`)
      send({ type: "setIsChangingCamera", isChangingCamera })
    },
    setIsRecording: (isRecording: boolean) => send({ type: "setIsRecording", isRecording }),
    setVideoRefs: (videoRefs: Record<string, HTMLVideoElement>) =>
      send({ type: "setVideoRefs", videoRefs }),
    setVideo: (video: MediaFile) => send({ type: "setVideo", video }),
    setVideos: (videos: Record<string, TimelineVideo>) => send({ type: "setVideos", videos }),
    setDuration: (duration: number) => send({ type: "setDuration", duration }),
    setVolume: (volume: number) => send({ type: "setVolume", volume }),
    setVideoLoading: (isLoading: boolean) =>
      send({ type: "setVideoLoading", isVideoLoading: isLoading }),
    setVideoReady: (isReady: boolean) => send({ type: "setVideoReady", isVideoReady: isReady }),
    setParallelVideos: (parallelVideos: MediaFile[]) =>
      send({ type: "setParallelVideos", parallelVideos }),
    setActiveVideoId: (activeVideoId: string | null) =>
      send({ type: "setActiveVideoId", activeVideoId }),
    setAppliedTemplate: (appliedTemplate: AppliedTemplate | null) =>
      send({ type: "setAppliedTemplate", appliedTemplate }),
    setIsResizableMode: (isResizableMode: boolean) =>
      send({ type: "setIsResizableMode", isResizableMode }),
    setPreferredSource: (preferredSource: "media" | "timeline") => {
      console.log(`[PlayerProvider] setPreferredSource: ${preferredSource}`)
      send({ type: "setPreferredSource", preferredSource })
    },
    switchVideoSource: (
      tracks: any[],
      activeTrackId: string | null,
      parallelVideos: MediaFile[],
    ) => {
      console.log(
        `[PlayerProvider] switchVideoSource: tracks=${tracks.length}, activeTrackId=${activeTrackId}, parallelVideos=${parallelVideos.length}`,
      )

      // Если есть активный трек, выводим информацию о нем
      if (activeTrackId) {
        const activeTrack = tracks.find((track) => track.id === activeTrackId)
        console.log(
          `[PlayerProvider] Активный трек: ${activeTrackId}, видео: ${activeTrack?.videos?.length || 0}`,
        )
      }

      send({ type: "switchVideoSource", tracks, activeTrackId, parallelVideos })
    },
    setLastAppliedTemplate: (lastAppliedTemplate: AppliedTemplate | null) =>
      send({ type: "setLastAppliedTemplate", lastAppliedTemplate }),

    // Новые методы для работы с источниками видео
    updateTimelineVideos: (videos: MediaFile[]) => {
      console.log(`[PlayerProvider] updateTimelineVideos: ${videos.length} видео`)
      send({ type: "updateTimelineVideos", videos })
    },

    updateBrowserVideos: (videos: MediaFile[]) => {
      console.log(`[PlayerProvider] updateBrowserVideos: ${videos.length} видео`)
      send({ type: "updateBrowserVideos", videos })
    },

    updateVideoSources: (videoSources: Record<string, "media" | "timeline">) => {
      console.log(
        `[PlayerProvider] updateVideoSources: ${Object.keys(videoSources).length} источников`,
      )
      send({ type: "updateVideoSources", videoSources })
    },
  }

  // Сохраняем контекст плеера в глобальном объекте window
  // для доступа из других компонентов без использования React контекста
  if (typeof window !== "undefined") {
    window.playerContext = contextValue
  }

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>
}

export function usePlayerContext(): PlayerContextType {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider")
  }
  return context
}
