import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Сетка 3x3" (9 экранов)
 */
export function SplitGrid3x3({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
}: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 9)

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 9) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full flex-col" style={{ border: "1px solid #35d1c1" }}>
        {/* Верхний ряд */}
        <div className="flex h-1/3 w-full">
          {/* Верхний левый экран */}
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

          {/* Верхний средний экран */}
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

          {/* Верхний правый экран */}
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

        {/* Средний ряд */}
        <div className="flex h-1/3 w-full">
          {/* Средний левый экран */}
          <div className="h-full w-1/3">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>

          {/* Вертикальная разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Средний средний экран */}
          <div className="h-full w-1/3">
            <VideoPanel
              video={validVideos[4]}
              isActive={validVideos[4]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={4}
            />
          </div>

          {/* Вертикальная разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Средний правый экран */}
          <div className="h-full w-1/3">
            <VideoPanel
              video={validVideos[5]}
              isActive={validVideos[5]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={5}
            />
          </div>
        </div>

        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />

        {/* Нижний ряд */}
        <div className="flex h-1/3 w-full">
          {/* Нижний левый экран */}
          <div className="h-full w-1/3">
            <VideoPanel
              video={validVideos[6]}
              isActive={validVideos[6]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={6}
            />
          </div>

          {/* Вертикальная разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Нижний средний экран */}
          <div className="h-full w-1/3">
            <VideoPanel
              video={validVideos[7]}
              isActive={validVideos[7]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={7}
            />
          </div>

          {/* Вертикальная разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Нижний правый экран */}
          <div className="h-full w-1/3">
            <VideoPanel
              video={validVideos[8]}
              isActive={validVideos[8]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={8}
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
        {/* Верхний ряд */}
        <Panel defaultSize={33.33} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Верхний левый экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Верхний средний экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Верхний правый экран */}
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
        {/* Средний ряд */}
        <Panel defaultSize={33.33} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Средний левый экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Средний средний экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Средний правый экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[5]}
                isActive={validVideos[5]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={5}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижний ряд */}
        <Panel defaultSize={33.33} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Нижний левый экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[6]}
                isActive={validVideos[6]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={6}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижний средний экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[7]}
                isActive={validVideos[7]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={7}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижний правый экран */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[8]}
                isActive={validVideos[8]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={8}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}
