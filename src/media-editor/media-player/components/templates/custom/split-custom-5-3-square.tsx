import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "5 экранов: 2 + 1 + 2 (сверху и снизу)"
 * Поддерживает квадратный формат
 */
export function SplitCustom53Square({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 5)

  // Определяем ориентацию на основе ID шаблона
  const isSquare = templateId ? templateId.includes("square") : false

  console.log(`[SplitCustom53Square] Рендеринг шаблона ${templateId} с параметрами:`, {
    isSquare,
    isResizable,
  })

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 5) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full flex-col" style={{ border: "1px solid #35d1c1" }}>
        {/* Верхняя секция с 2 видео */}
        <div className="flex h-1/3 w-full">
          {/* Левое верхнее видео */}
          <div className="h-full w-1/2">
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </div>

          {/* Вертикальная разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Правое верхнее видео */}
          <div className="h-full w-1/2">
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>
        </div>

        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />

        {/* Средняя секция */}
        <div className="h-1/3 w-full">
          <VideoPanel
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </div>

        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />

        {/* Нижняя секция с 2 видео */}
        <div className="flex h-1/3 w-full">
          {/* Левое нижнее видео */}
          <div className="h-full w-1/2">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>

          {/* Вертикальная разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Правое нижнее видео */}
          <div className="h-full w-1/2">
            <VideoPanel
              video={validVideos[4]}
              isActive={validVideos[4]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={4}
            />
          </div>
        </div>
      </div>
    )
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {/* Верхняя секция с 2 видео */}
        <Panel defaultSize={33.33} minSize={20}>
          <PanelGroup direction="horizontal">
            {/* Левое верхнее видео */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Правое верхнее видео */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Средняя секция */}
        <Panel defaultSize={33.33} minSize={20}>
          <VideoPanel
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижняя секция с 2 видео */}
        <Panel defaultSize={33.33} minSize={20}>
          <PanelGroup direction="horizontal">
            {/* Левое нижнее видео */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Правое нижнее видео */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}
