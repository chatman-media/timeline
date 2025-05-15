import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useVideoSelection } from "@/media-editor/media-player/hooks/use-video-selection"
import { usePlayerContext } from "@/media-editor/media-player/services/player-provider"
import { MediaFile } from "@/types/media"

// Функция для сравнения пропсов в React.memo
function arePropsEqual(prevProps: VideoPanelProps, nextProps: VideoPanelProps) {
  // Проверяем, изменилось ли активное состояние
  const activeChanged = prevProps.isActive !== nextProps.isActive

  // Проверяем, изменилось ли видео (только по id и path)
  const videoChanged =
    prevProps.video.id !== nextProps.video.id || prevProps.video.path !== nextProps.video.path

  // Возвращаем true, если пропсы не изменились (предотвращаем перерисовку)
  // Возвращаем false, если пропсы изменились (вызываем перерисовку)
  return !activeChanged && !videoChanged
}

interface VideoPanelProps {
  video: MediaFile
  isActive: boolean
  videoRefs?: Record<string, HTMLVideoElement>
  index?: number
  hideLabel?: boolean
  labelPosition?: "left" | "right" | "center"
}

/**
 * Компонент для отображения видео в шаблоне
 * Используем React.memo с функцией сравнения для предотвращения лишних рендеров
 */
