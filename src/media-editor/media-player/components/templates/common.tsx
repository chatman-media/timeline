import React from "react"
import { useTranslation } from "react-i18next"

import { ResizableVideo } from "@/media-editor/media-player/components/resizable-video"
import { MediaFile } from "@/types/media"

interface VideoPanelProps {
  video: MediaFile
  isActive: boolean
  videoRefs?: Record<string, HTMLVideoElement>
  index?: number // Индекс видео в шаблоне
  hideLabel?: boolean // Флаг для скрытия надписи с названием камеры
  labelPosition?: "left" | "right" | "center" // Позиция надписи с названием камеры
}

/**
 * Компонент для отображения видео в панели
 */
export function VideoPanel({
  video,
  isActive,
  videoRefs,
  index = 0,
  hideLabel = false,
  labelPosition = "center",
}: VideoPanelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  // Проверяем, что видео существует и имеет путь
  if (!video || !video.path) {
    console.error(`[VideoPanel] Ошибка: видео не определено или не имеет пути`, video)
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <span className="text-white">
          {t("timeline.player.videoUnavailable", "Video unavailable")}
        </span>
      </div>
    )
  }

  // Логируем информацию о видео для отладки
  console.log(
    `[VideoPanel] Рендеринг видео ${video.id}, isActive: ${isActive}, path: ${video.path}`,
  )

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <ResizableVideo
        video={video}
        isActive={isActive}
        videoRefs={videoRefs}
        index={index}
        hideLabel={hideLabel}
        labelPosition={labelPosition}
      />
    </div>
  )
}
