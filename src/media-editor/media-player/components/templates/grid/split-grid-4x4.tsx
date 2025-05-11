import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Сетка 4x4" (16 экранов)
 */
export function SplitGrid4x4({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
}: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 16)

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 16) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Рендерим видео */}
        {validVideos.slice(0, videoCount).map((video, index) => {
          const row = Math.floor(index / 4)
          const col = index % 4

          return (
            <div
              key={`fixed-video-${video.id}-${index}`}
              className="absolute"
              style={{
                top: `${row * 25}%`,
                left: `${col * 25}%`,
                width: "25%",
                height: "25%",
                zIndex: 10,
              }}
            >
              <VideoPanel
                video={video}
                isActive={video.id === activeVideoId}
                videoRefs={videoRefs}
                index={index}
              />
            </div>
          )
        })}

        {/* Добавляем разделительные линии */}
        {/* Вертикальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`v-line-${i}`}
            className="absolute inset-y-0 z-20"
            style={{
              left: `${i * 25}%`,
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        ))}

        {/* Горизонтальные линии */}
        {[1, 2, 3].map((i) => (
          <div
            key={`h-line-${i}`}
            className="absolute inset-x-0 z-20"
            style={{
              top: `${i * 25}%`,
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        ))}
      </div>
    )
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {[0, 1, 2, 3].map((rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            <Panel defaultSize={25} minSize={10}>
              <PanelGroup direction="horizontal">
                {[0, 1, 2, 3].map((colIndex) => {
                  const videoIndex = rowIndex * 4 + colIndex
                  return (
                    <React.Fragment key={`col-${colIndex}`}>
                      <Panel defaultSize={25} minSize={10}>
                        <VideoPanel
                          video={validVideos[videoIndex]}
                          isActive={validVideos[videoIndex]?.id === activeVideoId}
                          videoRefs={videoRefs}
                          index={videoIndex}
                        />
                      </Panel>
                      {colIndex < 3 && (
                        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                      )}
                    </React.Fragment>
                  )
                })}
              </PanelGroup>
            </Panel>
            {rowIndex < 3 && <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />}
          </React.Fragment>
        ))}
      </PanelGroup>
    </div>
  )
}