function VideoPanelComponent({
  video,
  isActive,
  videoRefs,
  index = 0,
  hideLabel = false,
  labelPosition = "center",
}: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isReady, setIsReady] = useState(false)
  const { t } = useTranslation()
  const { isPlaying, preferredSource } = usePlayerContext()

  // Используем хук для обработки выбора видео
  const { handleVideoClick } = useVideoSelection({
    video,
    isActive,
    index,
  })

  // Эффект для регистрации видео в videoRefs и обновления src при изменении источника
  useEffect(() => {
    if (videoRef.current && video.id && videoRefs) {
      console.log(
        `[VideoPanel] Регистрация видео ${video.id} в videoRefs, source=${preferredSource}, startTime=${video.startTime}`,
      )

      // Сохраняем ссылку на видео элемент
      videoRefs[video.id] = videoRef.current

      // Проверяем, что src установлен правильно
      if (video.path && (!videoRef.current.src || !videoRef.current.src.includes(video.id))) {
        console.log(`[VideoPanel] Принудительно обновляем src для видео ${video.id}: ${video.path}`)

        // Сохраняем текущее время и состояние воспроизведения
        const currentTime = videoRef.current.currentTime
        const wasPlaying = !videoRef.current.paused

        // Обновляем src
        videoRef.current.src = video.path
        videoRef.current.load()

        // Восстанавливаем время и состояние воспроизведения
        if (currentTime > 0) {
          videoRef.current.currentTime = currentTime
        }

        if (wasPlaying) {
          videoRef.current
            .play()
            .catch((e) =>
              console.error(`[VideoPanel] Ошибка воспроизведения видео ${video.id}:`, e),
            )
        }
      }

      return () => {
        delete videoRefs[video.id]
      }
    }
  }, [video.id, video.path, videoRefs, preferredSource])

  // Используем ref для отслеживания предыдущего состояния воспроизведения
  const prevPlayingStateRef = useRef(isPlaying)
  const playAttemptTimeRef = useRef(0)

  // Эффект для синхронизации воспроизведения с дебаунсингом
  useEffect(() => {
    // Проверяем наличие видео элемента, ID видео и пути к видео
    if (!videoRef.current || !video.id || !video.path) return

    // Проверяем, изменилось ли состояние воспроизведения
    if (isPlaying === prevPlayingStateRef.current) return

    // Обновляем предыдущее состояние
    prevPlayingStateRef.current = isPlaying

    // Используем дебаунсинг для предотвращения конфликтов
    const now = Date.now()
    const timeSinceLastAttempt = now - playAttemptTimeRef.current

    // Если прошло менее 300мс с последней попытки, откладываем выполнение
    if (timeSinceLastAttempt < 300) {
      const delay = 300 - timeSinceLastAttempt
      console.log(
        `[VideoPanel] Откладываем управление воспроизведением видео ${video.id} на ${delay}мс`,
      )

      const timeoutId = setTimeout(() => {
        // Проверяем, что состояние не изменилось за время задержки
        if (isPlaying !== prevPlayingStateRef.current) {
          console.log(
            `[VideoPanel] Состояние воспроизведения изменилось за время задержки, пропускаем`,
          )
          return
        }

        handlePlaybackChange()
      }, delay)

      return () => clearTimeout(timeoutId)
    }

    // Если прошло достаточно времени, выполняем сразу
    handlePlaybackChange()

    // Функция для управления воспроизведением
    function handlePlaybackChange() {
      playAttemptTimeRef.current = Date.now()

      try {
        // Проверяем, что videoRef.current существует
        if (!videoRef.current) {
          console.log(
            `[VideoPanel] videoRef.current не существует для видео ${video.id}, пропускаем`,
          )
          return
        }

        if (isPlaying) {
          // Запускаем воспроизведение только если видео на паузе
          if (videoRef.current.paused) {
            console.log(`[VideoPanel] Запускаем воспроизведение видео ${video.id}`)

            // Используем setTimeout для предотвращения конфликтов
            setTimeout(() => {
              // Повторно проверяем, что videoRef.current существует
              if (!videoRef.current) {
                console.log(
                  `[VideoPanel] videoRef.current не существует для видео ${video.id} после таймаута, пропускаем`,
                )
                return
              }

              if (!videoRef.current.paused) {
                console.log(`[VideoPanel] Видео ${video.id} уже воспроизводится, пропускаем`)
                return
              }

              const playPromise = videoRef.current.play()
              if (playPromise !== undefined) {
                playPromise.catch((error) => {
                  // Игнорируем ошибки AbortError, так как они возникают при нормальной работе
                  if (error.name !== "AbortError") {
                    console.error(`[VideoPanel] Ошибка воспроизведения видео ${video.id}:`, error)
                  }
                })
              }
            }, 50)
          } else {
            console.log(`[VideoPanel] Видео ${video.id} уже воспроизводится, пропускаем`)
          }
        } else {
          // Останавливаем воспроизведение только если видео не на паузе
          if (!videoRef.current.paused) {
            console.log(`[VideoPanel] Останавливаем воспроизведение видео ${video.id}`)
            videoRef.current.pause()
          } else {
            console.log(`[VideoPanel] Видео ${video.id} уже на паузе, пропускаем`)
          }
        }
      } catch (error) {
        console.error(`[VideoPanel] Ошибка управления воспроизведением видео ${video.id}:`, error)
      }
    }
  }, [isPlaying, video.id, video.path])

  // Эффект для принудительного обновления видео при изменении preferredSource
  useEffect(() => {
    // Проверяем наличие видео элемента, ID видео и пути к видео
    if (!videoRef.current || !video.id || !video.path) return

    console.log(
      `[VideoPanel] Обнаружено изменение preferredSource: ${preferredSource}, видео: ${video.id}, startTime=${video.startTime}`,
    )

    // Принудительно обновляем видео при изменении preferredSource
    if (preferredSource === "timeline" && video.startTime !== undefined) {
      console.log(`[VideoPanel] Принудительно обновляем видео из таймлайна: ${video.id}`)

      // Сохраняем текущее время и состояние воспроизведения
      const currentTime = videoRef.current.currentTime
      const wasPlaying = !videoRef.current.paused

      // Обновляем src
      videoRef.current.src = video.path
      videoRef.current.load()

      // Восстанавливаем время и состояние воспроизведения
      if (currentTime > 0) {
        videoRef.current.currentTime = currentTime
      }

      if (wasPlaying) {
        videoRef.current
          .play()
          .catch((e) => console.error(`[VideoPanel] Ошибка воспроизведения видео ${video.id}:`, e))
      }

      // Устанавливаем флаг готовности
      setIsReady(true)
    }
  }, [preferredSource, video.id, video.path, video.startTime])

  // Эффект для принудительного обновления видео при изменении самого видео
  useEffect(() => {
    // Проверяем наличие видео элемента, ID видео и пути к видео
    if (!videoRef.current || !video.id || !video.path) return

    console.log(
      `[VideoPanel] Обнаружено изменение видео: ${video.id}, source=${video.source || "не определен"}, startTime=${video.startTime}`,
    )

    // Принудительно обновляем видео
    console.log(`[VideoPanel] Принудительно обновляем видео: ${video.id}`)

    // Сохраняем текущее время и состояние воспроизведения
    const currentTime = videoRef.current.currentTime
    const wasPlaying = !videoRef.current.paused

    // Обновляем src
    videoRef.current.src = video.path
    videoRef.current.load()

    // Восстанавливаем время и состояние воспроизведения
    if (currentTime > 0) {
      videoRef.current.currentTime = currentTime
    }

    if (wasPlaying) {
      videoRef.current
        .play()
        .catch((e) => console.error(`[VideoPanel] Ошибка воспроизведения видео ${video.id}:`, e))
    }

    // Устанавливаем флаг готовности
    setIsReady(true)
  }, [video])

  // Используем ref для отслеживания времени последней загрузки
  const lastLoadTimeRef = useRef(0)

  // Обработчик события загрузки видео с дебаунсингом
  const handleLoadedData = () => {
    setIsReady(true)
    console.log(`[VideoPanel] Видео ${video.id} загружено и готово к воспроизведению`)

    // Используем дебаунсинг для предотвращения конфликтов
    const now = Date.now()
    const timeSinceLastLoad = now - lastLoadTimeRef.current

    // Если прошло менее 300мс с последней загрузки, откладываем воспроизведение
    if (timeSinceLastLoad < 300) {
      const delay = 300 - timeSinceLastLoad
      console.log(
        `[VideoPanel] Откладываем автоматическое воспроизведение видео ${video.id} на ${delay}мс`,
      )

      setTimeout(() => {
        handleAutoPlay()
      }, delay)
    } else {
      // Если прошло достаточно времени, запускаем сразу
      handleAutoPlay()
    }

    // Обновляем время последней загрузки
    lastLoadTimeRef.current = now

    // Функция для автоматического воспроизведения
    function handleAutoPlay() {
      // Если видео должно воспроизводиться, запускаем его
      if (isPlaying && videoRef.current && video.path) {
        // Проверяем, что видео не воспроизводится
        if (videoRef.current.paused) {
          console.log(
            `[VideoPanel] Автоматически запускаем воспроизведение видео ${video.id} после загрузки`,
          )

          // Используем setTimeout для предотвращения конфликтов
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused && isPlaying) {
              videoRef.current.play().catch((error) => {
                // Игнорируем ошибки AbortError, так как они возникают при нормальной работе
                if (error.name !== "AbortError") {
                  console.error(
                    `[VideoPanel] Ошибка автоматического воспроизведения видео ${video.id}:`,
                    error,
                  )
                }
              })
            }
          }, 50)
        } else {
          console.log(
            `[VideoPanel] Видео ${video.id} уже воспроизводится после загрузки, пропускаем`,
          )
        }
      }
    }
  }

  // Используем ключ, который включает preferredSource для принудительного обновления компонента
  const videoKey = `${video.id}-${preferredSource}-${video.source || "unknown"}-${Date.now()}`

  console.log(`[VideoPanel] Рендеринг видео с ключом: ${videoKey}`)

  return (
    <div
      className="video-panel-template relative h-full w-full cursor-pointer"
      style={{ overflow: "visible" }}
      onClick={handleVideoClick}
      key={`panel-${videoKey}`}
    >
      <div
        className={`absolute inset-0 ${isActive ? "border-2 border-white" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          transition: "border 0.2s ease-in-out", // Добавляем плавный переход для рамки
        }}
      >
        {video.path ? (
          // Если есть путь к видео, отображаем видео
          <video
            key={videoKey}
            ref={videoRef}
            src={video.path}
            className="absolute"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
            playsInline
            preload="auto"
            controls={false}
            autoPlay={false}
            loop={false}
            disablePictureInPicture
            muted={!isActive} // Звук только из активного видео
            data-video-id={video.id}
            data-source={video.source || preferredSource}
            data-start-time={video.startTime}
            onLoadedData={handleLoadedData}
          />
        ) : (
          // Если нет пути к видео, отображаем сообщение
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
            <div className="text-center">
              <div className="mb-2 text-3xl">📹</div>
              <div className="text-sm">{t("timeline.player.noVideoSelected")}</div>
              <div className="mt-2 text-xs text-gray-400">
                {preferredSource === "timeline"
                  ? t("timeline.player.addVideoToTimeline")
                  : t("timeline.player.selectVideoFromBrowser")}
              </div>
            </div>
          </div>
        )}

        {/* Индикатор активного видео - всегда рендерим, но скрываем через opacity */}
        <div
          className="absolute top-2 right-2 h-4 w-4 rounded-full bg-white"
          style={{
            opacity: isActive && video.path ? 1 : 0,
            transition: "opacity 0.2s ease-in-out", // Плавное появление/исчезновение
          }}
        ></div>

        {/* Надпись с названием камеры - всегда рендерим, но скрываем через opacity */}
        <div
          className={`absolute bottom-2 ${
            labelPosition === "left"
              ? "left-2"
              : labelPosition === "right"
                ? "right-2"
                : "left-1/2 -translate-x-1/2"
          } bg-opacity-50 rounded bg-black px-2 py-1 text-xs text-white`}
          style={{
            opacity: !hideLabel && video.name && video.path ? 1 : 0,
            transition: "opacity 0.2s ease-in-out", // Плавное появление/исчезновение
            pointerEvents: !hideLabel && video.name && video.path ? "auto" : "none", // Отключаем события мыши, когда скрыто
          }}
        >
          {video.name || ""}
        </div>

        {/* Индикатор загрузки - всегда рендерим, но скрываем через opacity */}
        <div
          className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black"
          style={{
            opacity: !isReady && video.path ? 1 : 0,
            transition: "opacity 0.3s ease-in-out", // Плавное появление/исчезновение
            pointerEvents: !isReady && video.path ? "auto" : "none", // Отключаем события мыши, когда скрыто
          }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}

// Экспортируем компонент с использованием React.memo и функции сравнения
export const VideoPanel = React.memo(VideoPanelComponent, arePropsEqual)
