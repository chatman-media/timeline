import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Универсальный шаблон "4 экрана по вертикали"
 * Поддерживает все форматы: landscape, portrait, square
 */
export function SplitVertical4({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 4)

  // Определяем ориентацию на основе ID шаблона
  const isPortrait = templateId ? templateId.includes("portrait") : false
  const isSquare = templateId ? templateId.includes("square") : false
  const isLandscape = templateId
    ? templateId.includes("landscape") || (!isPortrait && !isSquare)
    : true

  console.log(`[SplitVertical4] Рендеринг шаблона ${templateId} с параметрами:`, {
    isPortrait,
    isSquare,
    isLandscape,
    isResizable,
  })

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 4) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    if (isPortrait) {
      // Портретный режим - горизонтальные экраны (друг под другом)
      return (
        <div className="flex h-full w-full flex-col" style={{ border: "1px solid #35d1c1" }}>
          {/* Первое видео */}
          <div className="h-1/4 w-full">
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </div>

          {/* Разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Второе видео */}
          <div className="h-1/4 w-full">
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>

          {/* Разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Третье видео */}
          <div className="h-1/4 w-full">
            <VideoPanel
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </div>

          {/* Разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Четвертое видео */}
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
      // Ландшафтный или квадратный режим - вертикальные экраны (в ряд)
      return (
        <div className="flex h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Первое видео */}
          <div className="h-full w-1/4">
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </div>

          {/* Разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Второе видео */}
          <div className="h-full w-1/4">
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>

          {/* Разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Третье видео */}
          <div className="h-full w-1/4">
            <VideoPanel
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </div>

          {/* Разделительная линия */}
          <div className="h-full w-[1px] bg-[#35d1c1]" />

          {/* Четвертое видео */}
          <div className="h-full w-1/4">
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
    // Портретный режим - горизонтальные экраны (друг под другом)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Первая секция */}
          <Panel defaultSize={25} minSize={10}>
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Вторая секция */}
          <Panel defaultSize={25} minSize={10}>
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Третья секция */}
          <Panel defaultSize={25} minSize={10}>
            <VideoPanel
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Четвертая секция */}
          <Panel defaultSize={25} minSize={10}>
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
    // Ландшафтный или квадратный режим - вертикальные экраны (в ряд)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="horizontal">
          {/* Первая секция */}
          <Panel defaultSize={25} minSize={10}>
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Вторая секция */}
          <Panel defaultSize={25} minSize={10}>
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Третья секция */}
          <Panel defaultSize={25} minSize={10}>
            <VideoPanel
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Четвертая секция */}
          <Panel defaultSize={25} minSize={10}>
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
