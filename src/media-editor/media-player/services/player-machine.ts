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
  isResizableMode: boolean // Флаг, указывающий, что шаблоны должны быть resizable

  videoRefs: Record<string, HTMLVideoElement>
  videos: Record<string, TimelineVideo>

  // Поля для поддержки параллельных видео
  parallelVideos: MediaFile[] // Список всех параллельных видео, которые должны воспроизводиться одновременно
  activeVideoId: string | null // ID активного видео, которое отображается

  // Поля для поддержки шаблонов
  appliedTemplate: AppliedTemplate | null // Примененный шаблон

  // Предпочтительный источник видео (браузер или таймлайн)
  preferredSource: "media" | "timeline"

  // Последний примененный шаблон
  lastAppliedTemplate: AppliedTemplate | null

  // Настройка для проигрывания видео при клике по превью
  // "preview" - проигрывать в превью (старое поведение)
  // "player" - проигрывать в медиа плеере (новое поведение)
  previewClickBehavior: "preview" | "player"
}

// Загружаем сохраненный уровень звука из localStorage
const getSavedVolume = (): number => {
  if (typeof window !== "undefined") {
    const savedVolume = localStorage.getItem("player-volume")
    if (savedVolume !== null) {
      const volume = parseFloat(savedVolume)
      if (!isNaN(volume) && volume >= 0 && volume <= 1) {
        console.log(`[PlayerMachine] Загружен сохраненный уровень звука: ${volume}`)
        return volume
      }
    }
  }
  return 1 // Значение по умолчанию
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
  isResizableMode: true, // По умолчанию включен режим resizable
  videoRefs: {},
  videos: {},
  duration: 0,
  volume: getSavedVolume(),
  parallelVideos: [],
  activeVideoId: null,
  appliedTemplate: null,
  preferredSource: "timeline", // По умолчанию используем таймлайн как источник
  lastAppliedTemplate: null,
  previewClickBehavior: "player", // По умолчанию проигрываем в медиа плеере (новое поведение)
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

type SetIsResizableModeEvent = {
  type: "setIsResizableMode"
  isResizableMode: boolean
}

type SetPreferredSourceEvent = {
  type: "setPreferredSource"
  preferredSource: "media" | "timeline"
}

type SetLastAppliedTemplateEvent = {
  type: "setLastAppliedTemplate"
  lastAppliedTemplate: AppliedTemplate | null
}

type SetPreviewClickBehaviorEvent = {
  type: "setPreviewClickBehavior"
  previewClickBehavior: "preview" | "player"
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
  | SetIsResizableModeEvent
  | SetPreferredSourceEvent
  | SetLastAppliedTemplateEvent
  | SetPreviewClickBehaviorEvent

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
            // Устанавливаем флаг isVideoReady в true для видео из таймлайна
            assign({
              isVideoReady: ({ event }) => {
                // Если видео из таймлайна (имеет startTime), сразу устанавливаем флаг готовности
                if (event.video?.startTime && event.video.startTime > 0) {
                  console.log(
                    `[PlayerMachine] Видео ${event.video?.id} из таймлайна (startTime=${event.video.startTime}), устанавливаем флаг готовности`,
                  )
                  return true
                }
                // Иначе сохраняем текущее значение
                return false
              },
            }),
            // Добавляем логирование
            ({ event }) => {
              console.log(
                `[PlayerMachine] Установлено видео: ${event.video?.id}, path=${event.video?.path}, source=${event.video?.source}`,
              )
            },
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
          actions: [
            // Обновляем значение громкости в контексте плеера
            assign({ volume: ({ event }) => event.volume }),
            // Сохраняем уровень звука в localStorage
            ({ event }) => {
              if (typeof window !== "undefined") {
                localStorage.setItem("player-volume", event.volume.toString())
                console.log(`[PlayerMachine] Сохранен уровень звука: ${event.volume}`)
              }
            },
          ],
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
        setIsResizableMode: {
          actions: assign({ isResizableMode: ({ event }) => event.isResizableMode }),
        },
        setPreferredSource: {
          actions: assign({ preferredSource: ({ event }) => event.preferredSource }),
        },
        setLastAppliedTemplate: {
          actions: assign({ lastAppliedTemplate: ({ event }) => event.lastAppliedTemplate }),
        },
        setPreviewClickBehavior: {
          actions: assign({ previewClickBehavior: ({ event }) => event.previewClickBehavior }),
        },
      },
    },
    loading: {
      on: {
        setVideoReady: {
          target: "ready",
          actions: [
            assign({ isVideoReady: true, isVideoLoading: false }),
            // Добавляем логирование
            ({ context }) => {
              console.log(`[PlayerMachine] Видео ${context.video?.id} готово к воспроизведению`)
            },
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
          actions: [
            // Обновляем значение громкости в контексте плеера
            assign({ volume: ({ event }) => event.volume }),
            // Сохраняем уровень звука в localStorage
            ({ event }) => {
              if (typeof window !== "undefined") {
                localStorage.setItem("player-volume", event.volume.toString())
                console.log(`[PlayerMachine] Сохранен уровень звука: ${event.volume}`)
              }
            },
          ],
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
        setIsResizableMode: {
          actions: assign({ isResizableMode: ({ event }) => event.isResizableMode }),
        },
        setPreferredSource: {
          actions: assign({ preferredSource: ({ event }) => event.preferredSource }),
        },
        setLastAppliedTemplate: {
          actions: assign({ lastAppliedTemplate: ({ event }) => event.lastAppliedTemplate }),
        },
        setPreviewClickBehavior: {
          actions: assign({ previewClickBehavior: ({ event }) => event.previewClickBehavior }),
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
            // Устанавливаем флаг isVideoReady в true для видео из таймлайна
            assign({
              isVideoReady: ({ event }) => {
                // Если видео из таймлайна (имеет startTime), сразу устанавливаем флаг готовности
                if (event.video?.startTime && event.video.startTime > 0) {
                  console.log(
                    `[PlayerMachine] Видео ${event.video?.id} из таймлайна (startTime=${event.video.startTime}), устанавливаем флаг готовности`,
                  )
                  return true
                }
                // Иначе сохраняем текущее значение
                return false
              },
            }),
            // Добавляем логирование
            ({ event }) => {
              console.log(
                `[PlayerMachine] Установлено видео в состоянии ready: ${event.video?.id}, path=${event.video?.path}, source=${event.video?.source}`,
              )
            },
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
          actions: [
            // Обновляем значение громкости в контексте плеера
            assign({ volume: ({ event }) => event.volume }),
            // Сохраняем уровень звука в localStorage
            ({ event }) => {
              if (typeof window !== "undefined") {
                localStorage.setItem("player-volume", event.volume.toString())
                console.log(`[PlayerMachine] Сохранен уровень звука: ${event.volume}`)
              }
            },
          ],
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
        setIsResizableMode: {
          actions: assign({ isResizableMode: ({ event }) => event.isResizableMode }),
        },
        setPreferredSource: {
          actions: assign({ preferredSource: ({ event }) => event.preferredSource }),
        },
        setLastAppliedTemplate: {
          actions: assign({ lastAppliedTemplate: ({ event }) => event.lastAppliedTemplate }),
        },
        setPreviewClickBehavior: {
          actions: assign({ previewClickBehavior: ({ event }) => event.previewClickBehavior }),
        },
      },
    },
  },
})
