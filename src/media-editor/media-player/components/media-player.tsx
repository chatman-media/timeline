import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { usePlayerContext } from "@/media-editor/media-player"
import { PlayerControls } from "@/media-editor/media-player/components/player-controls"
import { ResizableTemplate } from "@/media-editor/media-player/components/resizable-template"
import { ResizableVideo } from "@/media-editor/media-player/components/resizable-video"
import { useDisplayTime } from "@/media-editor/media-player/contexts"
import {
  getVideoStyleForTemplate,
  VideoTemplateStyle,
} from "@/media-editor/media-player/services/template-service"
import { useProject } from "@/media-editor/project-settings/project-provider"
import { MediaFile } from "@/types/media"

export function MediaPlayer() {
  // Для локализации
  const { t, i18n } = useTranslation()

  // Используем состояние для хранения текста, чтобы избежать проблем с гидратацией
  const [noVideoText, setNoVideoText] = useState("")

  // Состояние для отслеживания готовности видео
  const [videoReadyState, setVideoReadyState] = useState<Record<string, number>>({})

  // Состояние для отслеживания источника видео (медиа машина или таймлайн)
  const [videoSources, setVideoSources] = useState<Record<string, "media" | "timeline">>({})

  // Функция для проверки готовности видео
  const isVideoReady = (videoId: string): boolean => {
    return videoReadyState[videoId] >= 3 // HAVE_FUTURE_DATA или HAVE_ENOUGH_DATA
  }

  // Функция для определения источника видео
  const getVideoSource = (videoId: string): "media" | "timeline" | null => {
    return videoSources[videoId] || null
  }

  // Функция для установки источника видео
  const setVideoSource = (videoId: string, source: "media" | "timeline"): void => {
    setVideoSources((prev) => ({
      ...prev,
      [videoId]: source,
    }))
    console.log(`[MediaPlayer] Установлен источник для видео ${videoId}: ${source}`)
  }

  // Обновляем текст при изменении языка
  useEffect(() => {
    setNoVideoText(t("timeline.player.noVideoSelected"))
  }, [t, i18n.language])

  // Массив для хранения refs контейнеров видео
  const videoContainerRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({})
  const {
    video,
    isPlaying,
    setIsPlaying,
    duration,
    isSeeking,
    setIsSeeking,
    setCurrentTime,
    currentTime,
    isChangingCamera,
    setIsChangingCamera,
    isRecording,
    setIsRecording,
    videoRefs,
    parallelVideos,
    setParallelVideos,
    appliedTemplate,
    volume,
    preferredSource,
  } = usePlayerContext()

  // Получаем displayTime из контекста
  const { displayTime, setDisplayTime } = useDisplayTime()

  // Получаем настройки проекта
  const { settings } = useProject()

  // Вычисляем соотношение сторон из настроек проекта
  const [aspectRatio, setAspectRatio] = useState({
    width: settings.aspectRatio.value.width,
    height: settings.aspectRatio.value.height,
  })

  // Обновляем соотношение сторон при изменении настроек проекта
  useEffect(() => {
    setAspectRatio({
      width: settings.aspectRatio.value.width,
      height: settings.aspectRatio.value.height,
    })
  }, [settings.aspectRatio])

  // Добавляем обработчик сообщений от VideoPreview
  useEffect(() => {
    // Функция-обработчик сообщений
    const handleMessage = (event: MessageEvent) => {
      // Проверяем, что сообщение имеет нужный тип
      if (event.data && event.data.type === "VIDEO_PREVIEW_CLICK") {
        const { file, play, source } = event.data.data

        console.log("[MediaPlayer] Получено сообщение от VideoPreview:", file.name)

        // Устанавливаем источник видео
        if (file.id) {
          setVideoSource(file.id, source)
        }

        // Обновляем состояние плеера
        // Используем setTimeout, чтобы избежать бесконечного цикла обновлений
        setTimeout(() => {
          // Устанавливаем предпочтительный источник
          if (source === "media") {
            console.log("[MediaPlayer] Устанавливаем предпочтительный источник: media (браузер)")
          }

          // Устанавливаем текущее видео как активное в плеере
          if (file) {
            console.log("[MediaPlayer] Устанавливаем видео из браузера:", file.name)
          }

          // Запускаем воспроизведение, если нужно
          if (play) {
            console.log("[MediaPlayer] Запускаем воспроизведение видео из браузера")
          }
        }, 0)
      }
    }

    // Добавляем обработчик сообщений
    window.addEventListener("message", handleMessage)

    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  // Используем ref для отслеживания последнего значения громкости
  const lastVolumeRef = useRef(volume)
  // Используем ref для отслеживания времени последнего обновления громкости
  const lastVolumeUpdateTimeRef = useRef(0)

  // Эффект для обработки изменения громкости
  useEffect(() => {
    // Если нет видео или рефов, выходим
    if (!videoRefs) return

    // Проверяем, изменилась ли громкость с последнего обновления
    if (Math.abs(lastVolumeRef.current - volume) < 0.01) {
      return // Пропускаем обновление при незначительных изменениях
    }

    // Проверяем, прошло ли достаточно времени с последнего обновления
    const now = performance.now()
    if (now - lastVolumeUpdateTimeRef.current < 100) {
      return // Ограничиваем частоту обновлений
    }

    // Обновляем время последнего обновления
    lastVolumeUpdateTimeRef.current = now
    // Сохраняем новое значение громкости
    lastVolumeRef.current = volume

    // Активное видео ID уже доступно через video?.id

    // Если используется шаблон с несколькими видео, применяем громкость ко всем видео
    if (appliedTemplate?.template && parallelVideos.length > 0) {
      // Создаем массив уникальных видео для обновления громкости
      const uniqueVideos = parallelVideos.filter(
        (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
      )

      uniqueVideos.forEach((parallelVideo) => {
        if (parallelVideo.id && videoRefs[parallelVideo.id]) {
          const videoElement = videoRefs[parallelVideo.id]

          // Устанавливаем громкость для всех видео в шаблоне
          videoElement.volume = volume
          videoElement.muted = false
          // Уменьшаем количество логов
          if (Math.abs(videoElement.volume - volume) > 0.1) {
            console.log(
              `[Volume] Установлена громкость ${volume} для видео ${parallelVideo.id} в шаблоне`,
            )
          }
        }
      })
    }
    // Если нет шаблона, применяем громкость только к активному видео
    else if (video?.id && videoRefs[video.id]) {
      // Получаем элемент видео
      const videoElement = videoRefs[video.id]

      // Устанавливаем громкость только если она действительно изменилась
      if (Math.abs(videoElement.volume - volume) > 0.01) {
        videoElement.volume = volume

        // Логируем только значительные изменения громкости
        if (Math.abs(videoElement.volume - volume) > 0.1) {
          console.log(`[Volume] Установлена громкость ${volume} для видео ${video.id}`)
        }
      }
    }

    // Сохранение в localStorage перенесено в компонент player-controls.tsx
  }, [video, videoRefs, volume, appliedTemplate, parallelVideos])

  // Используем ref для хранения последнего времени обновления, чтобы избежать слишком частых обновлений
  const lastUpdateTimeRef = useRef(0)
  // Последнее отправленное время - для хранения относительного прогресса
  const lastSentTimeRef = useRef(0)
  // Определяем, короткое ли видео (меньше 10 секунд)
  const isShortVideo = useRef(false)
  const videoStartTime = useRef(0)
  // Сохраняем ID текущего видео для предотвращения цикличности
  const currentVideoIdRef = useRef<string | null>(null)
  // Базовая метка времени для нормализации Unix timestamp
  const baseTimestampRef = useRef<number | null>(null)
  // Флаг инициализации для предотвращения сброса времени
  const isInitializedRef = useRef(false)
  // Используем ref для отслеживания предыдущего значения isChangingCamera
  const prevIsChangingCameraRef = useRef(false)
  // Используем ref для отслеживания изменения видео, чтобы избежать бесконечного цикла
  const isVideoChangedRef = useRef(false)

  // Используем ref для предотвращения множественных вызовов
  const isHandlingPlayPauseRef = useRef(false)
  const lastPlayPauseTimeRef = useRef(0)

  // Рефы для эффекта обработки изменения состояния воспроизведения
  const isHandlingPlayPauseEffectRef = useRef(false)
  const lastPlayPauseEffectTimeRef = useRef(0)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Предотвращаем множественные вызовы в течение короткого промежутка времени
    const now = Date.now()
    if (isHandlingPlayPauseRef.current || now - lastPlayPauseTimeRef.current < 300) {
      console.log("[MediaPlayer] Игнорируем повторный вызов handlePlayPause")
      return
    }

    // Устанавливаем флаг, что обрабатываем событие
    isHandlingPlayPauseRef.current = true
    lastPlayPauseTimeRef.current = now

    // Если идет процесс переключения камеры, игнорируем нажатие
    if (isChangingCamera) {
      console.log("[MediaPlayer] Игнорируем переключение воспроизведения во время смены камеры")
      isHandlingPlayPauseRef.current = false
      return
    }

    // Если используется шаблон с несколькими видео, сохраняем время для всех видео
    if (appliedTemplate?.template && parallelVideos.length > 0) {
      if (isPlaying) {
        // Сохраняем текущее время для всех видео перед паузой
        parallelVideos.forEach((parallelVideo) => {
          if (parallelVideo.id && videoRefs[parallelVideo.id]) {
            const videoElement = videoRefs[parallelVideo.id]
            const currentVideoTime = videoElement.currentTime
            videoTimesRef.current[parallelVideo.id] = currentVideoTime
            console.log(
              `[MediaPlayer] Сохраняем время для видео ${parallelVideo.id} перед паузой: ${currentVideoTime.toFixed(3)}`,
            )
          }
        })
      }
    }
    // Если нет шаблона, сохраняем время только для активного видео
    else if (isPlaying && video?.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]
      // Сохраняем текущее время в lastSentTimeRef и videoTimesRef
      const currentVideoTime = videoElement.currentTime
      lastSentTimeRef.current = currentVideoTime
      videoTimesRef.current[video.id] = currentVideoTime
      console.log(`[MediaPlayer] Сохраняем время перед паузой: ${currentVideoTime.toFixed(3)}`)
    }

    // Переключаем состояние воспроизведения для всех видео
    setIsPlaying(!isPlaying)

    // Сбрасываем флаг обработки через небольшую задержку
    setTimeout(() => {
      isHandlingPlayPauseRef.current = false
    }, 300)
  }

  // Используем ref для отслеживания последнего обработанного видео и его пути
  const lastProcessedVideoRef = useRef<{ id: string | null; path: string | null }>({
    id: null,
    path: null,
  })
  // Используем ref для отслеживания количества инициализаций видео
  const initCountRef = useRef(0)

  // Эффект для обработки событий видео после монтирования
  useEffect(() => {
    if (!video?.id) return

    // Проверяем, не обрабатывали ли мы уже это видео в текущем рендере
    // Сравниваем и ID и путь, чтобы учесть случаи, когда видео с тем же ID может иметь разный путь
    if (
      lastProcessedVideoRef.current.id === video.id &&
      lastProcessedVideoRef.current.path === video.path &&
      isVideoChangedRef.current &&
      initCountRef.current > 2
    ) {
      // Пропускаем повторную инициализацию того же видео после нескольких инициализаций
      console.log(
        `[MediaPlayer] Пропускаем повторную инициализацию видео ${video.id} (count: ${initCountRef.current})`,
      )
      return
    }

    // Увеличиваем счетчик инициализаций
    initCountRef.current++

    // Обновляем информацию о последнем обработанном видео
    lastProcessedVideoRef.current = { id: video.id, path: video.path }

    console.log(
      `[MediaPlayer] Инициализация видео ${video.id}, path: ${video.path}, count: ${initCountRef.current}`,
    )

    // Проверяем, изменилось ли видео с прошлого рендера
    const isVideoChanged = currentVideoIdRef.current !== video.id
    if (isVideoChanged) {
      console.log(
        `[MediaPlayer] Обнаружена смена видео: ${currentVideoIdRef.current} -> ${video.id}`,
      )
      // Сбрасываем флаг при смене видео
      isVideoChangedRef.current = false
      // Сбрасываем счетчик инициализаций при смене видео
      initCountRef.current = 1

      // Сохраняем ID текущего видео
      currentVideoIdRef.current = video.id

      // Обрабатываем переключение между параллельными видео
      if (parallelVideos && parallelVideos.length > 1 && currentVideoIdRef.current) {
        // Находим предыдущее видео в списке параллельных
        const prevVideoIndex = parallelVideos.findIndex((v) => v.id === currentVideoIdRef.current)
        if (prevVideoIndex !== -1) {
          // Находим текущее видео в списке параллельных
          const currentVideoIndex = parallelVideos.findIndex((v) => v.id === video.id)
          if (currentVideoIndex !== -1) {
            console.log(
              `[MediaPlayer] Переключение между параллельными видео: ${prevVideoIndex} -> ${currentVideoIndex}`,
            )

            // Сохраняем текущее время предыдущего видео и вычисляем относительную позицию
            const prevVideo = parallelVideos[prevVideoIndex]
            const prevVideoElement = videoRefs[prevVideo.id]

            if (prevVideoElement) {
              const prevVideoTime = prevVideoElement.currentTime
              const prevVideoDuration = prevVideo.duration || 1
              const relativePosition = prevVideoTime / prevVideoDuration

              console.log(
                `[MediaPlayer] Предыдущее время: ${prevVideoTime}, относительная позиция: ${relativePosition.toFixed(3)}`,
              )

              // Сохраняем состояние записи
              const wasRecording = isRecording

              // Временно останавливаем запись, если она активна
              if (wasRecording) {
                console.log(
                  "[MediaPlayer] Временно приостанавливаем запись для безопасного переключения",
                )
                setIsRecording(false)
              }

              // Устанавливаем флаг переключения камеры
              setIsChangingCamera(true)

              // Устанавливаем новое время для текущего видео на основе относительной позиции
              setTimeout(() => {
                const currentVideoElement = videoRefs[video.id]
                if (currentVideoElement) {
                  const currentVideoDuration = video.duration || 1
                  const newTime = relativePosition * currentVideoDuration

                  currentVideoElement.currentTime = newTime
                  console.log(
                    `[MediaPlayer] Установлено время ${newTime.toFixed(3)} для видео ${video.id} (длительность: ${currentVideoDuration})`,
                  )

                  // Сохраняем время для текущего видео
                  videoTimesRef.current[video.id] = newTime
                  lastSentTimeRef.current = newTime

                  // Сбрасываем флаг переключения камеры
                  setIsChangingCamera(false)

                  // Принудительно обновляем слайдер
                  setIsSeeking(true)
                  setTimeout(() => {
                    setIsSeeking(false)

                    // Возобновляем запись, если она была активна
                    if (wasRecording) {
                      console.log("[MediaPlayer] Возобновляем запись после переключения камеры")
                      setIsRecording(true)

                      // Если видео было на паузе, запускаем воспроизведение для записи
                      if (!isPlaying) {
                        console.log(
                          "[MediaPlayer] Автоматически запускаем воспроизведение для записи",
                        )
                        setIsPlaying(true)
                      }
                    }
                  }, 50)
                } else {
                  console.log(`[MediaPlayer] Видео элемент для ${video.id} не найден`)
                  setIsChangingCamera(false)

                  // Возобновляем запись, если она была активна, даже при ошибке
                  if (wasRecording) {
                    console.log("[MediaPlayer] Возобновляем запись после ошибки")
                    setIsRecording(true)
                  }
                }
              }, 300)

              return // Выходим из функции, так как мы уже обработали переключение
            }
          }
        }
      }
    }

    // Устанавливаем флаг isChangingCamera только при первом рендере или при смене видео
    if (!isVideoChangedRef.current) {
      isVideoChangedRef.current = true

      // Проверяем, не слишком ли быстро происходит переключение
      const now = performance.now()
      const timeSinceLastChange = now - lastCameraChangeTimeRef.current

      // Устанавливаем флаг isChangingCamera при смене видео, если нет блокировки
      if (!isChangingCamera && !isCameraChangeLockRef.current) {
        // Если прошло менее 500мс с последнего переключения, блокируем быстрое переключение
        if (timeSinceLastChange < 500) {
          console.log(
            `[MediaPlayer] Блокировка быстрого переключения камеры (${timeSinceLastChange.toFixed(0)}мс)`,
          )
          isCameraChangeLockRef.current = true

          // Снимаем блокировку через 1 секунду
          setTimeout(() => {
            isCameraChangeLockRef.current = false
            console.log(`[MediaPlayer] Снята блокировка быстрого переключения камеры`)
          }, 1000)
        }

        // Обновляем время последнего переключения
        lastCameraChangeTimeRef.current = now

        setIsChangingCamera(true)
        console.log(`[MediaPlayer] Установлен флаг isChangingCamera для видео ${video.id}`)
      }
    }

    // Принудительно обновляем видео элемент при смене видео
    if (isVideoChanged && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]
      if (video.path && (!videoElement.src || !videoElement.src.includes(video.id))) {
        console.log(
          `[MediaPlayer] Принудительное обновление src для видео ${video.id}: ${video.path}`,
        )
        videoElement.src = video.path
        videoElement.load()
      }
    }

    // Используем setTimeout, чтобы дать время для монтирования видео элемента
    const timer = setTimeout(() => {
      // Проверяем, что видео ID не изменился с момента запуска таймера
      if (video?.id !== lastProcessedVideoRef.current.id) {
        console.log(
          `[MediaPlayer] ID видео изменился с момента запуска таймера, пропускаем обработку`,
        )
        return
      }

      const videoElement = videoRefs[video.id]
      if (videoElement) {
        // Определяем источник видео
        const source = getVideoSource(video.id)
        console.log(
          `[MediaPlayer] Видео элемент ${video.id} готов к использованию, источник: ${source || "неизвестен"}`,
        )

        // Проверяем, что src установлен правильно
        if (!videoElement.src || !videoElement.src.includes(video.id)) {
          // Проверяем, что путь к видео существует
          if (video.path) {
            console.log(`[MediaPlayer] Устанавливаем src для видео ${video.id}: ${video.path}`)
            videoElement.src = video.path

            // Если источник не определен, устанавливаем его на основе наличия startTime
            if (!source) {
              const newSource = video.startTime !== undefined ? "timeline" : "media"
              setVideoSource(video.id, newSource)
              console.log(`[MediaPlayer] Установлен источник для видео ${video.id}: ${newSource}`)
            }
          } else {
            console.error(`[MediaPlayer] Ошибка: путь к видео ${video.id} не определен`)
            // Сбрасываем флаг isChangingCamera при ошибке
            setIsChangingCamera(false)
            return
          }
        }

        // Добавляем обработчик события loadedmetadata
        const handleLoadedMetadata = () => {
          // Проверяем, не обрабатывали ли мы уже метаданные для этого видео
          if (metadataLoadedMapRef.current[video.id]) {
            console.log(
              `[MediaPlayer] Метаданные для видео ${video.id} уже были обработаны, пропускаем`,
            )
            return
          }

          // Устанавливаем флаг, что метаданные обработаны
          metadataLoadedMapRef.current[video.id] = true

          console.log(
            `[MediaPlayer] Метаданные видео ${video.id} загружены, длительность: ${videoElement.duration}s`,
          )

          // Устанавливаем локальное время для видео (без учета startTime)
          let localTime = 0

          // Если у нас Unix timestamp, используем сохраненный относительный прогресс
          if (currentTime > 365 * 24 * 60 * 60) {
            // Проверяем, есть ли сохраненное время для этого видео
            if (videoTimesRef.current[video.id] !== undefined) {
              // Используем сохраненное время для этого видео
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[MediaPlayer] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени для видео, но есть сохраненный прогресс
            else if (
              isInitializedRef.current &&
              lastSentTimeRef.current > 0 &&
              lastSentTimeRef.current < 100000
            ) {
              // Используем lastSentTimeRef для восстановления прогресса воспроизведения
              localTime = lastSentTimeRef.current
              console.log(`[MediaPlayer] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)

              // Сохраняем это время для текущего видео
              videoTimesRef.current[video.id] = localTime
            }
            // Если есть параллельные видео, пробуем вычислить относительное время
            else if (parallelVideos && parallelVideos.length > 1) {
              // Находим другое видео с сохраненным временем
              const otherVideoWithTime = parallelVideos.find(
                (v) => v.id !== video.id && videoTimesRef.current[v.id] !== undefined,
              )

              if (otherVideoWithTime) {
                const otherVideoTime = videoTimesRef.current[otherVideoWithTime.id]
                const otherVideoDuration = otherVideoWithTime.duration || 1
                const relativePosition = otherVideoTime / otherVideoDuration

                // Вычисляем новое время на основе относительной позиции
                const newTime = relativePosition * (video.duration || 1)

                console.log(
                  `[MediaPlayer] Вычисление относительного времени: ${newTime.toFixed(3)} (на основе ${otherVideoWithTime.id})`,
                )
                localTime = newTime

                // Сохраняем это время
                videoTimesRef.current[video.id] = newTime
                lastSentTimeRef.current = newTime
              } else {
                // Если нет сохраненного прогресса или плеер не инициализирован,
                // используем 0 как начальное время
                localTime = 0

                // Обновляем lastSentTimeRef с корректным значением
                if (lastSentTimeRef.current > 100000) {
                  console.log(
                    `[MediaPlayer] Сброс некорректного lastSentTimeRef: ${lastSentTimeRef.current} -> ${localTime}`,
                  )
                  lastSentTimeRef.current = localTime
                }
              }
            } else {
              // Если нет сохраненного прогресса или плеер не инициализирован,
              // используем 0 как начальное время
              localTime = 0

              // Обновляем lastSentTimeRef с корректным значением
              if (lastSentTimeRef.current > 100000) {
                console.log(
                  `[MediaPlayer] Сброс некорректного lastSentTimeRef: ${lastSentTimeRef.current} -> ${localTime}`,
                )
                lastSentTimeRef.current = localTime
              }
            }
          } else if (video.startTime) {
            // Для обычного времени вычисляем локальное время
            localTime = Math.max(0, currentTime - (video.startTime || 0))
          } else {
            // Если нет startTime, используем currentTime напрямую
            localTime = currentTime
          }

          // Устанавливаем время
          if (Math.abs(videoElement.currentTime - localTime) > 0.1) {
            videoElement.currentTime = localTime
            console.log(`[MediaPlayer] Установлено начальное время: ${localTime.toFixed(3)}`)
          }

          // Устанавливаем громкость
          videoElement.volume = volume
          console.log(`[MediaPlayer] Установлена начальная громкость: ${volume}`)

          // Сбрасываем флаг isChangingCamera после загрузки метаданных
          // Используем setTimeout, чтобы избежать бесконечного цикла обновлений
          if (isChangingCamera && !autoResetTimerRef.current) {
            console.log(`[MediaPlayer] Сброс флага isChangingCamera после загрузки метаданных`)
            setIsChangingCamera(false)
          }
        }

        // Добавляем обработчик ошибок с более подробной диагностикой
        const handleError = () => {
          console.error(`[MediaPlayer] Ошибка загрузки видео ${video.id}:`, videoElement.error)
          console.error(
            `[MediaPlayer] Детали ошибки для ${video.id}: networkState=${videoElement.networkState}, readyState=${videoElement.readyState}, error=${videoElement.error?.code}`,
          )

          // Проверяем, что элемент все еще в DOM
          if (!document.body.contains(videoElement)) {
            console.error(`[MediaPlayer] Видео элемент ${video.id} был удален из DOM`)
            // Сбрасываем флаг isChangingCamera при ошибке
            if (isChangingCamera) {
              setIsChangingCamera(false)
            }
            return
          }

          // Сбрасываем флаг isChangingCamera при ошибке
          if (isChangingCamera) {
            setIsChangingCamera(false)
          }

          // Сбрасываем флаг воспроизведения
          if (isPlaying) {
            setIsPlaying(false)
          }

          // Пробуем перезагрузить видео с задержкой
          setTimeout(() => {
            try {
              // Проверяем, что элемент все еще существует и находится в DOM
              if (videoElement && document.body.contains(videoElement) && video.path) {
                console.log(`[MediaPlayer] Пробуем перезагрузить видео ${video.id} после задержки`)
                videoElement.src = video.path
                videoElement.load()

                // Добавляем обработчик для проверки успешности перезагрузки
                const checkReloadSuccess = () => {
                  if (videoElement.readyState >= 2) {
                    console.log(`[MediaPlayer] Видео ${video.id} успешно перезагружено`)
                    videoElement.removeEventListener("loadeddata", checkReloadSuccess)
                  }
                }

                videoElement.addEventListener("loadeddata", checkReloadSuccess, { once: true })

                // Устанавливаем таймаут для проверки успешности перезагрузки
                setTimeout(() => {
                  if (videoElement.readyState < 2) {
                    console.error(
                      `[MediaPlayer] Не удалось перезагрузить видео ${video.id} после таймаута`,
                    )
                  }
                }, 3000)
              }
            } catch (loadError) {
              console.error(`[MediaPlayer] Ошибка при перезагрузке видео ${video.id}:`, loadError)
            }
          }, 500) // Добавляем задержку перед перезагрузкой
        }

        videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
        videoElement.addEventListener("error", handleError)

        // Принудительно запускаем загрузку метаданных
        videoElement.load()

        return () => {
          videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
          videoElement.removeEventListener("error", handleError)
        }
      } else {
        console.warn(
          `[MediaPlayer] Видео элемент ${video.id} не найден после таймаута, пробуем повторно`,
        )

        // Создаем механизм повторных попыток с увеличивающимся интервалом
        let retryCount = 0
        const maxRetries = 5 // Увеличиваем максимальное количество попыток

        // Функция для создания видео элемента программно, если он не существует
        const createVideoElement = () => {
          if (!videoRefs[video.id] && video.path) {
            console.log(`[MediaPlayer] Создаем видео элемент для ${video.id} программно`)

            // Создаем видео элемент
            const videoElement = document.createElement("video")
            videoElement.id = `video-${video.id}`
            videoElement.preload = "auto"
            videoElement.playsInline = true
            videoElement.controls = false
            videoElement.autoplay = false
            videoElement.loop = false
            videoElement.muted = false
            videoElement.volume = volume
            videoElement.src = video.path
            console.log(`[MediaPlayer] Создан видео элемент для ${video.id} с громкостью ${volume}`)

            // Добавляем элемент в DOM (скрытый)
            videoElement.style.position = "absolute"
            videoElement.style.width = "1px"
            videoElement.style.height = "1px"
            videoElement.style.opacity = "0"
            videoElement.style.pointerEvents = "none"
            document.body.appendChild(videoElement)

            // Сохраняем ссылку на элемент
            videoRefs[video.id] = videoElement

            // Определяем источник видео
            const source = video.startTime !== undefined ? "timeline" : "media"
            setVideoSource(video.id, source)
            console.log(
              `[MediaPlayer] Видео ${video.id} программно создано и определено как ${source}`,
            )

            // Начинаем загрузку
            videoElement.load()

            return videoElement
          }
          return null
        }

        // Пробуем создать элемент сразу
        const createdElement = createVideoElement()
        if (createdElement) {
          console.log(`[MediaPlayer] Видео элемент ${video.id} создан программно`)
          return
        }

        const retryInterval = setInterval(() => {
          retryCount++

          // Проверяем, что видео ID не изменился с момента запуска таймера
          if (video?.id !== lastProcessedVideoRef.current.id) {
            console.log(
              `[MediaPlayer] ID видео изменился во время повторных попыток, останавливаем`,
            )
            clearInterval(retryInterval)
            return
          }

          // Проверяем, существует ли элемент
          let videoElement = videoRefs[video.id]

          // Если элемент не существует, пробуем создать его программно
          if (!videoElement) {
            const newElement = createVideoElement()
            if (newElement) {
              videoElement = newElement
            }
          }

          if (videoElement) {
            console.log(
              `[MediaPlayer] Видео элемент ${video.id} найден после повторной попытки ${retryCount}`,
            )
            clearInterval(retryInterval)

            // Проверяем, что элемент находится в DOM
            if (!document.body.contains(videoElement)) {
              console.warn(
                `[MediaPlayer] Видео элемент ${video.id} не находится в DOM, добавляем его`,
              )
              document.body.appendChild(videoElement)
            }

            // Проверяем, что src установлен правильно
            if (!videoElement.src || !videoElement.src.includes(video.id)) {
              // Проверяем, что путь к видео существует
              if (video.path) {
                console.log(`[MediaPlayer] Устанавливаем src для видео ${video.id}: ${video.path}`)
                videoElement.src = video.path
                videoElement.load()

                // Добавляем обработчик для проверки успешности загрузки
                const checkLoadSuccess = () => {
                  console.log(
                    `[MediaPlayer] Видео ${video.id} успешно загружено после повторной попытки`,
                  )
                  videoElement.removeEventListener("loadeddata", checkLoadSuccess)
                }

                videoElement.addEventListener("loadeddata", checkLoadSuccess, { once: true })
              }
            }
          } else if (retryCount >= maxRetries) {
            console.error(
              `[MediaPlayer] Видео элемент ${video.id} не найден после ${maxRetries} повторных попыток`,
            )
            clearInterval(retryInterval)
            // Сбрасываем флаг isChangingCamera при ошибке
            setIsChangingCamera(false)

            // Последняя попытка создать элемент программно
            createVideoElement()
          } else {
            console.log(
              `[MediaPlayer] Повторная попытка ${retryCount}/${maxRetries} найти видео элемент ${video.id}`,
            )
          }
        }, 500) // Увеличиваем интервал между повторными попытками

        // Очищаем интервал при размонтировании компонента
        return () => {
          clearInterval(retryInterval)
        }
      }
    }, 500) // Увеличиваем задержку для гарантии монтирования

    return () => {
      clearTimeout(timer)
    }
  }, [
    video?.id,
    video?.path,
    videoRefs,
    currentTime,
    setIsChangingCamera,
    parallelVideos,
    setIsSeeking,
    video?.duration,
  ])

  // Используем ref для хранения времени для каждого видео
  const videoTimesRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Проверяем, изменилось ли видео
    const isVideoChanged = currentVideoIdRef.current !== video.id
    if (isVideoChanged) {
      console.log(`[MediaPlayer] Видео изменилось: ${currentVideoIdRef.current} -> ${video.id}`)

      // Если у нас было предыдущее видео, сохраняем его время
      if (currentVideoIdRef.current) {
        const prevVideoElement = videoRefs[currentVideoIdRef.current]
        if (prevVideoElement) {
          // Сохраняем текущее время предыдущего видео
          videoTimesRef.current[currentVideoIdRef.current] = prevVideoElement.currentTime
          console.log(
            `[MediaPlayer] Сохраняем время для видео ${currentVideoIdRef.current}: ${prevVideoElement.currentTime.toFixed(3)}`,
          )
        }
      }

      // Сохраняем ID текущего видео
      currentVideoIdRef.current = video.id

      // Сбрасываем флаг инициализации при смене видео
      isInitializedRef.current = false

      // Проверяем, есть ли сохраненное время для нового видео
      if (videoTimesRef.current[video.id] !== undefined) {
        // Используем сохраненное время для этого видео
        lastSentTimeRef.current = videoTimesRef.current[video.id]
        console.log(
          `[MediaPlayer] Восстанавливаем сохраненное время для видео ${video.id}: ${lastSentTimeRef.current.toFixed(3)}`,
        )
      }
      // Если нет сохраненного времени для видео, проверяем сохраненное время для сектора
      else if (
        currentSectorRef.current &&
        sectorTimesRef.current[currentSectorRef.current] !== undefined
      ) {
        // Используем сохраненное время для текущего сектора
        lastSentTimeRef.current = sectorTimesRef.current[currentSectorRef.current]
        console.log(
          `[MediaPlayer] Восстанавливаем сохраненное время для сектора ${currentSectorRef.current}: ${lastSentTimeRef.current.toFixed(3)}`,
        )

        // Сохраняем это время для текущего видео
        videoTimesRef.current[video.id] = lastSentTimeRef.current
      } else {
        // Если нет сохраненного времени, начинаем с начала
        console.log(
          `[MediaPlayer] Нет сохраненного времени для видео ${video.id} и сектора ${currentSectorRef.current}, начинаем с начала`,
        )
        lastSentTimeRef.current = 0
      }

      // Сбрасываем флаг воспроизведения при смене видео, чтобы избежать автоматического воспроизведения
      if (isPlaying) {
        console.log(`[MediaPlayer] Приостанавливаем воспроизведение при смене видео`)
        setIsPlaying(false)
      }
    }

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (duration || 0) < 10

    // Нормализуем startTime - если это Unix timestamp, преобразуем в относительное время
    const rawStartTime = video.startTime || 0
    // Если startTime больше года в секундах, это, вероятно, Unix timestamp
    if (rawStartTime > 365 * 24 * 60 * 60) {
      // Используем первое видео как точку отсчета
      if (baseTimestampRef.current === null) {
        baseTimestampRef.current = rawStartTime
        videoStartTime.current = 0
        console.log(`[MediaPlayer] Установлена базовая метка времени: ${baseTimestampRef.current}`)
      } else {
        // Вычисляем относительное время от базовой метки
        videoStartTime.current = rawStartTime - baseTimestampRef.current
        console.log(
          `[MediaPlayer] Относительное startTime: ${videoStartTime.current.toFixed(3)} (от базы ${baseTimestampRef.current})`,
        )
      }
    } else {
      // Если это уже относительное время, используем как есть
      videoStartTime.current = rawStartTime
    }

    // Оптимизированный обработчик timeupdate для плавного обновления timeline bar
    const onTimeUpdate = (): void => {
      // Проверяем, что видео не изменилось
      if (currentVideoIdRef.current !== video.id) return

      // Проверяем время с последнего обновления, чтобы не вызывать слишком частые изменения состояния
      const now = performance.now()
      // Увеличиваем порог до 200мс для уменьшения частоты обновлений
      if (now - lastUpdateTimeRef.current < 200) return

      // Обновляем currentTime только если не идет перемотка (внутренняя или внешняя)
      // и не меняется камера
      if (!videoElement.seeking && !isChangingCamera && !isSeeking) {
        // Получаем текущее локальное время видео
        const localVideoTime = videoElement.currentTime

        // Если текущее глобальное время - Unix timestamp, обрабатываем особым образом
        if (currentTime > 365 * 24 * 60 * 60) {
          // Обновляем displayTime в контексте для синхронизации с TimelineBar
          // Всегда обновляем displayTime при каждом событии timeupdate
          // Это необходимо для плавного движения таймлайн бара
          setDisplayTime(localVideoTime)

          // Логируем только при существенном изменении времени, чтобы не засорять консоль
          if (Math.abs(localVideoTime - displayTime) > 0.1) {
            console.log(
              `[MediaPlayer] Обновлен displayTime в контексте: ${localVideoTime.toFixed(3)}, старое значение: ${displayTime.toFixed(3)}`,
            )
          }

          // Сохраняем относительный прогресс (без учета startTime)
          const relativeProgress = localVideoTime

          // Проверяем валидность времени
          if (isFinite(relativeProgress) && !isNaN(relativeProgress) && relativeProgress >= 0) {
            // Увеличиваем порог разницы времени для уменьшения частоты обновлений
            const timeDiffThreshold = 0.2 // 200мс

            // Проверяем, изменилось ли время с последнего отправленного значения
            // Используем только если lastSentTimeRef не содержит Unix timestamp
            const validLastSentTime = lastSentTimeRef.current < 100000 ? lastSentTimeRef.current : 0
            const timeDiff = Math.abs(relativeProgress - validLastSentTime)

            if (timeDiff > timeDiffThreshold) {
              // Для отладки - показываем только значительные изменения
              if (timeDiff > 1) {
                console.log(
                  `[MediaPlayer] Обновление относительного прогресса: ${validLastSentTime.toFixed(3)} -> ${relativeProgress.toFixed(3)}`,
                )
              }

              // Устанавливаем флаг инициализации при первом обновлении прогресса
              if (!isInitializedRef.current && relativeProgress > 0) {
                isInitializedRef.current = true
                console.log(`[MediaPlayer] Инициализация прогресса: ${relativeProgress.toFixed(3)}`)
              }

              // Сохраняем относительный прогресс в ref для сравнения
              lastUpdateTimeRef.current = now
              lastSentTimeRef.current = relativeProgress

              // Сохраняем время для текущего видео
              videoTimesRef.current[video.id] = relativeProgress

              // НЕ обновляем глобальное время (currentTime), чтобы не сбросить Unix timestamp
            }
          }
        } else {
          // Стандартная обработка для обычного времени
          const newTime = localVideoTime + videoStartTime.current

          // Проверяем валидность времени (объединяем проверки для оптимизации)
          if (
            !isFinite(newTime) ||
            isNaN(newTime) ||
            newTime < 0.001 ||
            newTime > 100 * 365 * 24 * 60 * 60
          ) {
            // Не обновляем состояние при некорректном времени, просто игнорируем
            return
          }

          // Проверяем, что время не выходит за пределы видео
          const videoEndTime = videoStartTime.current + (duration || 0)
          if (newTime > videoEndTime) {
            setCurrentTime(videoEndTime)
            lastUpdateTimeRef.current = now
            lastSentTimeRef.current = videoEndTime
            return
          }

          // Увеличиваем порог разницы времени для уменьшения частоты обновлений
          const timeDiffThreshold = 0.2 // 200мс

          // Проверяем, изменилось ли время с последнего отправленного значения
          const timeDiff = Math.abs(newTime - lastSentTimeRef.current)
          if (timeDiff > timeDiffThreshold) {
            // Обновляем время для плавного движения timeline bar
            setCurrentTime(newTime)
            lastUpdateTimeRef.current = now
            lastSentTimeRef.current = newTime

            // Сохраняем локальное время для текущего видео
            videoTimesRef.current[video.id] = videoElement.currentTime
          }
        }
      }
    }

    const handleError = (e: ErrorEvent): void => {
      console.error("Video playback error:", e)
      setIsPlaying(false)
    }

    // Добавляем оптимизированный слушатель
    videoElement.addEventListener("timeupdate", onTimeUpdate)
    videoElement.addEventListener("error", handleError)

    const playVideo = async (): Promise<void> => {
      try {
        // Проверяем, что видео элемент все еще существует и доступен
        if (!videoElement || !document.body.contains(videoElement)) {
          console.log("[PlayVideo] Видео элемент не найден или удален из DOM")

          // Пробуем получить элемент снова через небольшую задержку
          setTimeout(() => {
            // Проверяем, что видео ID не изменился с момента запуска таймера
            if (video?.id !== currentVideoIdRef.current) {
              console.log(
                `[PlayVideo] ID видео изменился с момента запуска таймера, пропускаем повторную попытку`,
              )
              return
            }

            const refreshedElement = videoRefs[video.id]
            if (refreshedElement && document.body.contains(refreshedElement)) {
              console.log("[PlayVideo] Повторная попытка воспроизведения после задержки")

              // Проверяем, что src установлен правильно
              if (
                video.path &&
                (!refreshedElement.src || !refreshedElement.src.includes(video.id))
              ) {
                console.log(
                  `[PlayVideo] Устанавливаем src для видео ${video.id} перед повторной попыткой: ${video.path}`,
                )
                refreshedElement.src = video.path
                refreshedElement.load()

                // Добавляем обработчик для запуска воспроизведения после загрузки
                const handleCanPlay = () => {
                  if (isPlaying && !isChangingCamera) {
                    console.log(`[PlayVideo] Запускаем воспроизведение после загрузки src`)
                    refreshedElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error("[PlayVideo] Ошибка при воспроизведении после загрузки:", err)
                      }
                    })
                  }
                  refreshedElement.removeEventListener("canplay", handleCanPlay)
                }

                refreshedElement.addEventListener("canplay", handleCanPlay, { once: true })

                // Устанавливаем таймаут на случай, если событие canplay не сработает
                setTimeout(() => {
                  refreshedElement.removeEventListener("canplay", handleCanPlay)
                  if (isPlaying && !isChangingCamera && refreshedElement.paused) {
                    console.log(`[PlayVideo] Запускаем воспроизведение после таймаута`)
                    refreshedElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error("[PlayVideo] Ошибка при воспроизведении после таймаута:", err)
                      }
                    })
                  }
                }, 2000)
              } else if (isPlaying && !isChangingCamera) {
                refreshedElement.play().catch((err) => {
                  if (err.name !== "AbortError") {
                    console.error("[PlayVideo] Ошибка при повторной попытке:", err)
                  }
                })
              }
            } else {
              console.error(
                `[PlayVideo] Видео элемент ${video.id} не найден после повторной попытки`,
              )
            }
          }, 500) // Увеличиваем задержку для более надежной повторной попытки

          return
        }

        // Проверяем, что видео ID не изменился
        if (video.id !== currentVideoIdRef.current) {
          console.log("[PlayVideo] ID видео изменился, пропускаем воспроизведение")
          return
        }

        if (isPlaying) {
          // Устанавливаем локальное время для видео (без учета startTime)
          let localTime = currentTime

          // Если у нас Unix timestamp, используем сохраненное время для этого видео
          if (currentTime > 365 * 24 * 60 * 60) {
            // Если displayTime доступен из контекста и был недавно обновлен, используем его
            if (displayTime !== undefined && displayTime > 0) {
              localTime = displayTime
              console.log(
                `[PlayVideo] Используем displayTime из контекста: ${localTime.toFixed(3)}`,
              )

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime
            }
            // Проверяем, есть ли сохраненное время для этого видео
            else if (videoTimesRef.current[video.id] !== undefined) {
              // Используем сохраненное время для этого видео
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[PlayVideo] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени для видео, проверяем lastSentTimeRef
            else if (
              isInitializedRef.current &&
              lastSentTimeRef.current > 0 &&
              lastSentTimeRef.current < 100000
            ) {
              // Используем lastSentTimeRef для восстановления прогресса воспроизведения
              // Но только если это разумное значение (не Unix timestamp)
              localTime = lastSentTimeRef.current
              console.log(`[PlayVideo] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime
            } else {
              // Если нет сохраненного прогресса или плеер не инициализирован,
              // или lastSentTimeRef содержит Unix timestamp
              // используем текущее время видео
              localTime = videoElement.currentTime || 0

              // Обновляем lastSentTimeRef с корректным значением
              if (lastSentTimeRef.current > 100000) {
                console.log(
                  `[PlayVideo] Сброс некорректного lastSentTimeRef: ${lastSentTimeRef.current} -> ${localTime}`,
                )
                lastSentTimeRef.current = localTime
              }

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime

              console.log(`[PlayVideo] Используем текущее время видео: ${localTime.toFixed(3)}`)
            }
          } else if (video.startTime) {
            // Для обычного времени вычисляем локальное время
            localTime = Math.max(0, currentTime - (video.startTime || 0))

            // Сохраняем локальное время для этого видео
            videoTimesRef.current[video.id] = localTime
          }

          // Проверяем, что текущее время видео отличается от требуемого
          if (Math.abs(videoElement.currentTime - localTime) > 0.5) {
            console.log(
              `[PlayVideo] Синхронизация времени: ${videoElement.currentTime.toFixed(3)} -> ${localTime.toFixed(3)}`,
            )
            videoElement.currentTime = localTime
          }

          // Проверяем готовность видео к воспроизведению
          if (videoElement.readyState >= 2) {
            // HAVE_CURRENT_DATA или выше
            // Используем более надежный способ воспроизведения с обработкой ошибок
            const playPromise = videoElement.play()

            // Обрабатываем promise только если он возвращен
            if (playPromise !== undefined) {
              playPromise.catch((playErr) => {
                // Игнорируем ошибки прерывания воспроизведения, так как они ожидаемы
                // при быстром переключении между видео
                if (playErr.name !== "AbortError") {
                  console.error("[PlayVideo] Ошибка воспроизведения:", playErr)
                  setIsPlaying(false)
                }
              })
            }
          } else {
            // Если видео не готово, добавляем одноразовый слушатель для запуска
            console.log("[PlayVideo] Видео не готово, ожидаем событие canplay")
            const handleCanPlay = () => {
              if (isPlaying) {
                // Проверяем, что состояние не изменилось
                videoElement.play().catch((playErr) => {
                  if (playErr.name !== "AbortError") {
                    console.error("[PlayVideo] Ошибка отложенного воспроизведения:", playErr)
                    setIsPlaying(false)
                  }
                })
              }
              // Удаляем слушатель после первого срабатывания
              videoElement.removeEventListener("canplay", handleCanPlay)
            }
            videoElement.addEventListener("canplay", handleCanPlay, { once: true })
          }
        } else {
          // Пауза в любом случае, если isPlaying = false
          if (!videoElement.paused) {
            // Сохраняем текущее время перед паузой в lastSentTimeRef и videoTimesRef
            const currentVideoTime = videoElement.currentTime
            lastSentTimeRef.current = currentVideoTime
            videoTimesRef.current[video.id] = currentVideoTime
            console.log(`[PlayVideo] Сохраняем время перед паузой: ${currentVideoTime.toFixed(3)}`)

            // Ставим на паузу
            videoElement.pause()
          }
        }
      } catch (error) {
        console.error("[PlayVideo] Необработанная ошибка:", error)
        setIsPlaying(false)
      }
    }

    // Устанавливаем громкость для активного видео
    // const trackVolume = trackVolumes[activeVideo.id] ?? 1
    // videoElement.volume = globalVolume * trackVolume

    playVideo()

    // Убираем старые слушатели при очистке
    return () => {
      videoElement.removeEventListener("timeupdate", onTimeUpdate)
      videoElement.removeEventListener("error", handleError)
    }
  }, [
    video,
    isPlaying,
    isChangingCamera,
    videoRefs,
    setCurrentTime,
    setIsPlaying,
    duration,
    isSeeking,
    currentTime,
    displayTime,
    setDisplayTime,
    // resetCamera,
  ])

  // Используем ref для отслеживания состояния воспроизведения во время переключения камеры
  const isPlayingDuringCameraChangeRef = useRef(false)
  // Используем ref для отслеживания последнего видео, для которого был установлен флаг isChangingCamera
  const lastChangingCameraVideoIdRef = useRef<string | null>(null)
  // Используем ref для отслеживания времени последнего переключения камеры
  const lastCameraChangeTimeRef = useRef(0)
  // Используем ref для блокировки быстрого последовательного переключения
  const isCameraChangeLockRef = useRef(false)

  useEffect(() => {
    // Проверяем, изменилось ли значение isChangingCamera
    if (isChangingCamera !== prevIsChangingCameraRef.current) {
      prevIsChangingCameraRef.current = isChangingCamera

      if (isChangingCamera && video?.id && videoRefs[video.id]) {
        console.log("[ChangingCamera] Обнаружено переключение камеры")

        // Сохраняем ID текущего видео
        lastChangingCameraVideoIdRef.current = video.id

        // Сохраняем текущее состояние воспроизведения и записи
        isPlayingDuringCameraChangeRef.current = isPlaying

        // Если видео воспроизводится, сначала ставим его на паузу
        // чтобы избежать конфликта между play() и pause()
        if (isPlaying) {
          const videoElement = videoRefs[video.id]
          if (videoElement && !videoElement.paused) {
            console.log(
              "[ChangingCamera] Временно приостанавливаем видео для безопасного переключения",
            )
            videoElement.pause()
          }
        }

        // Проверяем, что src установлен правильно
        const videoElement = videoRefs[video.id]
        if (
          videoElement &&
          video.path &&
          (!videoElement.src || !videoElement.src.includes(video.id))
        ) {
          console.log(`[ChangingCamera] Обновляем src для видео ${video.id}: ${video.path}`)
          videoElement.src = video.path
          videoElement.load()
        }

        // Сохраняем текущее время для синхронизации между треками
        if (video?.id) {
          // Определяем локальное время для синхронизации
          let localTime = 0

          // Если у нас Unix timestamp, используем сохраненное время для этого видео
          if (currentTime > 100 * 365 * 24 * 60 * 60) {
            // Проверяем, есть ли сохраненное время для этого видео
            if (videoTimesRef.current[video.id] !== undefined) {
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[ChangingCamera] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени, используем lastSentTimeRef
            else if (lastSentTimeRef.current > 0 && lastSentTimeRef.current < 100000) {
              localTime = lastSentTimeRef.current
              console.log(`[ChangingCamera] Используем lastSentTimeRef: ${localTime.toFixed(3)}`)
            }
            // Иначе используем текущее время видео или 0
            else {
              const videoElement = videoRefs[video.id]
              if (videoElement) {
                localTime = videoElement.currentTime || 0
              }
              console.log(
                `[ChangingCamera] Используем текущее время видео: ${localTime.toFixed(3)}`,
              )
            }
          }
          // Для обычного времени используем сохраненное время для этого видео или текущее время видео
          else {
            // Проверяем, есть ли сохраненное время для этого видео
            if (videoTimesRef.current[video.id] !== undefined) {
              localTime = videoTimesRef.current[video.id]
              console.log(
                `[ChangingCamera] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
              )
            }
            // Если нет сохраненного времени, вычисляем локальное время
            else {
              // Если startTime и currentTime оба являются Unix timestamp, используем 0 или текущее время видео
              if (
                video.startTime &&
                video.startTime > 365 * 24 * 60 * 60 &&
                currentTime &&
                currentTime > 365 * 24 * 60 * 60
              ) {
                const videoElement = videoRefs[video.id]
                if (videoElement) {
                  localTime = videoElement.currentTime || 0
                } else {
                  localTime = 0
                }
                console.log(
                  `[ChangingCamera] Используем текущее время видео: ${localTime.toFixed(3)}`,
                )
              }
              // Иначе вычисляем локальное время как разницу между currentTime и startTime
              else {
                localTime = Math.max(0, currentTime - (video.startTime || 0))
                console.log(
                  `[ChangingCamera] Вычисленное локальное время: ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${(video.startTime || 0).toFixed(3)})`,
                )
              }
            }
          }

          // Постановка видео на паузу, если нужно (убираем запуск во время переключения)
          const videoElement = videoRefs[video.id]
          if (videoElement) {
            // Синхронизируем время видео с вычисленным локальным временем
            if (Math.abs(videoElement.currentTime - localTime) > 0.3) {
              console.log(
                `[ChangingCamera] Синхронизация времени: ${videoElement.currentTime.toFixed(3)} -> ${localTime.toFixed(3)}`,
              )
              videoElement.currentTime = localTime

              // Сохраняем время для этого видео
              videoTimesRef.current[video.id] = localTime
              lastSentTimeRef.current = localTime
            }

            // Отложенное воспроизведение после переключения камеры
            // Используем setTimeout, чтобы избежать конфликта между play() и pause()
            setTimeout(() => {
              // Проверяем, что видео элемент все еще существует и доступен
              // и что это то же самое видео, для которого был установлен флаг isChangingCamera
              if (
                videoElement &&
                document.body.contains(videoElement) &&
                video.id === lastChangingCameraVideoIdRef.current
              ) {
                // Проверяем, что src установлен правильно
                if (video.path && (!videoElement.src || !videoElement.src.includes(video.id))) {
                  console.log(
                    `[ChangingCamera] Повторное обновление src для видео ${video.id}: ${video.path}`,
                  )
                  videoElement.src = video.path
                  videoElement.load()

                  // Даем дополнительное время для загрузки видео
                  setTimeout(() => {
                    // Проверяем снова, что видео элемент все еще существует
                    if (videoElement && document.body.contains(videoElement)) {
                      // Синхронизируем время видео с вычисленным локальным временем
                      if (Math.abs(videoElement.currentTime - localTime) > 0.3) {
                        console.log(
                          `[ChangingCamera] Повторная синхронизация времени: ${videoElement.currentTime.toFixed(3)} -> ${localTime.toFixed(3)}`,
                        )
                        videoElement.currentTime = localTime
                      }

                      // Возобновляем воспроизведение, если нужно
                      resumePlayback(videoElement, localTime)
                    }
                  }, 200)
                  return
                }

                // Возобновляем воспроизведение, если нужно
                resumePlayback(videoElement, localTime)
              }
            }, 300) // Добавляем задержку для безопасного переключения

            // Вспомогательная функция для возобновления воспроизведения
            const resumePlayback = (videoElement: HTMLVideoElement, _localTime: number) => {
              // Особая обработка для записи - всегда запускаем воспроизведение
              if (isRecording) {
                console.log("[ChangingCamera] В режиме записи - продолжаем воспроизведение")

                // Сначала сохраняем состояние записи
                const wasRecording = isRecording

                // Временно останавливаем запись, чтобы избежать конфликтов
                if (wasRecording) {
                  console.log(
                    "[ChangingCamera] Временно приостанавливаем запись для безопасного переключения",
                  )
                  setIsRecording(false)
                }

                // Устанавливаем воспроизведение
                setIsPlaying(true)

                try {
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[ChangingCamera] Ошибка воспроизведения при записи:", err)
                    }
                  })

                  // Возобновляем запись после небольшой задержки
                  if (wasRecording) {
                    setTimeout(() => {
                      console.log("[ChangingCamera] Возобновляем запись после переключения камеры")
                      setIsRecording(true)
                    }, 300)
                  }
                } catch (error) {
                  console.error(
                    "[ChangingCamera] Ошибка при воспроизведении во время записи:",
                    error,
                  )

                  // Возобновляем запись даже при ошибке, если она была активна
                  if (wasRecording) {
                    setTimeout(() => {
                      console.log("[ChangingCamera] Возобновляем запись после ошибки")
                      setIsRecording(true)
                    }, 300)
                  }
                }
              }
              // Обычное воспроизведение, если нужно
              else if (isPlayingDuringCameraChangeRef.current && videoElement.paused) {
                try {
                  console.log(
                    "[ChangingCamera] Возобновляем воспроизведение после переключения камеры",
                  )
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[ChangingCamera] Ошибка воспроизведения:", err)
                    }
                  })
                } catch (error) {
                  console.error("[ChangingCamera] Ошибка при воспроизведении:", error)
                }
              }
            }
          }
        }
      }
    }
  }, [
    isChangingCamera,
    videoRefs,
    video?.id,
    currentTime,
    isPlaying,
    isRecording,
    setIsPlaying,
    setIsRecording,
    setCurrentTime,
  ])

  // Эффект для автоматического сброса флага isChangingCamera через заданное время
  // Используем ref для отслеживания таймера, чтобы избежать создания нового таймера при каждом рендере
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Используем ref для отслеживания ID видео, для которого был установлен таймер сброса
  const autoResetVideoIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Очищаем предыдущий таймер, если он существует
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current)
      autoResetTimerRef.current = null
    }

    if (isChangingCamera && video?.id) {
      // Сохраняем ID текущего видео для проверки при сбросе
      autoResetVideoIdRef.current = video.id

      // Создаем новый таймер только если флаг isChangingCamera установлен
      autoResetTimerRef.current = setTimeout(() => {
        // Проверяем, что ID видео не изменился с момента установки таймера
        if (video.id === autoResetVideoIdRef.current) {
          console.log(
            `[AutoReset] Автоматический сброс флага isChangingCamera для видео ${video.id}`,
          )
          setIsChangingCamera(false)
        } else {
          console.log(
            `[AutoReset] Пропуск сброса флага isChangingCamera - видео изменилось: ${autoResetVideoIdRef.current} -> ${video.id}`,
          )
        }
        autoResetTimerRef.current = null
        autoResetVideoIdRef.current = null
      }, 2000) // Увеличиваем время до 2 секунд для надежности
    }

    return () => {
      // Очищаем таймер при размонтировании компонента
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current)
        autoResetTimerRef.current = null
      }
    }
  }, [isChangingCamera, video?.id, setIsChangingCamera])

  // Используем ref для отслеживания текущего сектора (дня)
  const currentSectorRef = useRef<string | null>(null)

  // Используем ref для отслеживания загрузки метаданных для каждого видео
  const metadataLoadedMapRef = useRef<Record<string, boolean>>({})

  // Используем ref для хранения глобального времени для каждого сектора (дня)
  const sectorTimesRef = useRef<Record<string, number>>({})

  // Эффект для синхронизации времени видео с общим состоянием - оптимизированная версия для плавного воспроизведения
  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Проверяем, изменилось ли видео
    if (currentVideoIdRef.current !== video.id) {
      console.log(
        `[MediaPlayer] Синхронизация: видео изменилось: ${currentVideoIdRef.current} -> ${video.id}`,
      )
      // Сохраняем ID текущего видео
      currentVideoIdRef.current = video.id
    }

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (duration || 0) < 10

    // Обновляем startTime при каждой синхронизации
    videoStartTime.current = video.startTime || 0

    // Определяем сектор (день) текущего видео на основе startTime
    // Используем дату в формате YYYY-MM-DD как идентификатор сектора
    let currentSector = null
    if (video.startTime && video.startTime > 365 * 24 * 60 * 60) {
      const date = new Date(video.startTime * 1000)
      currentSector = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } else {
      // Если startTime не является Unix timestamp, используем текущую дату
      const date = new Date()
      currentSector = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    }

    // Проверяем, изменился ли сектор
    const isSectorChanged = currentSector !== currentSectorRef.current
    if (isSectorChanged) {
      console.log(`[MediaPlayer] Сектор изменился: ${currentSectorRef.current} -> ${currentSector}`)

      // Сохраняем текущее время для предыдущего сектора
      if (
        currentSectorRef.current &&
        lastSentTimeRef.current > 0 &&
        lastSentTimeRef.current < 100000
      ) {
        sectorTimesRef.current[currentSectorRef.current] = lastSentTimeRef.current
        console.log(
          `[MediaPlayer] Сохраняем время для сектора ${currentSectorRef.current}: ${lastSentTimeRef.current.toFixed(3)}`,
        )
      }

      // Обновляем текущий сектор
      currentSectorRef.current = currentSector

      // Восстанавливаем время для нового сектора, если оно есть
      if (sectorTimesRef.current[currentSector] !== undefined) {
        lastSentTimeRef.current = sectorTimesRef.current[currentSector]
        console.log(
          `[MediaPlayer] Восстанавливаем время для сектора ${currentSector}: ${lastSentTimeRef.current.toFixed(3)}`,
        )
      } else {
        // При смене сектора сбрасываем сохраненное время, если нет сохраненного времени для нового сектора
        if (lastSentTimeRef.current > 0 && lastSentTimeRef.current < 100000) {
          console.log(
            `[MediaPlayer] Сброс времени при смене сектора: ${lastSentTimeRef.current} -> 0`,
          )
          lastSentTimeRef.current = 0
        }
      }
    }

    // Проверяем, что время валидно
    if (!isFinite(currentTime) || currentTime < 0) {
      // Если время некорректно, устанавливаем в начало
      if (Math.abs(videoElement.currentTime - 0) > 0.5) {
        videoElement.currentTime = 0
      }
      return
    }

    // Если мы в процессе переключения камеры, обрабатываем особым образом
    if (isChangingCamera) {
      // Не обновляем позицию автоматически при смене камеры,
      // это будет сделано в эффекте isChangingCamera
      return
    }

    // Определяем локальное время в зависимости от типа глобального времени
    let localTime

    // Если у нас Unix timestamp, обрабатываем особым образом
    if (currentTime > 365 * 24 * 60 * 60) {
      // Проверяем, есть ли сохраненное время для этого видео
      if (videoTimesRef.current[video.id] !== undefined) {
        // Используем сохраненное время для этого видео
        localTime = videoTimesRef.current[video.id]
        console.log(
          `[Sync] Используем сохраненное время для видео ${video.id}: ${localTime.toFixed(3)}`,
        )
      }
      // Если нет сохраненного времени для этого видео, проверяем сохраненное время для сектора
      else if (
        currentSectorRef.current &&
        sectorTimesRef.current[currentSectorRef.current] !== undefined
      ) {
        // Используем сохраненное время для текущего сектора
        localTime = sectorTimesRef.current[currentSectorRef.current]
        console.log(
          `[Sync] Используем сохраненное время для сектора ${currentSectorRef.current}: ${localTime.toFixed(3)}`,
        )

        // Сохраняем это время для текущего видео
        videoTimesRef.current[video.id] = localTime
      }
      // Если нет сохраненного времени для сектора, проверяем lastSentTimeRef
      else if (
        isInitializedRef.current &&
        lastSentTimeRef.current > 0 &&
        lastSentTimeRef.current < 100000
      ) {
        // Используем lastSentTimeRef для восстановления прогресса воспроизведения
        // Но только если это разумное значение (не Unix timestamp)
        localTime = lastSentTimeRef.current
        console.log(`[Sync] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)

        // Сохраняем это время для текущего видео
        videoTimesRef.current[video.id] = localTime
      } else {
        // Если нет сохраненного прогресса или плеер не инициализирован,
        // или lastSentTimeRef содержит Unix timestamp
        // используем текущее время видео
        localTime = videoElement.currentTime || 0

        // Обновляем lastSentTimeRef с корректным значением
        if (lastSentTimeRef.current > 100000) {
          console.log(
            `[Sync] Сброс некорректного lastSentTimeRef: ${lastSentTimeRef.current} -> ${localTime}`,
          )
          lastSentTimeRef.current = localTime
        }

        console.log(`[Sync] Используем текущее время видео: ${localTime.toFixed(3)}`)
      }
    } else {
      // Для обычного времени вычисляем локальное время
      localTime = Math.max(0, currentTime - videoStartTime.current)
    }

    // Вычисляем разницу между текущим временем видео и локальным временем
    const timeDifference = Math.abs(videoElement.currentTime - localTime)

    // Синхронизируем при активной перемотке или значительной разнице
    // Используем умеренный порог в 0.5 секунд для хорошей синхронизации
    if (isSeeking) {
      // При активной перемотке сразу применяем новое время
      videoElement.currentTime = localTime
      console.log(
        `[MediaPlayer] Перемотка: установлено время ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${videoStartTime.current.toFixed(3)})`,
      )

      // Обновляем lastSentTimeRef и сохраняем время для этого видео и сектора
      lastSentTimeRef.current = localTime
      videoTimesRef.current[video.id] = localTime

      // Если есть параллельные видео, синхронизируем их время пропорционально
      if (parallelVideos && parallelVideos.length > 1) {
        // Вычисляем относительную позицию для текущего видео
        const relativePosition = localTime / (video.duration || 1)

        // Определяем источник текущего видео
        const currentVideoSource = getVideoSource(video.id)

        // Обновляем время для всех параллельных видео
        parallelVideos.forEach((parallelVideo) => {
          if (parallelVideo.id !== video.id && videoRefs[parallelVideo.id]) {
            // Определяем источник параллельного видео
            const parallelVideoSource = getVideoSource(parallelVideo.id)

            // Если источники разные, логируем это
            if (
              currentVideoSource &&
              parallelVideoSource &&
              currentVideoSource !== parallelVideoSource
            ) {
              console.log(
                `[MediaPlayer] Синхронизация между видео из разных источников: ${currentVideoSource} -> ${parallelVideoSource}`,
              )
            }

            const parallelVideoDuration = parallelVideo.duration || 1
            const newParallelTime = relativePosition * parallelVideoDuration

            videoRefs[parallelVideo.id].currentTime = newParallelTime
            videoTimesRef.current[parallelVideo.id] = newParallelTime
            console.log(
              `[MediaPlayer] Синхронизировано время ${newParallelTime.toFixed(3)} для видео ${parallelVideo.id}`,
            )
          }
        })
      }

      // Сохраняем время для текущего сектора
      if (currentSectorRef.current) {
        sectorTimesRef.current[currentSectorRef.current] = localTime
        console.log(
          `[Sync] Сохраняем время для сектора ${currentSectorRef.current}: ${localTime.toFixed(3)}`,
        )
      }

      // Сбрасываем isSeeking после установки времени с минимальной задержкой
      setTimeout(() => setIsSeeking(false), 50)
    } else if (timeDifference > 0.5) {
      // Значительные расхождения синхронизируем принудительно
      videoElement.currentTime = localTime
      console.log(
        `[MediaPlayer] Синхронизация: установлено время ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${videoStartTime.current.toFixed(3)})`,
      )

      // Обновляем lastSentTimeRef и сохраняем время для этого видео и сектора
      lastSentTimeRef.current = localTime
      videoTimesRef.current[video.id] = localTime

      // Сохраняем время для текущего сектора
      if (currentSectorRef.current) {
        sectorTimesRef.current[currentSectorRef.current] = localTime
        console.log(
          `[Sync] Сохраняем время для сектора ${currentSectorRef.current}: ${localTime.toFixed(3)}`,
        )
      }
    }
    // Для плавного воспроизведения не синхронизируем малые различия
  }, [
    currentTime,
    video?.id,
    videoRefs,
    isSeeking,
    setIsSeeking,
    isChangingCamera,
    duration,
    video?.startTime,
    parallelVideos,
    video?.duration,
  ])

  // Эффект для обработки изменения состояния воспроизведения
  useEffect(() => {
    // Проверяем на дубликаты в параллельных видео
    const uniqueParallelIds = [...new Set(parallelVideos.map((v) => v.id))]
    if (uniqueParallelIds.length !== parallelVideos.length) {
      console.warn(
        `[PlayPauseEffect] Обнаружены дубликаты в параллельных видео! Уникальных: ${uniqueParallelIds.length}, всего: ${parallelVideos.length}`,
      )

      // Удаляем дубликаты из массива параллельных видео, предпочитая видео из предпочтительного источника
      const uniqueParallelVideos: MediaFile[] = []
      const processedIds = new Set<string>()

      // Получаем предпочтительный источник
      const source = preferredSource || "timeline"

      // Сначала добавляем видео из предпочтительного источника
      parallelVideos.forEach((video) => {
        if (video.id && !processedIds.has(video.id)) {
          // Определяем источник видео
          const videoSource =
            getVideoSource(video.id) || (video.startTime !== undefined ? "timeline" : "media")

          if (videoSource === source) {
            uniqueParallelVideos.push(video)
            processedIds.add(video.id)
          }
        }
      })

      // Затем добавляем оставшиеся видео, если такого ID еще нет
      parallelVideos.forEach((video) => {
        if (video.id && !processedIds.has(video.id)) {
          uniqueParallelVideos.push(video)
          processedIds.add(video.id)
        }
      })

      // Обновляем массив параллельных видео без дубликатов
      if (uniqueParallelVideos.length !== parallelVideos.length) {
        console.log(
          `[PlayPauseEffect] Удаляем дубликаты из параллельных видео, новый размер: ${uniqueParallelVideos.length}`,
        )
        console.log(`[PlayPauseEffect] Приоритет отдан видео из источника: ${source}`)
        setParallelVideos(uniqueParallelVideos)
        return // Выходим из эффекта, он будет вызван повторно с обновленным массивом
      }
    }

    // Проверяем, есть ли активное видео или видео в шаблоне
    const hasActiveVideo = !!video?.id
    const hasTemplateVideos = appliedTemplate?.videos && appliedTemplate.videos.length > 0
    const hasParallelVideos = parallelVideos && parallelVideos.length > 0

    // Если нет ни активного видео, ни видео в шаблоне, ни параллельных видео, выходим
    if (!hasActiveVideo && !hasTemplateVideos && !hasParallelVideos) {
      console.log("[PlayPauseEffect] Нет видео для воспроизведения")
      return
    }

    // Получаем видео элемент, если есть активное видео
    const videoElement = hasActiveVideo ? videoRefs[video.id] : null
    // Если есть активное видео, но нет элемента, и нет других видео, выходим
    if (hasActiveVideo && !videoElement && !hasTemplateVideos && !hasParallelVideos) return

    // Предотвращаем множественные вызовы в течение короткого промежутка времени
    const now = Date.now()
    if (isHandlingPlayPauseEffectRef.current || now - lastPlayPauseEffectTimeRef.current < 300) {
      console.log("[PlayPauseEffect] Игнорируем повторный вызов эффекта")
      return
    }

    // Устанавливаем флаг, что обрабатываем событие
    isHandlingPlayPauseEffectRef.current = true
    lastPlayPauseEffectTimeRef.current = now

    // Сохраняем текущее время видео перед изменением состояния воспроизведения, если есть активное видео и элемент
    if (hasActiveVideo && videoElement) {
      const currentVideoTime = videoElement.currentTime
      if (currentVideoTime > 0) {
        videoTimesRef.current[video.id] = currentVideoTime
        lastSentTimeRef.current = currentVideoTime

        // Сохраняем время для текущего сектора
        if (currentSectorRef.current) {
          sectorTimesRef.current[currentSectorRef.current] = currentVideoTime
          console.log(
            `[PlayPause] Сохраняем время для сектора ${currentSectorRef.current}: ${currentVideoTime.toFixed(3)}`,
          )
        }

        console.log(
          `[PlayPause] Сохраняем время для видео ${video.id}: ${currentVideoTime.toFixed(3)}`,
        )
      }
    }

    // Обрабатываем изменение состояния воспроизведения без установки флага isChangingCamera
    // Проверяем, не находимся ли мы в процессе переключения камеры или блокировки
    if (!isChangingCamera && !isCameraChangeLockRef.current) {
      // Если используется шаблон с несколькими видео, управляем всеми видео
      if (appliedTemplate?.template && parallelVideos.length > 0) {
        // Проверяем наличие видео в шаблоне
        const hasValidVideos = parallelVideos.some((parallelVideo) => {
          return parallelVideo.id && videoRefs[parallelVideo.id]
        })

        // Если нет валидных видео, выходим
        if (!hasValidVideos) {
          console.log(`[PlayPause] Нет валидных видео в шаблоне`)
          return
        }

        // Запускаем все видео одновременно, не дожидаясь их готовности
        // Это позволит браузеру самостоятельно управлять загрузкой и запуском
        if (isPlaying) {
          console.log(`[PlayPause] Запускаем синхронное воспроизведение всех видео`)

          // Используем requestAnimationFrame для запуска всех видео в одном кадре отрисовки
          requestAnimationFrame(async () => {
            try {
              // Создаем массив уникальных видео для воспроизведения
              const uniqueVideos = parallelVideos.filter(
                (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
              )

              console.log(
                `[PlayPause] Запускаем воспроизведение ${uniqueVideos.length} уникальных видео`,
              )

              // Запускаем воспроизведение всех видео одновременно
              const playPromises = uniqueVideos.map((parallelVideo) => {
                if (parallelVideo.id && videoRefs[parallelVideo.id]) {
                  const videoElement = videoRefs[parallelVideo.id]

                  // Проверяем, что элемент существует и находится в DOM
                  if (!videoElement || !document.body.contains(videoElement)) {
                    console.warn(
                      `[PlayPause] Видео элемент ${parallelVideo.id} не найден или удален из DOM`,
                    )
                    return Promise.resolve()
                  }

                  // Определяем источник видео
                  const source = getVideoSource(parallelVideo.id)

                  if (videoElement.paused) {
                    // Устанавливаем приоритет загрузки для всех видео
                    videoElement.preload = "auto"

                    console.log(
                      `[PlayPause] Запускаем воспроизведение видео ${parallelVideo.id} (источник: ${source || "неизвестен"})`,
                    )

                    return videoElement.play().catch((err) => {
                      if (err.name !== "AbortError") {
                        console.error(
                          `[PlayPause] Ошибка при синхронном воспроизведении видео ${parallelVideo.id}:`,
                          err,
                        )
                      }
                    })
                  }
                }
                return Promise.resolve()
              })

              // Не ждем завершения всех промисов, чтобы не блокировать интерфейс
              // Просто логируем результат
              await Promise.all(playPromises)
              console.log(`[PlayPause] Все видео успешно запущены синхронно`)
            } catch (err) {
              console.error(`[PlayPause] Ошибка при синхронном запуске видео:`, err)
            }
          })
        } else {
          // Если нужно поставить на паузу, останавливаем все видео одновременно
          console.log(`[PlayPause] Останавливаем все видео в шаблоне`)

          // Используем requestAnimationFrame для остановки всех видео в одном кадре отрисовки
          requestAnimationFrame(() => {
            // Создаем массив уникальных видео для остановки
            const uniqueVideos = parallelVideos.filter(
              (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
            )

            console.log(`[PlayPause] Останавливаем ${uniqueVideos.length} уникальных видео`)

            uniqueVideos.forEach((parallelVideo) => {
              if (parallelVideo.id && videoRefs[parallelVideo.id]) {
                const parallelVideoElement = videoRefs[parallelVideo.id]

                // Если видео воспроизводится, ставим на паузу
                if (!parallelVideoElement.paused) {
                  console.log(`[PlayPause] Ставим на паузу видео ${parallelVideo.id} в шаблоне`)
                  parallelVideoElement.pause()
                }
              }
            })
          })
        }
      }
      // Если нет шаблона, управляем только активным видео
      else if (hasActiveVideo && videoElement && document.body.contains(videoElement)) {
        if (isPlaying) {
          // Если видео на паузе, запускаем воспроизведение
          if (videoElement.paused) {
            // Используем setTimeout с минимальной задержкой для предотвращения конфликта с другими операциями
            setTimeout(() => {
              // Проверяем, что видео элемент все еще существует и доступен
              // и что не началось новое переключение камеры
              if (
                videoElement &&
                document.body.contains(videoElement) &&
                isPlaying &&
                !isChangingCamera &&
                !isCameraChangeLockRef.current
              ) {
                // Проверяем готовность видео к воспроизведению
                if (videoElement.readyState >= 3 || isVideoReady(video.id)) {
                  // HAVE_FUTURE_DATA или выше - видео готово к воспроизведению
                  console.log(`[PlayPause] Запускаем воспроизведение для видео ${video.id}`)
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[PlayPause] Ошибка при воспроизведении:", err)
                      setIsPlaying(false)
                    }
                  })
                } else {
                  // Если видео не готово, добавляем одноразовый слушатель для запуска
                  console.log(`[PlayPause] Видео ${video.id} не готово, ожидаем событие canplay`)

                  // Функция для проверки готовности видео
                  const checkVideoReady = () => {
                    if (videoElement.readyState >= 3 || isVideoReady(video.id)) {
                      console.log(
                        `[PlayPause] Видео ${video.id} готово к воспроизведению после ожидания`,
                      )
                      if (isPlaying && !isChangingCamera && !isCameraChangeLockRef.current) {
                        videoElement.play().catch((err: Error) => {
                          if (err.name !== "AbortError") {
                            console.error("[PlayPause] Ошибка при отложенном воспроизведении:", err)
                            setIsPlaying(false)
                          }
                        })
                      }
                      clearInterval(checkInterval)
                    }
                  }

                  // Запускаем интервал для проверки готовности видео с более частыми проверками
                  const checkInterval = setInterval(checkVideoReady, 50)

                  // Устанавливаем таймаут для остановки интервала, если видео не будет готово в течение 10 секунд
                  setTimeout(() => {
                    clearInterval(checkInterval)
                    console.log(`[PlayPause] Превышено время ожидания готовности видео ${video.id}`)
                  }, 10000)
                }
              }
            }, 10) // Уменьшаем задержку для более быстрого запуска
          }
        } else {
          // Если видео воспроизводится, ставим на паузу
          if (!videoElement.paused) {
            console.log(`[PlayPause] Ставим на паузу видео ${video.id}`)
            videoElement.pause()
          }
        }
      } else {
        console.log(
          `[PlayPause] Видео элемент ${hasActiveVideo ? video.id : "неизвестно"} не найден или удален из DOM`,
        )
      }
    } else {
      console.log(
        `[PlayPause] Пропускаем изменение состояния воспроизведения во время переключения камеры или блокировки`,
      )
    }

    // Сбрасываем флаг обработки через небольшую задержку
    setTimeout(() => {
      isHandlingPlayPauseEffectRef.current = false
    }, 300)
  }, [
    isPlaying,
    video?.id,
    videoRefs,
    isChangingCamera,
    setIsPlaying,
    parallelVideos,
    setParallelVideos,
  ])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === "p" && video?.id) {
        // Сохраняем текущее время перед паузой
        if (isPlaying && video?.id && videoRefs[video.id]) {
          const videoElement = videoRefs[video.id]
          // Сохраняем текущее время в lastSentTimeRef и videoTimesRef
          const currentVideoTime = videoElement.currentTime
          lastSentTimeRef.current = currentVideoTime
          videoTimesRef.current[video.id] = currentVideoTime

          // Сохраняем время для текущего сектора
          if (currentSectorRef.current) {
            sectorTimesRef.current[currentSectorRef.current] = currentVideoTime
            console.log(
              `[KeyPress] Сохраняем время для сектора ${currentSectorRef.current}: ${currentVideoTime.toFixed(3)}`,
            )
          }

          console.log(`[KeyPress] Сохраняем время перед паузой: ${currentVideoTime.toFixed(3)}`)
        }

        // Переключаем состояние воспроизведения
        setIsPlaying(!isPlaying)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, video?.id, setIsPlaying, videoRefs])

  // Определяем, какое видео активно
  // Если есть активное видео, используем его ID
  // Если нет активного видео, но есть примененный шаблон с видео, используем ID первого видео из шаблона
  const activeId = video
    ? video.id
    : appliedTemplate?.videos && appliedTemplate.videos.length > 0
      ? appliedTemplate.videos[0].id
      : null

  // Логируем информацию о параллельных видео для отладки
  console.log(
    `[MediaPlayer] Параллельные видео: ${parallelVideos.length}, активное видео ID: ${activeId}`,
  )

  // Определяем, какие видео нужно отображать в зависимости от шаблона
  const [videosToDisplay, setVideosToDisplay] = useState<MediaFile[]>([])

  // Получаем функции из контекста плеера
  const { setActiveVideoId, setVideo, setAppliedTemplate } = usePlayerContext()

  // Эффект для инициализации видео из браузера при загрузке страницы
  useEffect(() => {
    // Выполняем только на клиенте и только при первом рендере
    if (typeof window !== "undefined") {
      // Проверяем, выбран ли источник "media" (браузер)
      if (preferredSource === "media") {
        console.log("[MediaPlayer] Инициализация: выбран источник 'media' (браузер)")

        // Всегда пытаемся найти и отобразить видео из браузера
        if (true) {
          console.log("[MediaPlayer] Инициализация: ищем видео из браузера для отображения")

          // Сначала помечаем все параллельные видео как видео из браузера
          if (parallelVideos.length > 0) {
            console.log(
              `[MediaPlayer] Помечаем все параллельные видео (${parallelVideos.length}) как видео из браузера`,
            )
            parallelVideos.forEach((v) => {
              if (v.id) {
                setVideoSource(v.id, "media")
              }
            })
          }

          // Находим видео из браузера
          const browserVideos = parallelVideos

          // Если есть видео из браузера
          if (browserVideos.length > 0) {
            console.log(
              `[MediaPlayer] Инициализация: найдено ${browserVideos.length} видео из браузера`,
            )

            // Проверяем, есть ли примененный шаблон
            if (appliedTemplate) {
              console.log(
                `[MediaPlayer] Инициализация: есть примененный шаблон, заполняем его видео из браузера`,
              )

              // Создаем копию шаблона
              const templateCopy = JSON.parse(JSON.stringify(appliedTemplate))

              // Заполняем шаблон видео из браузера
              templateCopy.videos = browserVideos.slice(0, templateCopy.template?.screens || 1)

              console.log(
                `[MediaPlayer] Инициализация: добавлено ${templateCopy.videos.length} видео из браузера в шаблон`,
              )

              // Применяем обновленный шаблон
              setAppliedTemplate(templateCopy)

              // Устанавливаем первое видео из браузера как активное
              setActiveVideoId(browserVideos[0].id)
              setVideo(browserVideos[0])
              console.log(
                `[MediaPlayer] Инициализация: установлено активное видео из браузера: ${browserVideos[0].id}`,
              )
            } else {
              // Если нет шаблона, просто устанавливаем первое видео из браузера как активное
              const firstBrowserVideo = browserVideos[0]
              console.log(
                `[MediaPlayer] Инициализация: устанавливаем видео ${firstBrowserVideo.id} как активное`,
              )

              setActiveVideoId(firstBrowserVideo.id)
              setVideo(firstBrowserVideo)
            }
          }
          // Если нет видео из браузера, но есть параллельные видео, устанавливаем первое как активное
          // и помечаем его как видео из браузера
          else if (parallelVideos.length > 0) {
            console.log(
              `[MediaPlayer] Инициализация: нет видео из браузера, используем первое параллельное видео`,
            )

            const firstVideo = parallelVideos[0]
            console.log(
              `[MediaPlayer] Инициализация: устанавливаем видео ${firstVideo.id} как активное`,
            )

            // Устанавливаем видео как активное
            setActiveVideoId(firstVideo.id)
            setVideo(firstVideo)

            // Помечаем видео как видео из браузера
            if (firstVideo.id) {
              setVideoSource(firstVideo.id, "media")
            }
          }
          // Если нет ни видео из браузера, ни параллельных видео, но есть активное видео
          else if (video) {
            console.log(
              `[MediaPlayer] Инициализация: нет видео из браузера и параллельных видео, используем активное видео`,
            )

            // Помечаем активное видео как видео из браузера
            if (video.id) {
              setVideoSource(video.id, "media")
            }
          }
        }
      }
    }
  }, [
    preferredSource,
    video,
    parallelVideos,
    videoSources,
    appliedTemplate,
    setAppliedTemplate,
    setActiveVideoId,
    setVideo,
    setVideoSource,
  ])

  // Эффект для обновления списка видео для отображения
  useEffect(() => {
    let newVideosToDisplay: MediaFile[] = []

    // Используем значение из контекста плеера
    const storedPreferredSource = preferredSource || "timeline"

    // Если есть примененный шаблон
    if (appliedTemplate?.template) {
      // Если в шаблоне есть видео, используем их
      if (appliedTemplate.videos && appliedTemplate.videos.length > 0) {
        // Создаем новый массив, чтобы избежать мутации исходного массива
        newVideosToDisplay = [...appliedTemplate.videos]
        console.log(`[MediaPlayer] Используем ${newVideosToDisplay.length} видео из шаблона`)
      }
      // Если в шаблоне нет видео, но есть параллельные видео, используем их с учетом предпочтительного источника
      else if (parallelVideos.length > 0) {
        // Фильтруем видео по источнику, если есть информация о источниках
        let filteredVideos = parallelVideos

        if (videoSources && Object.keys(videoSources).length > 0) {
          filteredVideos = parallelVideos.filter((v) => {
            // Если нет информации о источнике для этого видео, включаем его
            if (!v.id || !videoSources[v.id]) return true

            // Включаем только видео из предпочтительного источника
            return videoSources[v.id] === storedPreferredSource
          })

          console.log(
            `[MediaPlayer] Отфильтровано ${filteredVideos.length} видео из ${parallelVideos.length} по источнику ${storedPreferredSource}`,
          )
        }

        // Создаем новый массив с уникальными видео, чтобы избежать дубликатов
        const uniqueVideos = filteredVideos.filter(
          (v, i, arr) => arr.findIndex((item) => item.id === v.id) === i,
        )

        // Берем только нужное количество видео для шаблона
        newVideosToDisplay = uniqueVideos.slice(0, appliedTemplate.template.screens || 1)
        console.log(
          `[MediaPlayer] Используем ${newVideosToDisplay.length} параллельных видео для шаблона`,
        )
      }
      // Если есть активное видео и оно из предпочтительного источника, добавляем его
      else if (
        video &&
        (!videoSources || !video.id || videoSources[video.id] === storedPreferredSource)
      ) {
        newVideosToDisplay = [video]
        console.log(`[MediaPlayer] Используем активное видео ${video.id} для шаблона`)
      }
      // Иначе оставляем пустой список видео (шаблон будет показан с черными ячейками)
      else {
        console.log(`[MediaPlayer] Шаблон будет показан с пустыми ячейками (черный экран)`)
      }
    }
    // Если нет примененного шаблона, но есть активное видео из предпочтительного источника
    else if (
      video &&
      (!videoSources || !video.id || videoSources[video.id] === storedPreferredSource)
    ) {
      newVideosToDisplay = [video]
      console.log(`[MediaPlayer] Используем активное видео ${video.id}`)
    }
    // Если нет примененного шаблона и нет активного видео из предпочтительного источника,
    // но есть параллельные видео из предпочтительного источника
    else if (parallelVideos.length > 0 && storedPreferredSource === "media") {
      // Фильтруем видео по источнику
      const filteredVideos = parallelVideos.filter((v) => {
        // Если нет информации о источнике для этого видео, включаем его
        if (!v.id || !videoSources[v.id]) return true

        // Включаем только видео из предпочтительного источника
        return videoSources[v.id] === storedPreferredSource
      })

      if (filteredVideos.length > 0) {
        newVideosToDisplay = [filteredVideos[0]]
        console.log(`[MediaPlayer] Используем первое видео из браузера ${filteredVideos[0].id}`)
      }
    }

    // Добавляем активное видео в список только если оно не включено, нет шаблона и оно из предпочтительного источника
    if (
      video &&
      !newVideosToDisplay.some((v) => v.id === video.id) &&
      !appliedTemplate?.template &&
      (!videoSources || !video.id || videoSources[video.id] === storedPreferredSource)
    ) {
      console.log(`[MediaPlayer] Добавляем активное видео ${video.id} в список для отображения`)
      newVideosToDisplay.push(video)
    }

    // Обновляем состояние
    setVideosToDisplay(newVideosToDisplay)
  }, [appliedTemplate, video, parallelVideos, activeId, videoSources, preferredSource])

  // Эффект для применения шаблона с учетом источника видео
  useEffect(() => {
    if (!appliedTemplate?.template) return

    console.log(`[MediaPlayer] Применяем шаблон: ${appliedTemplate.template.id}`)
    console.log(`[MediaPlayer] Активное видео ID: ${activeId}`)
    console.log(`[MediaPlayer] Соотношение сторон: ${JSON.stringify(aspectRatio)}`)

    // Определяем источник видео для шаблона
    // Если активное видео из таймлайна (имеет startTime), используем видео из таймлайна
    // Иначе используем видео из браузера
    const useTimelineVideos = video?.startTime !== undefined
    console.log(
      `[MediaPlayer] Используем видео из ${useTimelineVideos ? "таймлайна" : "браузера"} для шаблона`,
    )

    // Создаем копию видео из шаблона
    let templateVideos = [...(appliedTemplate.videos || [])]

    // Если в шаблоне нет видео, но есть активное видео, добавляем его в шаблон
    if (templateVideos.length === 0 && video) {
      console.log(`[MediaPlayer] Добавляем активное видео ${video.id} в шаблон`)
      templateVideos = [video]
    }

    // Если в шаблоне меньше видео, чем нужно для шаблона, добавляем параллельные видео
    if (
      templateVideos.length < (appliedTemplate.template.screens || 1) &&
      parallelVideos.length > 0
    ) {
      console.log(
        `[MediaPlayer] Добавляем параллельные видео в шаблон (${templateVideos.length}/${appliedTemplate.template.screens})`,
      )

      // Фильтруем параллельные видео в зависимости от источника
      const filteredParallelVideos = parallelVideos.filter((v) => {
        const isTimelineVideo = v.startTime !== undefined
        // Используем только видео из того же источника, что и активное видео
        return useTimelineVideos === isTimelineVideo
      })

      console.log(
        `[MediaPlayer] Отфильтровано ${filteredParallelVideos.length} видео из ${parallelVideos.length} по источнику`,
      )

      // Добавляем только недостающие видео
      const missingCount = (appliedTemplate.template.screens || 1) - templateVideos.length
      const additionalVideos = filteredParallelVideos
        .filter((v) => !templateVideos.some((av) => av.id === v.id))
        .slice(0, missingCount)

      templateVideos = [...templateVideos, ...additionalVideos]
      console.log(
        `[MediaPlayer] Добавлено ${additionalVideos.length} параллельных видео в шаблон, всего: ${templateVideos.length}`,
      )
    }

    // Обновляем видео в шаблоне
    appliedTemplate.videos = templateVideos
  }, [appliedTemplate, video, parallelVideos, activeId, aspectRatio])

  // Предварительно загружаем все видео для более быстрого запуска
  useEffect(() => {
    if (videosToDisplay.length > 0) {
      console.log(`[MediaPlayer] Предварительная загрузка ${videosToDisplay.length} видео`)

      // Для каждого видео в списке
      const preloadVideos = async () => {
        // Сначала создаем все видео элементы, если они еще не созданы
        for (const videoItem of videosToDisplay) {
          if (videoItem && videoItem.id && videoItem.path && !videoRefs[videoItem.id]) {
            console.log(`[MediaPlayer] Создаем видео элемент для ${videoItem.id} заранее`)

            // Создаем видео элемент программно
            const videoElement = document.createElement("video")
            videoElement.id = `video-${videoItem.id}`
            videoElement.preload = "auto"
            videoElement.playsInline = true
            videoElement.controls = false
            videoElement.autoplay = false
            videoElement.loop = false
            videoElement.muted = false
            videoElement.volume = volume
            videoElement.src = videoItem.path
            console.log(
              `[MediaPlayer] Создан видео элемент для ${videoItem.id} с громкостью ${volume}`,
            )

            // Добавляем элемент в DOM (скрытый)
            videoElement.style.position = "absolute"
            videoElement.style.width = "1px"
            videoElement.style.height = "1px"
            videoElement.style.opacity = "0"
            videoElement.style.pointerEvents = "none"
            document.body.appendChild(videoElement)

            // Сохраняем ссылку на элемент
            videoRefs[videoItem.id] = videoElement

            // Определяем источник видео
            const source = videoItem.startTime !== undefined ? "timeline" : "media"
            setVideoSource(videoItem.id, source)
            console.log(
              `[MediaPlayer] Видео ${videoItem.id} предварительно создано и определено как ${source}`,
            )

            // Начинаем загрузку
            videoElement.load()
          }
        }

        // Создаем массив промисов для загрузки видео
        const loadPromises = videosToDisplay.map((videoItem) => {
          return new Promise<void>((resolve) => {
            if (videoItem.id && videoItem.path) {
              // Если видео элемент уже существует, проверяем его готовность
              if (videoRefs[videoItem.id]) {
                const videoElement = videoRefs[videoItem.id]

                // Если видео еще не загружено, запускаем загрузку
                if (videoElement.readyState < 3) {
                  console.log(`[MediaPlayer] Предварительная загрузка видео ${videoItem.id}`)

                  // Устанавливаем атрибуты для предварительной загрузки
                  videoElement.preload = "auto"

                  // Если src не установлен или отличается от пути видео, устанавливаем его
                  if (!videoElement.src || !videoElement.src.includes(videoItem.id)) {
                    videoElement.src = videoItem.path
                    videoElement.load()

                    // Добавляем обработчик события canplaythrough для отслеживания загрузки
                    const handleCanPlayThrough = () => {
                      console.log(
                        `[MediaPlayer] Видео ${videoItem.id} полностью загружено и готово к воспроизведению`,
                      )
                      videoElement.removeEventListener("canplaythrough", handleCanPlayThrough)
                      resolve()
                    }

                    // Если видео уже загружено, сразу резолвим промис
                    if (videoElement.readyState >= 3) {
                      resolve()
                    } else {
                      videoElement.addEventListener("canplaythrough", handleCanPlayThrough, {
                        once: true,
                      })

                      // Добавляем таймаут на случай, если событие не сработает
                      setTimeout(() => {
                        videoElement.removeEventListener("canplaythrough", handleCanPlayThrough)
                        console.log(
                          `[MediaPlayer] Таймаут предварительной загрузки видео ${videoItem.id}`,
                        )
                        resolve()
                      }, 8000) // Увеличиваем таймаут до 8 секунд
                    }
                  } else {
                    resolve()
                  }
                } else {
                  resolve()
                }
              } else {
                resolve()
              }
            } else {
              resolve()
            }
          })
        })

        // Ждем загрузки всех видео
        try {
          await Promise.all(loadPromises)
          console.log(`[MediaPlayer] Все видео предварительно загружены`)
        } catch (err) {
          console.error(`[MediaPlayer] Ошибка при предварительной загрузке видео:`, err)
        }
      }

      // Запускаем предварительную загрузку
      preloadVideos()
    }
  }, [videosToDisplay, videoRefs])

  // Логируем информацию о видео для отладки
  console.log(
    `[MediaPlayer] Видео для отображения: ${videosToDisplay.length}, шаблон: ${appliedTemplate?.template?.id || "нет"}`,
  )

  // Подробное логирование видео для отладки
  if (videosToDisplay.length > 0) {
    console.log("[MediaPlayer] Детали видео для отображения:")
    videosToDisplay.forEach((v, i) => {
      console.log(
        `[MediaPlayer] Видео ${i + 1}/${videosToDisplay.length}: id=${v.id}, path=${v.path}, name=${v.name}`,
      )
    })
  }

  // Логируем информацию о параллельных видео и активном видео
  console.log(
    `[MediaPlayer] Параллельные видео: ${parallelVideos.map((v) => v.id).join(", ")}, активное видео: ${activeId}`,
  )

  // Вычисляем соотношение сторон для AspectRatio
  const aspectRatioValue = aspectRatio.width / aspectRatio.height

  // Вычисляем стили для контейнера видео
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }

  // Логируем информацию о шаблоне и видео для отладки
  console.log("[MediaPlayer] Применяем шаблон:", appliedTemplate?.template)
  console.log("[MediaPlayer] Видео для отображения:", videosToDisplay)
  console.log("[MediaPlayer] Активное видео ID:", activeId)
  console.log("[MediaPlayer] Соотношение сторон:", aspectRatio)

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative flex-1 bg-black" style={containerStyle}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="max-h-[calc(100%-85px)] w-full max-w-[100%]">
            <AspectRatio ratio={aspectRatioValue} className="bg-black">
              <div className="relative h-full w-full">
                {videosToDisplay && videosToDisplay.length > 0 ? (
                  // Если есть видео для отображения
                  <div className="h-full w-full">
                    {/* Если есть примененный шаблон и он настраиваемый, используем ResizableTemplate */}
                    {appliedTemplate?.template && appliedTemplate.template.resizable ? (
                      <ResizableTemplate
                        appliedTemplate={appliedTemplate}
                        videos={videosToDisplay}
                        activeVideoId={activeId}
                        videoRefs={videoRefs}
                      />
                    ) : (
                      // Иначе используем стандартный подход с абсолютным позиционированием
                      videosToDisplay.map((videoItem, index) => {
                        // Получаем стили для видео в зависимости от шаблона
                        const videoStyle: VideoTemplateStyle = appliedTemplate?.template
                          ? getVideoStyleForTemplate(
                            appliedTemplate.template,
                            index,
                            videosToDisplay.length,
                          )
                          : {
                            position: "absolute" as const,
                            top: "0",
                            left: "0",
                            width: "100%",
                            height: "100%",
                            display: videoItem.id === activeId ? "block" : "none",
                          }

                        // Логируем стили для отладки
                        console.log(
                          `[MediaPlayer] Стили для видео ${videoItem.id} (индекс ${index}):`,
                          videoStyle,
                        )

                        // Если используется шаблон, применяем ResizableVideo
                        if (appliedTemplate?.template) {
                          // Добавляем отладочный вывод
                          console.log(
                            `[MediaPlayer] Применяем шаблон ${appliedTemplate.template.id}, resizable: ${appliedTemplate.template.resizable}, split: ${appliedTemplate.template.split}`,
                          )
                          // Создаем компонент-обертку для ResizableVideo
                          const ResizableVideoWrapper = () => {
                            // Создаем ref для контейнера, если его еще нет
                            if (!videoContainerRefs.current[`${videoItem.id}-${index}`]) {
                              videoContainerRefs.current[`${videoItem.id}-${index}`] =
                                React.createRef<HTMLDivElement>()
                            }

                            // Получаем ref для контейнера
                            const containerRef =
                              videoContainerRefs.current[`${videoItem.id}-${index}`]

                            return (
                              <div
                                className="absolute"
                                style={{
                                  ...videoStyle,
                                  display: videoItem.path ? "block" : "none", // Показываем только видео с путем
                                  border: "1px solid #38dacac3", // Добавляем рамку для отладки
                                  overflow: "visible", // Убираем overflow: hidden
                                }}
                                data-video-id={videoItem.id} // Добавляем атрибут для отладки
                                ref={containerRef}
                              >
                                {videoItem && videoItem.path ? (
                                  <ResizableVideo
                                    video={videoItem}
                                    isActive={videoItem.id === activeId}
                                    videoRefs={videoRefs}
                                    index={index}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-black">
                                    <span className="text-white">
                                      {t("timeline.player.videoUnavailable", "Видео недоступно")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          }

                          return <ResizableVideoWrapper key={`wrapper-${videoItem.id}-${index}`} />
                        }

                        // Если шаблон не используется, используем стандартный подход
                        // Проверяем, не является ли это видео дубликатом (одно и то же видео может быть в списке дважды)
                        // Это может вызывать бесконечный цикл обновлений
                        const isDuplicate =
                          videosToDisplay.findIndex((v) => v.id === videoItem.id) !== index
                        if (isDuplicate) {
                          console.log(
                            `[MediaPlayer] Пропускаем дублирующееся видео ${videoItem.id} в индексе ${index}`,
                          )
                          return null
                        }

                        return (
                          <video
                            key={`${videoItem.id}-${index}`} // Добавляем индекс к ключу, чтобы сделать его уникальным
                            ref={(el) => {
                              if (
                                el &&
                                (!videoRefs[videoItem.id] || videoRefs[videoItem.id] !== el)
                              ) {
                                console.log(
                                  `[MediaPlayer] Монтирование видео элемента ${videoItem.id}`,
                                )

                                videoRefs[videoItem.id] = el

                                // Определяем источник видео (по умолчанию считаем, что это медиа машина)
                                // Если видео имеет startTime, то это видео из таймлайна
                                const source =
                                  videoItem.startTime !== undefined ? "timeline" : "media"
                                setVideoSource(videoItem.id, source)
                                console.log(
                                  `[MediaPlayer] Видео ${videoItem.id} определено как ${source}`,
                                )

                                // Проверяем, что путь к видео существует
                                if (videoItem.path) {
                                  console.log(
                                    `[MediaPlayer] Устанавливаем src для видео ${videoItem.id}: ${videoItem.path}`,
                                  )
                                  el.src = videoItem.path
                                  el.load()
                                } else {
                                  console.error(
                                    `[MediaPlayer] Ошибка: путь к видео ${videoItem.id} не определен`,
                                  )
                                }

                                // Устанавливаем обработчик загрузки метаданных
                                el.onloadedmetadata = () => {
                                  console.log(
                                    `[MediaPlayer] Метаданные загружены для видео ${videoItem.id}`,
                                  )
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 1), // HAVE_METADATA
                                  }))
                                }

                                // Устанавливаем обработчик загрузки данных
                                el.onloadeddata = () => {
                                  console.log(
                                    `[MediaPlayer] Данные загружены для видео ${videoItem.id}`,
                                  )
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 2), // HAVE_CURRENT_DATA
                                  }))
                                }

                                // Устанавливаем обработчик для события canplay
                                el.oncanplay = () => {
                                  console.log(
                                    `[MediaPlayer] Видео ${videoItem.id} может начать воспроизведение`,
                                  )
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 3), // HAVE_FUTURE_DATA
                                  }))
                                }

                                // Устанавливаем обработчик для события canplaythrough
                                el.oncanplaythrough = () => {
                                  console.log(
                                    `[MediaPlayer] Видео ${videoItem.id} может воспроизводиться без буферизации`,
                                  )
                                  // Обновляем состояние готовности видео
                                  setVideoReadyState((prev) => ({
                                    ...prev,
                                    [videoItem.id]: Math.max(prev[videoItem.id] || 0, 4), // HAVE_ENOUGH_DATA
                                  }))
                                }

                                // Устанавливаем обработчик ошибок напрямую
                                el.onerror = (e) => {
                                  console.error(`[Video] Ошибка видео ${videoItem.id}:`, e)

                                  // Если это активное видео, сбрасываем флаг воспроизведения
                                  if (videoItem.id === activeId) {
                                    setIsPlaying(false)

                                    // Сбрасываем флаг isChangingCamera при ошибке
                                    if (isChangingCamera) {
                                      setIsChangingCamera(false)
                                    }
                                  }

                                  // Пробуем перезагрузить видео
                                  try {
                                    if (videoItem.path) {
                                      console.log(
                                        `[Video] Пробуем перезагрузить видео ${videoItem.id}`,
                                      )
                                      el.src = videoItem.path
                                      el.load()
                                    }
                                  } catch (loadError) {
                                    console.error(
                                      `[Video] Ошибка при перезагрузке видео ${videoItem.id}:`,
                                      loadError,
                                    )
                                  }
                                }
                              }
                            }}
                            src={videoItem.path || ""}
                            className="object-contain"
                            style={{
                              ...videoStyle,
                              // Всегда показываем видео, если оно есть в шаблоне или является активным
                              display:
                                videoItem.path &&
                                (appliedTemplate?.template || videoItem.id === activeId)
                                  ? "block"
                                  : "none",
                            }}
                            data-video-id={videoItem.id} // Добавляем атрибут для отладки
                            onClick={handlePlayPause}
                            playsInline
                            preload="auto"
                            controls={false}
                            autoPlay={false}
                            loop={false}
                            disablePictureInPicture
                            muted={false} // Звук у всех видео
                            onLoadedData={() =>
                              console.log(
                                `[MediaPlayer] Видео ${videoItem.id} загружено и готово к воспроизведению`,
                              )
                            }
                          />
                        )
                      })
                    )}
                  </div>
                ) : (
                  // Если нет видео для отображения
                  <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-black">
                    <span className="text-lg text-white">{noVideoText}</span>
                  </div>
                )}
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      <PlayerControls currentTime={currentTime} videoSources={videoSources} />
    </div>
  )
}

MediaPlayer.displayName = "MediaPlayer"
