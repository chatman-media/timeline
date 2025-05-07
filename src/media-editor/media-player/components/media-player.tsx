import { useEffect, useRef } from "react"

import { usePlayerContext } from "@/media-editor/media-player"
import { PlayerControls } from "@/media-editor/media-player/components/player-controls"

export function MediaPlayer() {
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
    videoRefs,
  } = usePlayerContext()

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

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Сохраняем текущее время перед паузой
    if (isPlaying && video?.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]
      // Сохраняем текущее время в lastSentTimeRef и videoTimesRef
      const currentVideoTime = videoElement.currentTime
      lastSentTimeRef.current = currentVideoTime
      videoTimesRef.current[video.id] = currentVideoTime
      console.log(`[MediaPlayer] Сохраняем время перед паузой: ${currentVideoTime.toFixed(3)}`)
    }

    // Переключаем состояние воспроизведения
    setIsPlaying(!isPlaying)
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
      const videoElement = videoRefs[video.id]
      if (videoElement) {
        console.log(`[MediaPlayer] Видео элемент ${video.id} готов к использованию`)

        // Проверяем, что src установлен правильно
        if (!videoElement.src || !videoElement.src.includes(video.id)) {
          // Проверяем, что путь к видео существует
          if (video.path) {
            console.log(`[MediaPlayer] Устанавливаем src для видео ${video.id}: ${video.path}`)
            videoElement.src = video.path
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
            // Проверяем, есть ли сохраненный прогресс и инициализирован ли плеер
            if (
              isInitializedRef.current &&
              lastSentTimeRef.current > 0 &&
              lastSentTimeRef.current < 100000
            ) {
              // Используем lastSentTimeRef для восстановления прогресса воспроизведения
              localTime = lastSentTimeRef.current
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

          // Сбрасываем флаг isChangingCamera после загрузки метаданных
          // Используем setTimeout, чтобы избежать бесконечного цикла обновлений
          if (isChangingCamera && !autoResetTimerRef.current) {
            console.log(`[MediaPlayer] Сброс флага isChangingCamera после загрузки метаданных`)
            setIsChangingCamera(false)
          }
        }

        // Добавляем обработчик ошибок
        const handleError = () => {
          console.error(`[MediaPlayer] Ошибка загрузки видео ${video.id}:`, videoElement.error)

          // Сбрасываем флаг isChangingCamera при ошибке
          if (isChangingCamera) {
            setIsChangingCamera(false)
          }

          // Сбрасываем флаг воспроизведения
          if (isPlaying) {
            setIsPlaying(false)
          }

          // Пробуем перезагрузить видео
          try {
            if (video.path) {
              console.log(`[MediaPlayer] Пробуем перезагрузить видео ${video.id}`)
              videoElement.src = video.path
              videoElement.load()
            }
          } catch (loadError) {
            console.error(`[MediaPlayer] Ошибка при перезагрузке видео ${video.id}:`, loadError)
          }
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
        console.error(`[MediaPlayer] Видео элемент ${video.id} не найден после таймаута`)
        // Сбрасываем флаг isChangingCamera при ошибке
        setIsChangingCamera(false)
      }
    }, 200) // Увеличиваем задержку для гарантии монтирования

    return () => {
      clearTimeout(timer)
    }
  }, [video?.id, video?.path, videoRefs, currentTime, setIsChangingCamera])

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
            const refreshedElement = videoRefs[video.id]
            if (refreshedElement && document.body.contains(refreshedElement)) {
              console.log("[PlayVideo] Повторная попытка воспроизведения после задержки")

              if (isPlaying) {
                refreshedElement.play().catch((err) => {
                  if (err.name !== "AbortError") {
                    console.error("[PlayVideo] Ошибка при повторной попытке:", err)
                  }
                })
              }
            }
          }, 300)

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
            // Проверяем, есть ли сохраненное время для этого видео
            if (videoTimesRef.current[video.id] !== undefined) {
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

        // Сохраняем текущее состояние воспроизведения
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
                setIsPlaying(true)
                try {
                  videoElement.play().catch((err: Error) => {
                    if (err.name !== "AbortError") {
                      console.error("[ChangingCamera] Ошибка воспроизведения при записи:", err)
                    }
                  })
                } catch (error) {
                  console.error(
                    "[ChangingCamera] Ошибка при воспроизведении во время записи:",
                    error,
                  )
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
  ])

  // Эффект для обработки изменения состояния воспроизведения
  useEffect(() => {
    if (!video?.id) return

    // Получаем видео элемент
    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Сохраняем текущее время видео перед изменением состояния воспроизведения
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

    // Обрабатываем изменение состояния воспроизведения без установки флага isChangingCamera
    // Проверяем, не находимся ли мы в процессе переключения камеры или блокировки
    if (!isChangingCamera && !isCameraChangeLockRef.current) {
      // Проверяем, что видео элемент существует и доступен
      if (videoElement && document.body.contains(videoElement)) {
        if (isPlaying) {
          // Если видео на паузе, запускаем воспроизведение
          if (videoElement.paused) {
            // Используем setTimeout для предотвращения конфликта с другими операциями
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
                console.log(`[PlayPause] Запускаем воспроизведение для видео ${video.id}`)
                videoElement.play().catch((err: Error) => {
                  if (err.name !== "AbortError") {
                    console.error("[PlayPause] Ошибка при воспроизведении:", err)
                    setIsPlaying(false)
                  }
                })
              }
            }, 100) // Увеличиваем задержку для большей надежности
          }
        } else {
          // Если видео воспроизводится, ставим на паузу
          if (!videoElement.paused) {
            console.log(`[PlayPause] Ставим на паузу видео ${video.id}`)
            videoElement.pause()
          }
        }
      } else {
        console.log(`[PlayPause] Видео элемент ${video?.id} не найден или удален из DOM`)
      }
    } else {
      console.log(
        `[PlayPause] Пропускаем изменение состояния воспроизведения во время переключения камеры или блокировки`,
      )
    }
  }, [isPlaying, video?.id, videoRefs, isChangingCamera, setIsPlaying])

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

  if (!video?.id) return null

  // Для видео всегда возвращаем true, чтобы оно отображалось
  // Это предотвращает проблемы с отображением при разных типах времени
  const isTimeInRange = true

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative flex-1 bg-black">
        {isTimeInRange ? (
          <video
            // Удаляем key, чтобы предотвратить пересоздание элемента при каждом рендере
            ref={(el) => {
              if (el && (!videoRefs[video.id] || videoRefs[video.id] !== el)) {
                console.log(`[MediaPlayer] Монтирование видео элемента ${video.id}`)

                // Очищаем старые видео при создании нового
                Object.keys(videoRefs).forEach((key) => {
                  if (key !== video.id && videoRefs[key]) {
                    try {
                      // Сохраняем текущее время видео перед очисткой
                      if (videoRefs[key].currentTime > 0) {
                        videoTimesRef.current[key] = videoRefs[key].currentTime
                        console.log(
                          `[MediaPlayer] Сохраняем время для видео ${key} перед очисткой: ${videoRefs[key].currentTime.toFixed(3)}`,
                        )
                      }

                      // Останавливаем воспроизведение
                      videoRefs[key].pause()

                      // Удаляем обработчики событий
                      videoRefs[key].onloadedmetadata = null
                      videoRefs[key].onerror = null
                      videoRefs[key].oncanplay = null

                      // Очищаем источник
                      videoRefs[key].removeAttribute("src")
                      videoRefs[key].load()

                      // Удаляем ссылку на элемент
                      delete videoRefs[key]

                      console.log(`[MediaPlayer] Очищен видео элемент ${key}`)
                    } catch (e) {
                      console.warn(`[MediaPlayer] Ошибка при очистке видео ${key}:`, e)
                    }
                  }
                })

                videoRefs[video.id] = el

                // Устанавливаем обработчик ошибок напрямую
                el.onerror = (e) => {
                  console.error(`[Video] Ошибка видео ${video.id}:`, e)

                  // Сбрасываем флаг воспроизведения
                  setIsPlaying(false)

                  // Сбрасываем флаг isChangingCamera при ошибке
                  if (isChangingCamera) {
                    setIsChangingCamera(false)
                  }

                  // Пробуем перезагрузить видео
                  try {
                    if (video.path) {
                      console.log(`[Video] Пробуем перезагрузить видео ${video.id}`)
                      el.src = video.path
                      el.load()
                    }
                  } catch (loadError) {
                    console.error(`[Video] Ошибка при перезагрузке видео ${video.id}:`, loadError)
                  }
                }
              }
            }}
            src={video.path}
            className="absolute inset-0 h-full w-full object-contain"
            onClick={handlePlayPause}
            playsInline
            preload="auto"
            controls={false}
            autoPlay={false}
            loop={false}
            disablePictureInPicture
            muted={false}
            onLoadedData={() =>
              console.log(`[MediaPlayer] Видео ${video.id} загружено и готово к воспроизведению`)
            }
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-black" />
        )}
      </div>
      <PlayerControls currentTime={currentTime} />
    </div>
  )
}

MediaPlayer.displayName = "MediaPlayer"
