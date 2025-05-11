import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useTranslation } from "react-i18next"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Универсальный шаблон "3 слева + 1 справа"
 * Поддерживает все форматы: landscape, portrait, square
 */
export function Split31Right({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Используем хук для локализации
  const { t, i18n } = useTranslation()

  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 4)

  // Определяем ориентацию на основе ID шаблона
  const isPortrait = templateId ? templateId.includes("portrait") : false
  const isSquare = templateId ? templateId.includes("square") : false
  const isLandscape = templateId
    ? templateId.includes("landscape") || (!isPortrait && !isSquare)
    : true

  // Получаем локализованное название шаблона
  const templateName = t("templates.split_3_1_right")

  console.log(`[Split31Right] Рендеринг шаблона ${templateId} (${templateName}) с параметрами:`, {
    isPortrait,
    isSquare,
    isLandscape,
    isResizable,
    language: i18n.language,
  })

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 4) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    if (isPortrait) {
      // Портретный режим - 3 сверху + 1 снизу
      return (
        <div className="flex h-full w-full flex-col" style={{ border: "1px solid #35d1c1" }}>
          {/* Верхняя секция (3 маленьких видео) */}
          <div className="flex h-3/4 w-full">
            {/* Левое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>

            {/* Вертикальная разделительная линия */}
            <div className="h-full w-[1px] bg-[#35d1c1]" />

            {/* Среднее видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>

            {/* Вертикальная разделительная линия */}
            <div className="h-full w-[1px] bg-[#35d1c1]" />

            {/* Правое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
          </div>

          {/* Горизонтальная разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Нижняя секция (большое видео) */}
          <div className="h-1/4 w-full">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>
        </div>
      )
    } else {
      // Ландшафтный или квадратный режим - 3 слева + 1 справа
      return (
        <div className="flex h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Левая секция (3 маленьких видео) */}
          <div className="flex h-full w-1/2 flex-col">
            {/* Верхнее видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>

            {/* Горизонтальная разделительная линия */}
            <div className="h-[1px] w-full bg-[#35d1c1]" />

            {/* Среднее видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>

            {/* Горизонтальная разделительная линия */}
            <div className="h-[1px] w-full bg-[#35d1c1]" />

            {/* Нижнее видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
          </div>

          {/* Разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Правая секция (большое видео) */}
          <div className="h-full w-1/2">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>
        </div>
      )
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров
  if (isPortrait) {
    // Портретный режим - 3 сверху + 1 снизу
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция (3 маленьких видео) */}
          <Panel defaultSize={75} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Левое верхнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[0]}
                  isActive={validVideos[0]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={0}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Среднее верхнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Правое верхнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[2]}
                  isActive={validVideos[2]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={2}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Нижняя секция (большое видео) */}
          <Panel defaultSize={25} minSize={20}>
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </Panel>
        </PanelGroup>
      </div>
    )
  } else {
    // Ландшафтный или квадратный режим - 3 слева + 1 справа
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="horizontal">
          {/* Левая секция (3 маленьких видео) */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="vertical">
              {/* Верхнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[0]}
                  isActive={validVideos[0]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={0}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Среднее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[2]}
                  isActive={validVideos[2]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={2}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Правая секция (большое видео) */}
          <Panel defaultSize={50} minSize={20}>
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </Panel>
        </PanelGroup>
      </div>
    )
  }
}
