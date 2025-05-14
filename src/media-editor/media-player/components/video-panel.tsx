import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useVideoSelection } from "@/media-editor/media-player/hooks/use-video-selection"
import { usePlayerContext } from "@/media-editor/media-player/services/player-provider"
import { MediaFile } from "@/types/media"

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
 * Используем React.memo для предотвращения лишних рендеров
 */
export const VideoPanel = React.memo(function VideoPanel({
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
  const { isPlaying } = usePlayerContext()

  // Используем хук для обработки выбора видео
  const { handleVideoClick } = useVideoSelection({
    video,
    isActive,
    index,
  })

  // Эффект для регистрации видео в videoRefs
  useEffect(() => {
    if (videoRef.current && video.id && videoRefs) {
      videoRefs[video.id] = videoRef.current
      return () => {
        delete videoRefs[video.id]
      }
    }
  }, [video.id, videoRefs])

  // Эффект для синхронизации воспроизведения
  useEffect(() => {
    if (!videoRef.current || !video.id) return

    try {
      if (isPlaying) {
        // Запускаем воспроизведение
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error(`[VideoPanel] Ошибка воспроизведения видео ${video.id}:`, error)
          })
        }
      } else {
        // Останавливаем воспроизведение
        videoRef.current.pause()
      }
    } catch (error) {
      console.error(`[VideoPanel] Ошибка управления воспроизведением видео ${video.id}:`, error)
    }
  }, [isPlaying, video.id])

  // Обработчик события загрузки видео
  const handleLoadedData = () => {
    setIsReady(true)
    console.log(`[VideoPanel] Видео ${video.id} загружено и готово к воспроизведению`)
  }

  return (
    <div
      className="video-panel-template relative h-full w-full cursor-pointer"
      style={{ overflow: "visible" }}
      onClick={handleVideoClick}
    >
      <div
        className={`absolute inset-0 ${isActive ? "border-2 border-white" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <video
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
          onLoadedData={handleLoadedData}
        />

        {/* Индикатор активного видео */}
        {isActive && <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-white"></div>}

        {/* Надпись с названием камеры */}
        {!hideLabel && video.name && (
          <div
            className={`absolute bottom-2 ${
              labelPosition === "left"
                ? "left-2"
                : labelPosition === "right"
                  ? "right-2"
                  : "left-1/2 -translate-x-1/2"
            } bg-opacity-50 rounded bg-black px-2 py-1 text-xs text-white`}
          >
            {video.name}
          </div>
        )}

        {/* Индикатор загрузки */}
        {!isReady && (
          <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  )
})
