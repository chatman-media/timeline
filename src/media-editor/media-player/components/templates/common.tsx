import React from "react"
import { useTranslation } from "react-i18next"

import { VideoPanel as VideoPanelComponent } from "@/media-editor/media-player/components/video-panel"
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
 * Используем React.memo для предотвращения лишних рендеров
 */
export const VideoPanel = React.memo(
  function VideoPanel({
    video,
    isActive,
    videoRefs,
    index = 0,
    hideLabel = false,
    labelPosition = "center",
  }: VideoPanelProps) {
    const { t } = useTranslation()

    // Если видео не существует или не имеет пути, показываем сообщение об ошибке
    // Для пустых видео с id, начинающимся с "empty-", показываем пустой черный экран
    if (!video || !video.path) {
      if (video?.id && video.id.startsWith("empty-")) {
        return <div className="relative h-full w-full bg-black"></div>
      }

      return (
        <div className="relative flex h-full w-full items-center justify-center bg-black">
          <span className="text-white">
            {t("timeline.player.videoUnavailable", "Видео недоступно")}
          </span>
        </div>
      )
    }

    return (
      <VideoPanelComponent
        video={video}
        isActive={isActive}
        videoRefs={videoRefs}
        index={index}
        hideLabel={hideLabel}
        labelPosition={labelPosition}
      />
    )
  },
  (prevProps, nextProps) => {
    // Функция сравнения для React.memo
    // Возвращает true, если компонент НЕ должен перерендериваться

    // Добавляем проверку на существование video перед доступом к его свойствам
    if (!prevProps.video || !nextProps.video) {
      return prevProps.video === nextProps.video
    }

    // Проверяем только важные свойства, которые влияют на отображение
    const sameVideo =
      prevProps.video.id === nextProps.video.id && prevProps.video.path === nextProps.video.path
    const sameActive = prevProps.isActive === nextProps.isActive
    const sameIndex = prevProps.index === nextProps.index
    const sameLabel =
      prevProps.hideLabel === nextProps.hideLabel &&
      prevProps.labelPosition === nextProps.labelPosition

    // Не сравниваем videoRefs, так как это объект, который может меняться по ссылке
    return sameVideo && sameActive && sameIndex && sameLabel
  },
)
