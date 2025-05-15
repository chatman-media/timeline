import { assign, createMachine } from "xstate"

import { stopAllVideos } from "@/media-editor/browser/services/video-control"
import { MediaFile } from "@/types/media"
import { TimelineVideo } from "@/types/timeline"

import { createEmptyVideo, getVideosFromTimeline } from "./source-control"
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

  // Состояние готовности видео (0-4, где 4 - полностью готово)
  videoReadyState: Record<string, number>

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

  // Новые поля для хранения видео по источникам
  timelineVideos: MediaFile[] // Видео из таймлайна
  browserVideos: MediaFile[] // Видео из браузера

  // Информация о источнике каждого видео
  videoSources: Record<string, "media" | "timeline">
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
  videoReadyState: {}, // Состояние готовности видео
  duration: 0,
  volume: getSavedVolume(),
  parallelVideos: [],
  activeVideoId: null,
  appliedTemplate: null,
  preferredSource: "timeline", // По умолчанию используем таймлайн как источник
  lastAppliedTemplate: null,
  previewClickBehavior: "player", // По умолчанию проигрываем в медиа плеере (новое поведение)

  // Инициализируем новые поля
  timelineVideos: [],
  browserVideos: [],
  videoSources: {},
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

type SwitchVideoSourceEvent = {
  type: "switchVideoSource"
  tracks: any[] // Треки таймлайна
  activeTrackId: string | null // ID активного трека
  parallelVideos: MediaFile[] // Параллельные видео из браузера
}

type SetLastAppliedTemplateEvent = {
  type: "setLastAppliedTemplate"
  lastAppliedTemplate: AppliedTemplate | null
}

type SetPreviewClickBehaviorEvent = {
  type: "setPreviewClickBehavior"
  previewClickBehavior: "preview" | "player"
}

type SetVideoReadyStateEvent = {
  type: "setVideoReadyState"
  videoReadyState: Record<string, number>
}

// Новые события для обновления видео из разных источников
type UpdateTimelineVideosEvent = {
  type: "updateTimelineVideos"
  videos: MediaFile[]
}

type UpdateBrowserVideosEvent = {
  type: "updateBrowserVideos"
  videos: MediaFile[]
}

