import { useCallback, useEffect, useState } from "react"
import { ImperativePanelHandle,Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { AppliedTemplate } from "@/media-editor/media-player/services/template-service"
import { MediaFile } from "@/types/media"

interface ResizableTemplateProps {
  appliedTemplate: AppliedTemplate
  videos: MediaFile[]
  activeVideoId: string | null
  onVideoClick: (e: React.MouseEvent) => void
}

/**
 * Компонент для отображения настраиваемого шаблона с возможностью изменения размеров панелей
 */
export function ResizableTemplate({
  appliedTemplate,
  videos,
  activeVideoId,
  onVideoClick,
}: ResizableTemplateProps) {
  // Определяем тип шаблона и количество видео
  const template = appliedTemplate.template
  const videoCount = Math.min(videos.length, template?.screens || 1)

  // Состояние для хранения размеров панелей
  const [panelSizes, setPanelSizes] = useState<number[]>([])

  // Эффект для инициализации размеров панелей
  useEffect(() => {
    if (template && videoCount > 0) {
      // Инициализируем размеры панелей равномерно
      const initialSizes = Array(videoCount).fill(100 / videoCount)
      setPanelSizes(initialSizes)
    }
  }, [template, videoCount])

  // Обработчик изменения размера панели
  const handlePanelResize = useCallback((panelIndex: number, size: number) => {
    setPanelSizes((prevSizes) => {
      const newSizes = [...prevSizes]
      newSizes[panelIndex] = size
      return newSizes
    })
  }, [])

  // Если нет шаблона или видео, возвращаем пустой div
  if (!template || videoCount === 0) {
    return <div className="h-full w-full bg-black" />
  }

  // Определяем направление разделения в зависимости от типа шаблона
  const direction = template.split === "horizontal" ? "vertical" : "horizontal"

  // Для шаблонов с сеткой (custom) используем вложенные PanelGroup
  if (template.split === "custom") {
    // Для сетки 2x2 (4 экрана)
    if (template.screens === 4) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={videos[0]}
                    isActive={videos[0]?.id === activeVideoId}
                    onClick={onVideoClick}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={videos[1]}
                    isActive={videos[1]?.id === activeVideoId}
                    onClick={onVideoClick}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={videos[2]}
                    isActive={videos[2]?.id === activeVideoId}
                    onClick={onVideoClick}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={videos[3]}
                    isActive={videos[3]?.id === activeVideoId}
                    onClick={onVideoClick}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }

    // Для других типов сеток можно добавить аналогичную логику
    // ...
  }

  // Для простых шаблонов (вертикальное, горизонтальное, диагональное разделение)
  return (
    <div className="h-full w-full">
      <PanelGroup direction={direction} onLayout={(sizes) => setPanelSizes(sizes)}>
        {videos.slice(0, videoCount).map((video, index) => (
          <>
            <Panel key={`panel-${video.id}`} minSize={10}>
              <VideoPanel
                video={video}
                isActive={video.id === activeVideoId}
                onClick={onVideoClick}
              />
            </Panel>
            {index < videoCount - 1 && (
              <PanelResizeHandle
                key={`handle-${index}`}
                className={
                  direction === "horizontal"
                    ? "w-1 bg-gray-700 hover:bg-gray-500"
                    : "h-1 bg-gray-700 hover:bg-gray-500"
                }
              />
            )}
          </>
        ))}
      </PanelGroup>
    </div>
  )
}

interface VideoPanelProps {
  video: MediaFile
  isActive: boolean
  onClick: (e: React.MouseEvent) => void
}

/**
 * Компонент для отображения видео в панели
 */
function VideoPanel({ video, isActive, onClick }: VideoPanelProps) {
  return (
    <div className="relative h-full w-full">
      <video
        src={video.path}
        className="h-full w-full object-contain"
        style={{
          border: isActive ? "2px solid white" : "none",
        }}
        onClick={onClick}
        playsInline
        preload="auto"
        controls={false}
        autoPlay={false}
        loop={false}
        disablePictureInPicture
        muted={!isActive} // Звук только у активного видео
        data-video-id={video.id}
      />
    </div>
  )
}
