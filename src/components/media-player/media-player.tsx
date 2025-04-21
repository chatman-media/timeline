import { useEffect, useRef } from "react"

import { PlayerControls } from "@/components/media-player/player-controls"
import { usePlayerContext } from "@/providers/"

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
    setIsRecording,
    videoRefs,
  } = usePlayerContext()

  // Используем ref для хранения последнего времени обновления, чтобы избежать слишком частых обновлений
  const lastUpdateTimeRef = useRef(0)
  // Минимальный интервал между обновлениями времени (мс) - уменьшаем для более плавного движения
  const UPDATE_THRESHOLD = 16 // ~60fps для максимально плавного обновления
  // Последнее отправленное время
  const lastSentTimeRef = useRef(0)
  // Определяем, короткое ли видео (меньше 10 секунд)
  const isShortVideo = useRef(false)
  const videoStartTime = useRef(0)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }

  // Выводим текущее время только раз в секунду, а не для каждого рендера
  useEffect(() => {
    const debugInterval = setInterval(() => {
      if (video?.id) {
        console.log("[MediaPlayer Debug] Текущее время:", currentTime.toFixed(3))
      }
    }, 1000)

    return () => clearInterval(debugInterval)
  }, [video?.id, currentTime])

  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (duration || 0) < 10
    videoStartTime.current = 0

    // Оптимизированный обработчик timeupdate
    const onTimeUpdate = () => {
      // Проверяем время с последнего обновления, чтобы не вызывать слишком частые изменения состояния
      const now = performance.now()
      if (now - lastUpdateTimeRef.current < UPDATE_THRESHOLD) return

      // Обновляем currentTime только если не идет перемотка (внутренняя или внешняя)
      // и не меняется камера
      if (!videoElement.seeking && !isChangingCamera && !isSeeking) {
        const newTime = videoElement.currentTime

        // Проверяем валидность времени
        if (!isFinite(newTime) || isNaN(newTime) || newTime < 0) {
          console.warn("[onTimeUpdate] Некорректное время:", newTime)
          setCurrentTime(0)
          return
        }

        // Проверяем, что время не слишком большое (больше 100 лет)
        if (newTime > 100 * 365 * 24 * 60 * 60) {
          console.warn("[onTimeUpdate] Время слишком большое:", newTime)
          setCurrentTime(0)
          return
        }

        // Проверяем, что время не слишком маленькое (меньше 0.001 секунды)
        if (newTime < 0.001) {
          console.warn("[onTimeUpdate] Время слишком маленькое:", newTime)
          setCurrentTime(0)
          return
        }

        // Проверяем, что время не выходит за пределы видео
        const videoEndTime = videoStartTime.current + (duration || 0)

        if (newTime > videoEndTime) {
          console.warn("[onTimeUpdate] Время больше длительности видео:", newTime)
          setCurrentTime(videoEndTime)
          return
        }

        // Минимальный порог разницы времени - для сверхплавного обновления
        const timeDiffThreshold = 0.001 // Практически любое изменение времени

        // Проверяем, изменилось ли время с последнего отправленного значения
        const timeDiff = Math.abs(newTime - lastSentTimeRef.current)
        if (timeDiff > timeDiffThreshold) {
          // Вызываем seek с пометкой источника обновления
          setCurrentTime(newTime)
          lastUpdateTimeRef.current = now
          lastSentTimeRef.current = newTime
        }
      }
    }

    const handleError = (e: ErrorEvent) => {
      console.error("Video playback error:", e)
      setIsPlaying(false)
    }

    // Добавляем оптимизированный слушатель
    videoElement.addEventListener("timeupdate", onTimeUpdate)
    videoElement.addEventListener("error", handleError)

    const playVideo = async () => {
      try {
        if (isPlaying) {
          if (isChangingCamera) {
            // При переключении камеры - синхронизируем время и продолжаем воспроизведение
            videoElement.currentTime = currentTime
            console.log(
              "[ChangingCamera] Продолжаем воспроизведение с позиции:",
              currentTime.toFixed(3),
            )

            // Проверяем возможность воспроизведения перед запуском
            if (videoElement.readyState >= 2) {
              // HAVE_CURRENT_DATA или выше
              try {
                await videoElement.play()
              } catch (playErr: unknown) {
                console.error(
                  "[ChangingCamera] Ошибка при воспроизведении после смены камеры:",
                  playErr,
                )
              }
            } else {
              // Если видео не готово, добавляем слушатель для запуска, когда будет готово
              const handleCanPlay = async () => {
                try {
                  await videoElement.play()
                } catch (playErr: unknown) {
                  console.error("[ChangingCamera] Ошибка при отложенном воспроизведении:", playErr)
                }
                videoElement.removeEventListener("canplay", handleCanPlay)
              }
              videoElement.addEventListener("canplay", handleCanPlay)
            }
          } else {
            // Обычное воспроизведение без смены камеры
            await videoElement.play()
          }
        } else {
          // Пауза в любом случае, если isPlaying = false
          videoElement.pause()
        }
      } catch (error) {
        console.error("Failed to play video:", error)
        // Сбрасываем флаг isChangingCamera в случае ошибки
        if (isChangingCamera) {
          // resetCamera()
        }
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
      console.log("[ChangingCamera] Обнаружено переключение камеры")

      // Сохраняем текущее время для синхронизации между треками
      if (video?.id) {
        // Если есть видео, стараемся сохранить точную временную синхронизацию
        console.log("[ChangingCamera] Текущее время при переключении:", currentTime.toFixed(3))

        // Проверяем, что время не слишком большое (больше 100 лет)
        if (currentTime > 100 * 365 * 24 * 60 * 60) {
          console.warn("[ChangingCamera] Время слишком большое:", currentTime)
          // Если время слишком большое, устанавливаем в начало
          setCurrentTime(0)
          return
        }

        // Постановка видео на паузу, если нужно (убираем запуск во время переключения)
        const videoElement = videoRefs[video.id]
        if (videoElement) {
          // Синхронизируем время только если разница больше 0.1 секунды
          if (Math.abs(videoElement.currentTime - currentTime) > 0.1) {
            console.log("[ChangingCamera] Синхронизация текущего времени")
            videoElement.currentTime = currentTime
          }

          // Особая обработка для записи - всегда запускаем воспроизведение
          if (isRecording) {
            console.log("[ChangingCamera] В режиме записи - продолжаем воспроизведение")
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
      const timeout = setTimeout(() => {
        // resetCamera()
        console.log("[ChangingCamera] Сброс флага isChangingCamera, время:", currentTime.toFixed(3))
      }, 100) // Уменьшаем задержку для более быстрого сброса флага

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

  // Эффект для синхронизации времени видео с общим состоянием
  useEffect(() => {
    if (!video?.id) return

    const videoElement = videoRefs[video.id]
    if (!videoElement) return

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (duration || 0) < 10

    // Проверяем, что время валидно
    if (!isFinite(currentTime) || currentTime < 0) {
      // Если время некорректно, устанавливаем в начало
      if (Math.abs(videoElement.currentTime - 0) > 0.1) {
        videoElement.currentTime = 0
      }
      return
    }

    // Если мы в процессе переключения камеры, обрабатываем особым образом
    if (isChangingCamera) {
      // Не обновляем позицию автоматически при смене камеры,
      // это будет сделано в эффекте isChangingCamera
      console.log(
        "[Sync] В процессе смены камеры, сохраняем текущее время:",
        currentTime.toFixed(3),
      )

      // Обновляем lastSentTimeRef, чтобы избежать лишних обновлений из onTimeUpdate
      lastSentTimeRef.current = currentTime
      return
    }

    // Обновляем lastSentTimeRef, чтобы избежать лишних обновлений из onTimeUpdate
    lastSentTimeRef.current = currentTime

    // Вычисляем разницу между текущим временем видео и состоянием
    const timeDifference = Math.abs(videoElement.currentTime - currentTime)

    // Синхронизируем только при активной перемотке или значительной разнице
    if (isSeeking) {
      // При активной перемотке сразу применяем новое время
      videoElement.currentTime = currentTime

      // Сбрасываем isSeeking после установки времени с минимальной задержкой
      setTimeout(() => setIsSeeking(false), 30)
    } else if (timeDifference > 0.3) {
      // Уменьшаем порог для более точной синхронизации
      // Только значительные расхождения синхронизируем принудительно
      videoElement.currentTime = currentTime
      console.log("[Sync] Значительная синхронизация времени:", {
        videoCurrentTime: videoElement.currentTime.toFixed(3),
        newTime: currentTime.toFixed(3),
        diff: timeDifference.toFixed(3),
      })
    }
    // Для плавного воспроизведения не синхронизируем малые различия
  }, [currentTime, video?.id, videoRefs, isSeeking, setIsSeeking, isChangingCamera])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p" && video?.id) {
        if (isPlaying) {
          setIsPlaying(false)
        } else {
          setIsPlaying(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, video?.id, setIsPlaying])

  if (!video?.id) return null

  const videoEndTime = videoStartTime.current + (duration || 0)
  const isTimeInRange = currentTime >= videoStartTime.current && currentTime <= videoEndTime

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative flex-1 bg-black">
        {isTimeInRange ? (
          <video
            ref={(el) => {
              if (el) {
                videoRefs[video.id] = el
              }
            }}
            src={video.path}
            className="absolute inset-0 h-full w-full object-contain"
            onClick={handlePlayPause}
            playsInline
            preload="auto"
            disablePictureInPicture
            // onTimeUpdate={(e) => {
            //   const video = e.currentTarget
            //   if (video) {
            //     setCurrentTime(video.currentTime + (video.start || 0))
            //   }
            // }}
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
