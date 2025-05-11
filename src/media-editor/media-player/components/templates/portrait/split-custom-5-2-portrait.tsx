import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "5 экранов: вариант 2 (1 большой снизу, 4 маленьких сверху)" - портретный формат
 * ID: split-custom-5-2-portrait
 */
export function SplitCustom52Portrait({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
}: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 5)

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 5) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full flex-col" style={{ border: "1px solid #35d1c1" }}>
        {/* Верхняя секция (4 маленьких видео) */}
        <div className="flex h-1/2 w-full flex-col">
          {/* Верхний ряд (2 видео) */}
          <div className="flex h-1/2 w-full">
            {/* Верхнее левое видео */}
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

            {/* Верхнее правое видео */}
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

          {/* Нижний ряд верхней секции (2 видео) */}
          <div className="flex h-1/2 w-full">
            {/* Нижнее левое видео верхней секции */}
            <div className="h-full w-1/2">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>

            {/* Вертикальная разделительная линия */}
            <div className="h-full w-[1px] bg-[#35d1c1]" />

            {/* Нижнее правое видео верхней секции */}
            <div className="h-full w-1/2">
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </div>
          </div>
        </div>

        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />

        {/* Нижняя секция (1 большое видео) */}
        <div className="h-1/2 w-full">
          <VideoPanel
            video={validVideos[4]}
            isActive={validVideos[4]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={4}
          />
        </div>
      </div>
    )
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {/* Верхняя секция (4 маленьких видео) */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="vertical">
            {/* Верхний ряд верхней секции */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="horizontal">
                {/* Верхнее левое видео */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                {/* Верхнее правое видео */}
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
            {/* Нижний ряд верхней секции */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="horizontal">
                {/* Нижнее левое видео верхней секции */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                {/* Нижнее правое видео верхней секции */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[3]}
                    isActive={validVideos[3]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={3}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижняя секция (1 большое видео) */}
        <Panel defaultSize={50} minSize={20}>
          <VideoPanel
            video={validVideos[4]}
            isActive={validVideos[4]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={4}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}