type UpdateVideoSourcesEvent = {
  type: "updateVideoSources"
  videoSources: Record<string, "media" | "timeline">
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
  | SetVideoReadyStateEvent
  | SwitchVideoSourceEvent
  | UpdateTimelineVideosEvent
  | UpdateBrowserVideosEvent
  | UpdateVideoSourcesEvent

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

              // Останавливаем все видео в браузере, кроме видео в шаблоне
              stopAllVideos(true)
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
          actions: [
            // Устанавливаем шаблон
            assign({ appliedTemplate: ({ event }) => event.appliedTemplate }),
            // Если устанавливается шаблон, принудительно устанавливаем источник в "timeline"
            assign({
              preferredSource: "timeline" as const,
            }),
            // Логируем применение шаблона
            ({ event }) => {
              if (event.appliedTemplate) {
                console.log(
                  `[PlayerMachine] Применен шаблон: ${event.appliedTemplate.template?.id}, видео: ${event.appliedTemplate.videos?.length || 0}`,
                )

                // Проверяем, что все видео в шаблоне имеют source = "timeline"
                if (event.appliedTemplate.videos) {
                  event.appliedTemplate.videos.forEach((video: any, index: number) => {
                    if (video.source !== "timeline") {
                      console.warn(
                        `[PlayerMachine] Видео ${index} в шаблоне имеет неправильный источник: ${video.source}, исправляем на "timeline"`,
                      )
                      video.source = "timeline"
                    }
                  })
                }
              } else {
                console.log(`[PlayerMachine] Шаблон сброшен`)
              }
            },
          ],
        },
        setIsResizableMode: {
          actions: assign({ isResizableMode: ({ event }) => event.isResizableMode }),
        },
        setPreferredSource: {
          actions: [
            // Всегда устанавливаем preferredSource в "timeline" для шаблонов
            assign({
              preferredSource: ({ event, context }) => {
                // Если есть шаблон, всегда используем таймлайн
                if (context.appliedTemplate) {
                  console.log(
                    `[PlayerMachine] Есть шаблон, принудительно устанавливаем источник в "timeline"`,
                  )
                  return "timeline"
                }
                // Иначе используем запрошенный источник
                return event.preferredSource
              },
            }),
            // Если устанавливается источник "media", но есть шаблон, принудительно обновляем шаблон с видео из таймлайна
            ({ event, context }) => {
              console.log(
                `[PlayerMachine] setPreferredSource: ${context.preferredSource} (запрошено: ${event.preferredSource})`,
              )

              // Если есть шаблон и запрошен источник "media", обновляем шаблон с видео из таймлайна
              if (context.appliedTemplate && event.preferredSource === "media") {
                console.log(
                  `[PlayerMachine] Запрошен источник "media", но есть шаблон, обновляем шаблон с видео из таймлайна`,
                )

                // Обновляем шаблон с видео из таймлайна
                if (context.timelineVideos.length > 0) {
                  // Создаем копию шаблона
                  const templateCopy = { ...context.appliedTemplate }

                  // Заполняем шаблон видео из таймлайна
                  templateCopy.videos = context.timelineVideos
                    .slice(0, context.appliedTemplate.template?.screens || 1)
                    .map((video: any) => ({
                      ...video,
                      source: "timeline", // Явно устанавливаем источник как timeline
                    }))

                  console.log(
                    `[PlayerMachine] Обновлен шаблон с ${templateCopy.videos.length} видео из таймлайна`,
                  )

                  // Применяем обновленный шаблон
                  context.appliedTemplate = templateCopy
                }
              }
            },
          ],
        },
        setVideoReadyState: {
          actions: assign({
            videoReadyState: ({ event, context }) => {
              // Объединяем существующее состояние с новым
              return { ...context.videoReadyState, ...event.videoReadyState }
            },
          }),
        },

        // Обработчики для новых событий
        updateTimelineVideos: {
          actions: [
            assign({
              timelineVideos: ({ event }) => event.videos,
            }),
            ({ event, context }) => {
              console.log(`[PlayerMachine] Обновлены видео из таймлайна: ${event.videos.length}`)

              // Обновляем источники видео
              const newVideoSources = { ...context.videoSources }

              // Помечаем все видео из таймлайна
              event.videos.forEach((video: MediaFile) => {
                if (video.id) {
                  newVideoSources[video.id] = "timeline"
                  console.log(`[PlayerMachine] Видео ${video.id} помечено как видео из таймлайна`)
                }
              })

              // Обновляем источники видео в контексте
              context.videoSources = newVideoSources
            },
          ],
        },

        updateBrowserVideos: {
          actions: [
            assign({
              browserVideos: ({ event }) => event.videos,
            }),
            ({ event, context }) => {
              console.log(`[PlayerMachine] Обновлены видео из браузера: ${event.videos.length}`)

              // Обновляем источники видео
              const newVideoSources = { ...context.videoSources }

              // Помечаем все видео из браузера
              event.videos.forEach((video: MediaFile) => {
                if (video.id) {
                  newVideoSources[video.id] = "media"
                  console.log(`[PlayerMachine] Видео ${video.id} помечено как видео из браузера`)
                }
              })

              // Обновляем источники видео в контексте
              context.videoSources = newVideoSources
            },
          ],
        },

        updateVideoSources: {
          actions: [
            assign({
              videoSources: ({ event }) => event.videoSources,
            }),
            ({ event }) => {
              console.log(
                `[PlayerMachine] Обновлены источники видео: ${Object.keys(event.videoSources).length}`,
              )
            },
          ],
        },
        switchVideoSource: {
          actions: [
            // Устанавливаем флаг, что идет процесс переключения камеры
            assign({ isChangingCamera: true }),

            // Обработчик для переключения источника видео
            ({ context, event }) => {
              console.log(
                `[PlayerMachine] Переключение источника видео: ${context.preferredSource}`,
              )
              console.log(
                `[PlayerMachine] Детали события: tracks=${event.tracks.length}, activeTrackId=${event.activeTrackId}, parallelVideos=${event.parallelVideos.length}`,
              )

              // Выводим информацию о текущем состоянии
              console.log(
                `[PlayerMachine] Текущее состояние: video=${context.video?.id}, activeVideoId=${context.activeVideoId}, appliedTemplate=${!!context.appliedTemplate}`,
              )

              // Если текущий источник - таймлайн
              if (context.preferredSource === "timeline") {
                console.log(`[PlayerMachine] Получаем видео из таймлайна...`)
                // Получаем видео из таймлайна
                const timelineVideos = getVideosFromTimeline(event.tracks, event.activeTrackId)

                // Если есть видео из таймлайна
                if (timelineVideos.length > 0) {
                  console.log(`[PlayerMachine] Найдено ${timelineVideos.length} видео из таймлайна`)
                  // Выводим детали каждого видео
                  timelineVideos.forEach((video, index) => {
                    console.log(
                      `[PlayerMachine] Видео ${index + 1}/${timelineVideos.length}: id=${video.id}, path=${video.path}, startTime=${video.startTime}`,
                    )
                  })

                  // Обновляем видео из таймлайна в контексте
                  context.timelineVideos = timelineVideos

                  // Обновляем источники видео в контексте
                  const newVideoSources = { ...context.videoSources }

                  // Помечаем все видео из таймлайна
                  timelineVideos.forEach((video) => {
                    if (video.id) {
                      newVideoSources[video.id] = "timeline"
                      console.log(
                        `[PlayerMachine] Видео ${video.id} помечено как видео из таймлайна`,
                      )
                    }
                  })

                  // Обновляем источники видео в контексте
                  context.videoSources = newVideoSources

                  // Если есть примененный шаблон, полностью пересоздаем его
                  if (context.appliedTemplate) {
                    console.log(`[PlayerMachine] Полностью пересоздаем шаблон для таймлайна`)

                    // Сохраняем ссылку на текущий шаблон
                    const currentTemplate = context.appliedTemplate.template

                    // Сначала сбрасываем шаблон
                    context.appliedTemplate = null

                    // Создаем новый шаблон с видео из таймлайна с большей задержкой
                    setTimeout(() => {
                      // Проверяем, что у нас все еще таймлайн как источник
                      if (context.preferredSource === "timeline") {
                        console.log(`[PlayerMachine] Создаем новый шаблон с видео из таймлайна`)

                        // Создаем новый шаблон
                        const newTemplate = {
                          template: currentTemplate,
                          videos: timelineVideos
                            .slice(0, currentTemplate?.screens || 1)
                            .map((video: MediaFile) => ({
                              ...video,
                              source: "timeline", // Явно устанавливаем источник как timeline
                            })),
                        }

                        console.log(
                          `[PlayerMachine] Создан новый шаблон с ${newTemplate.videos.length} видео из таймлайна`,
                        )

                        // Применяем новый шаблон
                        context.appliedTemplate = newTemplate

                        // Устанавливаем первое видео из таймлайна как активное
                        if (timelineVideos.length > 0) {
                          context.activeVideoId = timelineVideos[0].id
                          context.video = timelineVideos[0]
                          console.log(
                            `[PlayerMachine] Установлено активное видео из таймлайна: ${timelineVideos[0].id}`,
                          )
                        }
                      } else {
                        console.log(`[PlayerMachine] Источник изменился, не обновляем шаблон`)
                      }
                    }, 150) // Увеличиваем задержку для гарантии обновления
                  }
                  // Если нет примененного шаблона, но есть последний примененный шаблон
                  else if (context.lastAppliedTemplate) {
                    console.log(
                      `[PlayerMachine] Создаем новый шаблон из последнего примененного шаблона для таймлайна`,
                    )

                    // Сохраняем ссылку на последний шаблон
                    const lastTemplate = context.lastAppliedTemplate.template

                    // Сначала сбрасываем шаблон для гарантии обновления
                    context.appliedTemplate = null

                    // Создаем новый шаблон с видео из таймлайна с задержкой
                    setTimeout(() => {
                      // Проверяем, что у нас все еще таймлайн как источник
                      if (context.preferredSource === "timeline") {
                        console.log(
                          `[PlayerMachine] Создаем новый шаблон из последнего примененного для таймлайна`,
                        )

                        // Создаем новый шаблон с видео из таймлайна
                        const newTemplate = {
                          template: lastTemplate,
                          videos: timelineVideos
                            .slice(0, lastTemplate?.screens || 1)
                            .map((video: MediaFile) => ({
                              ...video,
                              source: "timeline", // Явно устанавливаем источник как timeline
                            })),
                        }

                        console.log(
                          `[PlayerMachine] Создан новый шаблон из последнего примененного с ${newTemplate.videos.length} видео из таймлайна`,
                        )

                        // Применяем новый шаблон
                        context.appliedTemplate = newTemplate

                        // Устанавливаем первое видео из таймлайна как активное
                        if (timelineVideos.length > 0) {
                          context.activeVideoId = timelineVideos[0].id
                          context.video = timelineVideos[0]
                          console.log(
                            `[PlayerMachine] Установлено активное видео из таймлайна: ${timelineVideos[0].id}`,
                          )
                        }
                      } else {
                        console.log(`[PlayerMachine] Источник изменился, не обновляем шаблон`)
                      }
                    }, 150) // Увеличиваем задержку для гарантии обновления
                  }
                  // Если нет ни активного, ни последнего шаблона
                  else {
                    console.log(
                      `[PlayerMachine] Нет шаблонов, просто показываем видео из таймлайна`,
                    )

                    // Устанавливаем первое видео из таймлайна как активное
                    if (timelineVideos.length > 0) {
                      context.activeVideoId = timelineVideos[0].id
                      context.video = timelineVideos[0]
                      console.log(
                        `[PlayerMachine] Установлено активное видео из таймлайна: ${timelineVideos[0].id}`,
                      )
                    }
                  }
                }
                // Если нет видео из таймлайна
                else {
                  console.log(
                    `[PlayerMachine] Нет доступных видео из таймлайна, показываем черный экран`,
                  )

                  // Если есть примененный шаблон, сохраняем его, но очищаем видео
                  if (context.appliedTemplate) {
                    console.log(
                      `[PlayerMachine] Есть примененный шаблон, сохраняем его, но очищаем видео`,
                    )

                    // Создаем копию шаблона
                    const templateCopy = { ...context.appliedTemplate }

                    // Заполняем шаблон пустыми видео
                    const requiredVideos = context.appliedTemplate.template?.screens || 1
                    templateCopy.videos = []

                    for (let i = 0; i < requiredVideos; i++) {
                      templateCopy.videos.push(createEmptyVideo(i))
                    }

                    // Применяем обновленный шаблон
                    context.appliedTemplate = templateCopy
                  }

                  // Сбрасываем активное видео, чтобы показать черный экран
                  context.activeVideoId = null
                  context.video = null
                }
              }
              // Если текущий источник - браузер, все равно используем видео из таймлайна для шаблона
              else {
                console.log(
                  `[PlayerMachine] Переключаемся на источник "media" (браузер), но для шаблона будем использовать видео из таймлайна`,
                )

                // Используем параллельные видео из браузера только для отображения вне шаблона
                const browserVideos = event.parallelVideos

                console.log(`[PlayerMachine] Найдено ${browserVideos.length} видео из браузера`)

                // Обновляем видео из браузера в контексте
                context.browserVideos = browserVideos

                // Обновляем источники видео в контексте
                const newVideoSources = { ...context.videoSources }

                // Помечаем все видео из браузера
                browserVideos.forEach((video: MediaFile) => {
                  if (video.id) {
                    newVideoSources[video.id] = "media"
                    console.log(`[PlayerMachine] Видео ${video.id} помечено как видео из браузера`)
                  }
                })

                // Обновляем источники видео в контексте
                context.videoSources = newVideoSources

                // Если нет шаблона, просто показываем видео из браузера
                if (!context.appliedTemplate && !context.lastAppliedTemplate) {
                  console.log(`[PlayerMachine] Нет шаблонов, просто показываем видео из браузера`)

                  // Если есть видео из браузера
                  if (browserVideos.length > 0) {
                    // Устанавливаем первое видео из браузера как активное
                    context.activeVideoId = browserVideos[0].id
                    context.video = browserVideos[0]
                    console.log(
                      `[PlayerMachine] Установлено активное видео из браузера: ${browserVideos[0].id}`,
                    )
                  } else {
                    console.log(`[PlayerMachine] Нет доступных видео из браузера`)
                    // Сбрасываем активное видео
                    context.activeVideoId = null
                    context.video = null
                  }
                }
                // Если есть шаблон, используем видео из таймлайна
                else {
                  console.log(`[PlayerMachine] Есть шаблон, используем видео из таймлайна для него`)

                  // Получаем видео из таймлайна
                  const timelineVideos = getVideosFromTimeline(event.tracks, event.activeTrackId)

                  if (timelineVideos.length > 0) {
                    console.log(
                      `[PlayerMachine] Найдено ${timelineVideos.length} видео из таймлайна для шаблона`,
                    )

                    // Если есть примененный шаблон
                    if (context.appliedTemplate) {
                      console.log(
                        `[PlayerMachine] Обновляем примененный шаблон с видео из таймлайна`,
                      )

                      // Создаем копию шаблона
                      const templateCopy = { ...context.appliedTemplate }

                      // Заполняем шаблон видео из таймлайна
                      templateCopy.videos = timelineVideos
                        .slice(0, context.appliedTemplate.template?.screens || 1)
                        .map((video: MediaFile) => ({
                          ...video,
                          source: "timeline", // Явно устанавливаем источник как timeline
                        }))

                      console.log(
                        `[PlayerMachine] Добавлено ${templateCopy.videos.length} видео из таймлайна в шаблон`,
                      )

                      // Применяем обновленный шаблон
                      context.appliedTemplate = templateCopy

                      // Устанавливаем первое видео из таймлайна как активное
                      if (timelineVideos.length > 0) {
                        context.activeVideoId = timelineVideos[0].id
                        context.video = timelineVideos[0]
                        console.log(
                          `[PlayerMachine] Установлено активное видео из таймлайна: ${timelineVideos[0].id}`,
                        )
                      }
                    }
                    // Если нет примененного шаблона, но есть последний примененный шаблон
                    else if (context.lastAppliedTemplate) {
                      console.log(`[PlayerMachine] Применяем последний шаблон с видео из таймлайна`)

                      // Создаем копию последнего шаблона
                      const templateCopy = JSON.parse(JSON.stringify(context.lastAppliedTemplate))

                      // Заполняем шаблон видео из таймлайна
                      templateCopy.videos = timelineVideos
                        .slice(0, templateCopy.template?.screens || 1)
                        .map((video: MediaFile) => ({
                          ...video,
                          source: "timeline", // Явно устанавливаем источник как timeline
                        }))

                      console.log(
                        `[PlayerMachine] Добавлено ${templateCopy.videos.length} видео из таймлайна в последний шаблон`,
                      )

                      // Применяем обновленный шаблон
                      context.appliedTemplate = templateCopy

                      // Устанавливаем первое видео из таймлайна как активное
                      if (timelineVideos.length > 0) {
                        context.activeVideoId = timelineVideos[0].id
                        context.video = timelineVideos[0]
                        console.log(
                          `[PlayerMachine] Установлено активное видео из таймлайна: ${timelineVideos[0].id}`,
                        )
                      }
                    }
                  }
                  // Если нет видео из таймлайна
                  else {
                    console.log(`[PlayerMachine] Нет доступных видео из таймлайна для шаблона`)

                    // Если есть примененный шаблон, очищаем его
                    if (context.appliedTemplate) {
                      console.log(`[PlayerMachine] Есть примененный шаблон, очищаем его`)

                      // Создаем копию шаблона
                      const templateCopy = { ...context.appliedTemplate }
                      // Очищаем список видео в шаблоне
                      templateCopy.videos = []
                      // Применяем обновленный шаблон
                      context.appliedTemplate = templateCopy
                    }
                    // Если есть последний примененный шаблон, применяем его с пустыми видео
                    else if (context.lastAppliedTemplate) {
                      console.log(`[PlayerMachine] Применяем последний шаблон без видео`)

                      // Создаем копию последнего шаблона
                      const templateCopy = JSON.parse(JSON.stringify(context.lastAppliedTemplate))
                      // Очищаем список видео в шаблоне
                      templateCopy.videos = []
                      // Применяем обновленный шаблон
                      context.appliedTemplate = templateCopy
                    }

                    // Если есть видео из браузера, используем их вне шаблона
                    if (browserVideos.length > 0) {
                      context.activeVideoId = browserVideos[0].id
                      context.video = browserVideos[0]
                      console.log(
                        `[PlayerMachine] Установлено активное видео из браузера: ${browserVideos[0].id}`,
                      )
                    } else {
                      // Сбрасываем активное видео
                      context.activeVideoId = null
                      context.video = null
                    }
                  }
                }
              }
            },

            // Сбрасываем флаг переключения камеры через небольшую задержку
            ({ context }) => {
              // Увеличиваем задержку для обеспечения корректного обновления видео
              setTimeout(() => {
                console.log(`[PlayerMachine] Сбрасываем флаг isChangingCamera`)
                context.isChangingCamera = false

                // Принудительно обновляем видео в шаблоне, если источник - таймлайн
                if (context.preferredSource === "timeline" && context.appliedTemplate) {
                  console.log(
                    `[PlayerMachine] Принудительно обновляем видео в шаблоне для таймлайна`,
                  )

                  // Сначала полностью сбрасываем шаблон для гарантии обновления
                  const currentTemplate = context.appliedTemplate.template
                  const timelineVideos = context.timelineVideos

                  // Сохраняем ссылку на текущий шаблон и видео
                  console.log(`[PlayerMachine] Временно сбрасываем шаблон для полного обновления`)
                  context.appliedTemplate = null

                  // Через задержку создаем новый шаблон с видео из таймлайна
                  setTimeout(() => {
                    console.log(`[PlayerMachine] Создаем новый шаблон с видео из таймлайна`)

                    // Проверяем, что у нас есть видео из таймлайна
                    if (timelineVideos.length > 0) {
                      // Создаем новый шаблон
                      const newTemplate = {
                        template: currentTemplate,
                        videos: timelineVideos
                          .slice(0, currentTemplate?.screens || 1)
                          .map((video: MediaFile) => ({
                            ...video,
                            source: "timeline", // Явно устанавливаем источник как timeline
                          })),
                      }

                      console.log(
                        `[PlayerMachine] Создан новый шаблон с ${newTemplate.videos.length} видео из таймлайна`,
                      )

                      // Применяем новый шаблон
                      context.appliedTemplate = newTemplate

                      // Устанавливаем первое видео из таймлайна как активное
                      if (timelineVideos.length > 0) {
                        context.activeVideoId = timelineVideos[0].id
                        context.video = timelineVideos[0]
                        console.log(
                          `[PlayerMachine] Установлено активное видео из таймлайна: ${timelineVideos[0].id}`,
                        )
                      }
                    } else {
                      console.log(`[PlayerMachine] Нет видео из таймлайна для обновления шаблона`)

                      // Если нет видео из таймлайна, восстанавливаем шаблон без видео
                      context.appliedTemplate = {
                        template: currentTemplate,
                        videos: [],
                      }
                    }
                  }, 100)
                }
              }, 500) // Увеличиваем задержку с 300 до 500 мс
            },
          ],
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
