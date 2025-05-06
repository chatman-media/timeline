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

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Сохраняем текущее время перед паузой
    if (isPlaying && video?.id && videoRefs[video.id]) {
      const videoElement = videoRefs[video.id]
      // Сохраняем текущее время в lastSentTimeRef
      lastSentTimeRef.current = videoElement.currentTime
      console.log(
        `[MediaPlayer] Сохраняем время перед паузой: ${videoElement.currentTime.toFixed(3)}`,
      )
    }

    // Переключаем состояние воспроизведения
    setIsPlaying(!isPlaying)
  }

  // Эффект для обработки событий видео после монтирования
  useEffect(() => {
    if (!video?.id) return

    console.log(`[MediaPlayer] Инициализация видео ${video.id}, path: ${video.path}`)

    // Используем setTimeout, чтобы дать время для монтирования видео элемента
    const timer = setTimeout(() => {
      const videoElement = videoRefs[video.id]
      if (videoElement) {
        console.log(`[MediaPlayer] Видео элемент ${video.id} готов к использованию`)

        // Проверяем, что src установлен правильно
        if (!videoElement.src || !videoElement.src.includes(video.id)) {
          console.log(`[MediaPlayer] Устанавливаем src для видео ${video.id}: ${video.path}`)
          videoElement.src = video.path
        }

        // Добавляем обработчик события loadedmetadata
        const handleLoadedMetadata = () => {
          console.log(
            `[MediaPlayer] Метаданные видео ${video.id} загружены, длительность: ${videoElement.duration}s`,
          )

          // Устанавливаем локальное время для видео (без учета startTime)
          const localTime =
            currentTime > 365 * 24 * 60 * 60 && video.startTime
              ? Math.max(0, currentTime - (video.startTime || 0))
              : currentTime

          // Устанавливаем время
          if (Math.abs(videoElement.currentTime - localTime) > 0.1) {
            videoElement.currentTime = localTime
            console.log(`[MediaPlayer] Установлено начальное время: ${localTime.toFixed(3)}`)
          }
        }

        // Добавляем обработчик ошибок
        const handleError = () => {
          console.error(`[MediaPlayer] Ошибка загрузки видео ${video.id}:`, videoElement.error)
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
      }
    }, 200) // Увеличиваем задержку для гарантии монтирования

    return () => clearTimeout(timer)
  }, [video?.id, video?.path, videoRefs, currentTime])

  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Проверяем, изменилось ли видео
    if (currentVideoIdRef.current !== video.id) {
      console.log(`[MediaPlayer] Видео изменилось: ${currentVideoIdRef.current} -> ${video.id}`)

      // Сохраняем ID текущего видео
      currentVideoIdRef.current = video.id

      // Сбрасываем флаг инициализации при смене видео
      isInitializedRef.current = false

      // Сбрасываем время при смене видео только если это первая инициализация
      // или если меняется видео (не при повторном рендеринге того же видео)
      if (currentVideoIdRef.current !== null) {
        console.log(`[MediaPlayer] Сбрасываем сохраненный прогресс при смене видео`)
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

        // Если текущее глобальное время - Unix timestamp, сохраняем относительный прогресс
        if (currentTime > 365 * 24 * 60 * 60) {
          // Сохраняем относительный прогресс (без учета startTime)
          const relativeProgress = localVideoTime

          // Проверяем валидность времени
          if (isFinite(relativeProgress) && !isNaN(relativeProgress) && relativeProgress >= 0) {
            // Увеличиваем порог разницы времени для уменьшения частоты обновлений
            const timeDiffThreshold = 0.2 // 200мс

            // Проверяем, изменилось ли время с последнего отправленного значения
            const timeDiff = Math.abs(relativeProgress - lastSentTimeRef.current)

            if (timeDiff > timeDiffThreshold) {
              // Для отладки - показываем только значительные изменения
              if (timeDiff > 1) {
                console.log(
                  `[MediaPlayer] Обновление относительного прогресса: ${lastSentTimeRef.current.toFixed(3)} -> ${relativeProgress.toFixed(3)}`,
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

          // Если у нас Unix timestamp, используем сохраненный относительный прогресс
          if (currentTime > 365 * 24 * 60 * 60) {
            // Проверяем, есть ли сохраненный прогресс и инициализирован ли плеер
            if (isInitializedRef.current && lastSentTimeRef.current > 0) {
              // Используем lastSentTimeRef для восстановления прогресса воспроизведения
              localTime = lastSentTimeRef.current
              console.log(`[PlayVideo] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)
            } else {
              // Если нет сохраненного прогресса или плеер не инициализирован,
              // используем текущее время видео
              localTime = videoElement.currentTime || 0
              console.log(`[PlayVideo] Используем текущее время видео: ${localTime.toFixed(3)}`)
            }
          } else if (video.startTime) {
            // Для обычного времени вычисляем локальное время
            localTime = Math.max(0, currentTime - (video.startTime || 0))
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
            // Сохраняем текущее время перед паузой
            lastSentTimeRef.current = videoElement.currentTime
            console.log(
              `[PlayVideo] Сохраняем время перед паузой: ${videoElement.currentTime.toFixed(3)}`,
            )

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

  useEffect(() => {
    if (isChangingCamera && video?.id && videoRefs[video.id]) {
      // Убираем лишние логи для повышения производительности
      // console.log("[ChangingCamera] Обнаружено переключение камеры")

      // Сохраняем текущее время для синхронизации между треками
      if (video?.id) {
        // Если есть видео, стараемся сохранить точную временную синхронизацию
        // Убираем лишние логи для повышения производительности
        // console.log("[ChangingCamera] Текущее время при переключении:", currentTime.toFixed(3))

        // Проверяем, что время не слишком большое (больше 100 лет)
        if (currentTime > 100 * 365 * 24 * 60 * 60) {
          // console.warn("[ChangingCamera] Время слишком большое:", currentTime)
          // Если время слишком большое, устанавливаем в начало
          setCurrentTime(0)
          return
        }

        // Постановка видео на паузу, если нужно (убираем запуск во время переключения)
        const videoElement = videoRefs[video.id]
        if (videoElement) {
          // Увеличиваем порог синхронизации с 0.1 до 0.3 секунды для уменьшения количества обновлений
          if (Math.abs(videoElement.currentTime - currentTime) > 0.3) {
            // console.log("[ChangingCamera] Синхронизация текущего времени")
            videoElement.currentTime = currentTime
          }

          // Особая обработка для записи - всегда запускаем воспроизведение
          if (isRecording) {
            // console.log("[ChangingCamera] В режиме записи - продолжаем воспроизведение")
            setIsPlaying(true)
            try {
              videoElement.play().catch((err: unknown) => {
                console.error("[ChangingCamera] Ошибка воспроизведения при записи:", err)
              })
            } catch (error) {
              console.error("[ChangingCamera] Ошибка при воспроизведении во время записи:", error)
            }
          }
          // Обычное воспроизведение, если нужно
          else if (isPlaying && videoElement.paused) {
            try {
              videoElement.play().catch((err: unknown) => {
                console.error("[ChangingCamera] Ошибка воспроизведения:", err)
              })
            } catch (error) {
              console.error("[ChangingCamera] Ошибка при воспроизведении:", error)
            }
          }
        }
      }

      // Сбрасываем флаг isChangingCamera через небольшую задержку после переключения
      // Увеличиваем задержку с 100 до 200мс для уменьшения частоты обновлений
      const timeout = setTimeout(() => {
        // resetCamera()
        // console.log("[ChangingCamera] Сброс флага isChangingCamera, время:", currentTime.toFixed(3))
      }, 200)

      return () => clearTimeout(timeout)
    }
  }, [
    isChangingCamera,
    // resetCamera,
    videoRefs,
    video?.id,
    currentTime,
    isPlaying,
    isRecording,
    setIsPlaying,
    setCurrentTime,
  ])

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

      // Обновляем lastSentTimeRef, чтобы избежать лишних обновлений из onTimeUpdate
      lastSentTimeRef.current = currentTime
      return
    }

    // Обновляем lastSentTimeRef, чтобы избежать лишних обновлений из onTimeUpdate
    lastSentTimeRef.current = currentTime

    // Определяем локальное время в зависимости от типа глобального времени
    let localTime

    // Если у нас Unix timestamp, используем сохраненный относительный прогресс
    if (currentTime > 365 * 24 * 60 * 60) {
      // Проверяем, есть ли сохраненный прогресс и инициализирован ли плеер
      if (isInitializedRef.current && lastSentTimeRef.current > 0) {
        // Используем lastSentTimeRef для восстановления прогресса воспроизведения
        localTime = lastSentTimeRef.current
        console.log(`[Sync] Используем сохраненный прогресс: ${localTime.toFixed(3)}`)
      } else {
        // Если нет сохраненного прогресса или плеер не инициализирован,
        // используем текущее время видео
        localTime = videoElement.currentTime || 0
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

      // Если это Unix timestamp, обновляем lastSentTimeRef
      if (currentTime > 365 * 24 * 60 * 60) {
        lastSentTimeRef.current = localTime
      }

      // Сбрасываем isSeeking после установки времени с минимальной задержкой
      setTimeout(() => setIsSeeking(false), 50)
    } else if (timeDifference > 0.5) {
      // Значительные расхождения синхронизируем принудительно
      videoElement.currentTime = localTime
      console.log(
        `[MediaPlayer] Синхронизация: установлено время ${localTime.toFixed(3)} (глобальное: ${currentTime.toFixed(3)}, startTime: ${videoStartTime.current.toFixed(3)})`,
      )

      // Если это Unix timestamp, обновляем lastSentTimeRef
      if (currentTime > 365 * 24 * 60 * 60) {
        lastSentTimeRef.current = localTime
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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === "p" && video?.id) {
        // Сохраняем текущее время перед паузой
        if (isPlaying && video?.id && videoRefs[video.id]) {
          const videoElement = videoRefs[video.id]
          // Сохраняем текущее время в lastSentTimeRef
          lastSentTimeRef.current = videoElement.currentTime
          console.log(
            `[KeyPress] Сохраняем время перед паузой: ${videoElement.currentTime.toFixed(3)}`,
          )
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
                      videoRefs[key].pause()
                      videoRefs[key].src = ""
                      delete videoRefs[key]
                    } catch (e) {
                      // Игнорируем ошибки при очистке
                    }
                  }
                })

                videoRefs[video.id] = el

                // Устанавливаем обработчик ошибок напрямую
                el.onerror = (e) => {
                  console.error(`[Video] Ошибка видео ${video.id}:`, e)
                  setIsPlaying(false)
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
