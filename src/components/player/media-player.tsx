import { useEffect, useRef } from "react"

import { PlayerControls } from "@/components/player/player-controls"
import { useRootStore } from "@/hooks/use-root-store"

export const ActiveVideo = () => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    setCurrentTime,
    setIsPlaying,
    isChangingCamera,
    volume: globalVolume,
    trackVolumes,
    currentTime,
    isSeeking,
    setIsSeeking,
    resetChangingCamera,
    isRecordingSchema,
  } = useRootStore()

  // Используем ref для хранения последнего времени обновления, чтобы избежать слишком частых обновлений
  const lastUpdateTimeRef = useRef(0)
  // Минимальный интервал между обновлениями времени (мс) - уменьшаем для более плавного движения
  const UPDATE_THRESHOLD = 16 // ~60fps для максимально плавного обновления
  // Последнее отправленное время
  const lastSentTimeRef = useRef(0)
  // Определяем, короткое ли видео (меньше 10 секунд)
  const isShortVideo = useRef(false)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  // Выводим текущее время только раз в секунду, а не для каждого рендера
  useEffect(() => {
    const debugInterval = setInterval(() => {
      if (activeVideo) {
        console.log("[ActiveVideo Debug] Текущее время:", currentTime.toFixed(3))
      }
    }, 1000)

    return () => clearInterval(debugInterval)
  }, [activeVideo, currentTime])

  useEffect(() => {
    if (!activeVideo) return

    const videoElement = videoRefs[activeVideo.id]
    if (!videoElement) return

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (activeVideo.duration || 0) < 10

    const videoStartTime = activeVideo.startTime || 0

    // Оптимизированный обработчик timeupdate
    const onTimeUpdate = () => {
      // Проверяем время с последнего обновления, чтобы не вызывать слишком частые изменения состояния
      const now = performance.now()
      if (now - lastUpdateTimeRef.current < UPDATE_THRESHOLD) return

      // Обновляем currentTime только если не идет перемотка (внутренняя или внешняя)
      // и не меняется камера
      if (!videoElement.seeking && !isChangingCamera && !isSeeking) {
        const newTime = videoElement.currentTime

        // Минимальный порог разницы времени - для сверхплавного обновления
        const timeDiffThreshold = 0.001 // Практически любое изменение времени

        // Проверяем, изменилось ли время с последнего отправленного значения
        const timeDiff = Math.abs(newTime - lastSentTimeRef.current)
        if (timeDiff > timeDiffThreshold) {
          // Вызываем setCurrentTime с пометкой источника обновления
          setCurrentTime(newTime, "playback")
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
              } catch (playErr) {
                console.error("[ChangingCamera] Ошибка при воспроизведении после смены камеры:", playErr)
              }
            } else {
              // Если видео не готово, добавляем слушатель для запуска, когда будет готово
              const handleCanPlay = async () => {
                try {
                  await videoElement.play()
                } catch (playErr) {
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
          resetChangingCamera()
        }
        setIsPlaying(false)
      }
    }

    // Устанавливаем громкость для активного видео
    const trackVolume = trackVolumes[activeVideo.id] ?? 1
    videoElement.volume = globalVolume * trackVolume

    playVideo()

    // Убираем старые слушатели при очистке
    return () => {
      videoElement.removeEventListener("timeupdate", onTimeUpdate)
      videoElement.removeEventListener("error", handleError)
    }
  }, [
    activeVideo,
    isPlaying,
    isChangingCamera,
    videoRefs,
    setCurrentTime,
    setIsPlaying,
    globalVolume,
    trackVolumes,
    isSeeking,
    currentTime,
    resetChangingCamera,
  ])

  // Эффект для синхронизации времени видео с общим состоянием
  useEffect(() => {
    if (!activeVideo) return

    const videoElement = videoRefs[activeVideo.id]
    if (!videoElement) return

    // Определяем, короткое ли у нас видео
    isShortVideo.current = (activeVideo.duration || 0) < 10

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
  }, [currentTime, activeVideo, videoRefs, isSeeking, setIsSeeking, isChangingCamera])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p" && activeVideo) {
        setIsPlaying(!isPlaying)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, activeVideo, setIsPlaying])

  // Эффект для сброса флага переключения камеры после небольшой задержки
  useEffect(() => {
    if (isChangingCamera) {
      console.log("[ChangingCamera] Обнаружено переключение камеры")

      // Сохраняем текущее время для синхронизации между треками
      if (activeVideo) {
        // Если есть видео, стараемся сохранить точную временную синхронизацию
        console.log("[ChangingCamera] Текущее время при переключении:", currentTime.toFixed(3))

        // Постановка видео на паузу, если нужно (убираем запуск во время переключения)
        const videoElement = videoRefs[activeVideo.id]
        if (videoElement) {
          if (Math.abs(videoElement.currentTime - currentTime) > 0.1) {
            console.log("[ChangingCamera] Синхронизация текущего времени")
            videoElement.currentTime = currentTime
          }
          
          // Особая обработка для записи - всегда запускаем воспроизведение
          if (isRecordingSchema) {
            console.log("[ChangingCamera] В режиме записи - продолжаем воспроизведение")
            setIsPlaying(true)
            try {
              videoElement.play().catch(err => {
                console.error("[ChangingCamera] Ошибка воспроизведения при записи:", err)
              })
            } catch (error) {
              console.error("[ChangingCamera] Ошибка при воспроизведении во время записи:", error)
            }
          }
          // Обычное воспроизведение, если нужно
          else if (isPlaying && videoElement.paused) {
            try {
              videoElement.play().catch(err => {
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
        resetChangingCamera()
        console.log("[ChangingCamera] Сброс флага isChangingCamera, время:", currentTime.toFixed(3))
      }, 100) // Уменьшаем задержку для более быстрого сброса флага

      return () => clearTimeout(timeout)
    }
  }, [isChangingCamera, resetChangingCamera, videoRefs, activeVideo, currentTime, isPlaying, isRecordingSchema, setIsPlaying])

  if (!activeVideo) return null

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 relative bg-black">
        <video
          ref={(el) => {
            if (el && activeVideo) {
              videoRefs[activeVideo.id] = el
            }
          }}
          src={activeVideo.path}
          className="absolute inset-0 w-full h-full object-contain"
          onClick={handlePlayPause}
          playsInline
          preload="auto"
          disablePictureInPicture
        />
      </div>
      <PlayerControls currentTime={currentTime} />
    </div>
  )
}

ActiveVideo.displayName = "ActiveVideo"
