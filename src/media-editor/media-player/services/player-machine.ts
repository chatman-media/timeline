import { assign, createMachine } from "xstate"

import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { MediaFile } from "@/types/media"
import { TimelineVideo } from "@/types/timeline"

import { AppliedTemplate } from "./template-service"

export interface PlayerContextType {
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

  videoRefs: Record<string, HTMLVideoElement>
  videos: Record<string, TimelineVideo>

  // Поля для поддержки параллельных видео
  parallelVideos: MediaFile[] // Список всех параллельных видео, которые должны воспроизводиться одновременно
  activeVideoId: string | null // ID активного видео, которое отображается

  // Поля для поддержки шаблонов
  appliedTemplate: AppliedTemplate | null // Примененный шаблон
}

const initialContext: PlayerContextType = {
  video: null,
  currentTime: 0,
  isPlaying: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isVideoLoading: false,
  isVideoReady: false,
  videoRefs: {},
  videos: {},
  duration: 0,
  volume: 1,
  parallelVideos: [],
  activeVideoId: null,
  appliedTemplate: null,
}

type SetCurrentTimeEvent = {
  type: "setCurrentTime"
  currentTime: number
}

type SetIsPlayingEvent = {
  type: "setIsPlaying"
  isPlaying: boolean
}

type SetIsSeekingEvent = {
  type: "setIsSeeking"
  isSeeking: boolean
}

type SetIsChangingCameraEvent = {
  type: "setIsChangingCamera"
  isChangingCamera: boolean
}

type SetIsRecordingEvent = {
  type: "setIsRecording"
  isRecording: boolean
}

type SetVideoRefsEvent = {
  type: "setVideoRefs"
  videoRefs: Record<string, HTMLVideoElement>
}

type SetVideosEvent = {
  type: "setVideos"
  videos: Record<string, TimelineVideo>
}

type SetDurationEvent = {
  type: "setDuration"
  duration: number
}

type SetVolumeEvent = {
  type: "setVolume"
  volume: number
}

type SetVideoEvent = {
  type: "setVideo"
  video: MediaFile
}

type SetVideoLoadingEvent = {
  type: "setVideoLoading"
  isVideoLoading: boolean
}

type SetVideoReadyEvent = {
  type: "setVideoReady"
  isVideoReady: boolean
}

type SetParallelVideosEvent = {
  type: "setParallelVideos"
  parallelVideos: MediaFile[]
}

type SetActiveVideoIdEvent = {
  type: "setActiveVideoId"
  activeVideoId: string | null
}

type SetAppliedTemplateEvent = {
  type: "setAppliedTemplate"
  appliedTemplate: AppliedTemplate | null
}

export type PlayerEvent =
  | SetCurrentTimeEvent
  | SetIsPlayingEvent
  | SetIsSeekingEvent
  | SetIsChangingCameraEvent
  | SetIsRecordingEvent
  | SetVideoRefsEvent
  | SetVideosEvent
  | SetDurationEvent
  | SetVolumeEvent
  | SetVideoEvent
  | SetVideoLoadingEvent
  | SetVideoReadyEvent
  | SetParallelVideosEvent
  | SetActiveVideoIdEvent
  | SetAppliedTemplateEvent

// Функция для сохранения состояния плеера в IndexedDB - временно отключена
const persistPlayerState = async (_: { context: PlayerContextType }): Promise<void> => {
  // Временно отключаем сохранение состояния плеера
  console.log("Player state persistence is temporarily disabled")

  // Закомментированный код сохранения состояния
  /*
  try {
    // Импортируем set из idb-keyval динамически, чтобы избежать проблем с SSR
    const { set } = await import('idb-keyval');

    // Создаем копию контекста для сохранения, исключая videoRefs, которые нельзя сериализовать
    const stateToSave = {
      ...context,
      // Исключаем videoRefs, так как они содержат DOM-элементы, которые нельзя сериализовать
      videoRefs: {}
    };

    // Сохраняем состояние в IndexedDB
    await set('player-state', stateToSave);
    console.log("Player state saved to IndexedDB");
  } catch (error) {
    console.error("Failed to save player state to IndexedDB:", error);
  }
  */
}

export const playerMachine = createMachine({
  id: "player",
  initial: "idle",
  context: initialContext,
  // entry: [persistPlayerState],
  states: {
    idle: {
      on: {
        setVideo: {
          target: "loading",
          actions: [
            assign({ video: ({ event }) => event.video }),
            assign({ isVideoLoading: true }),
            assign({ isVideoReady: false }),
            // Отключаем сохранение состояния при изменении видео
            // ({ context }) => persistPlayerState({ context }),
          ],
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setVideoRefs: {
          actions: assign({ videoRefs: ({ event }) => event.videoRefs }),
        },
        setVideos: {
          actions: assign({ videos: ({ event }) => event.videos }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setParallelVideos: {
          actions: assign({ parallelVideos: ({ event }) => event.parallelVideos }),
        },
        setActiveVideoId: {
          actions: assign({ activeVideoId: ({ event }) => event.activeVideoId }),
        },
        setAppliedTemplate: {
          actions: assign({ appliedTemplate: ({ event }) => event.appliedTemplate }),
        },
      },
    },
    loading: {
      on: {
        setVideoReady: {
          target: "ready",
          actions: [
            assign({ isVideoReady: true, isVideoLoading: false }),
            // Отключаем сохранение состояния при изменении готовности видео
            // ({ context }) => persistPlayerState({ context }),
          ],
        },
        setVideoLoading: {
          actions: assign({
            isVideoLoading: ({ event }) => event.isVideoLoading,
          }),
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setVideoRefs: {
          actions: assign({ videoRefs: ({ event }) => event.videoRefs }),
        },
        setVideos: {
          actions: assign({ videos: ({ event }) => event.videos }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setParallelVideos: {
          actions: assign({ parallelVideos: ({ event }) => event.parallelVideos }),
        },
        setActiveVideoId: {
          actions: assign({ activeVideoId: ({ event }) => event.activeVideoId }),
        },
        setAppliedTemplate: {
          actions: assign({ appliedTemplate: ({ event }) => event.appliedTemplate }),
        },
      },
    },
    ready: {
      on: {
        setVideo: {
          target: "loading",
          actions: [
            assign({ video: ({ event }) => event.video }),
            assign({ isVideoLoading: true }),
            assign({ isVideoReady: false }),
            // Отключаем сохранение состояния при изменении видео
            // ({ context }) => persistPlayerState({ context }),
          ],
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setCurrentTime: {
          // Не вызываем persistPlayerState при обновлении currentTime для повышения производительности
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setVideoRefs: {
          actions: assign({ videoRefs: ({ event }) => event.videoRefs }),
        },
        setVideos: {
          actions: assign({ videos: ({ event }) => event.videos }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setParallelVideos: {
          actions: assign({ parallelVideos: ({ event }) => event.parallelVideos }),
        },
        setActiveVideoId: {
          actions: assign({ activeVideoId: ({ event }) => event.activeVideoId }),
        },
        setAppliedTemplate: {
          actions: assign({ appliedTemplate: ({ event }) => event.appliedTemplate }),
        },
      },
    },
  },
})
