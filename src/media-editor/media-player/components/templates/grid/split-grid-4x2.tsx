import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Сетка 4x2" (8 экранов)
 * Поддерживает как ландшафтный (4x2), так и портретный (2x4) режимы
 */
export function SplitGrid4x2({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 8)

  // Определяем ориентацию на основе ID шаблона
  // Для квадратных шаблонов используем явное указание ориентации в ID
  const isPortrait = templateId
    ? templateId.includes("portrait") || templateId === "split-grid-2x4-square"
    : false


  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 8) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    if (isPortrait) {
      // Портретный режим (2x4)
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {validVideos.slice(0, videoCount).map((video, index) => {
            const col = Math.floor(index / 4)
            const row = index % 4

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 25}%`,
                  left: `${col * 50}%`,
                  width: "50%",
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
          {/* Вертикальная линия */}
          <div
            className="absolute inset-y-0 left-1/2 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8, // Делаем линии тоньше (прозрачнее)
            }}
          />

          {/* Горизонтальные линии */}
          {[1, 2, 3].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 25}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8, // Делаем линии тоньше (прозрачнее)
              }}
            />
          ))}
        </div>
      )
    } else {
      // Ландшафтный режим (4x2)
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
                  top: `${row * 50}%`,
                  left: `${col * 25}%`,
                  width: "25%",
                  height: "50%",
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

          {/* Горизонтальная линия */}
          <div
            className="absolute inset-x-0 top-1/2 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        </div>
      )
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров
  if (isPortrait) {
    // Портретный режим (2x4)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="horizontal">
          {/* Левая колонка */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="vertical">
              {[0, 1, 2, 3].map((rowIndex) => (
                <React.Fragment key={`left-row-${rowIndex}`}>
                  <Panel defaultSize={25} minSize={10}>
                    <VideoPanel
                      video={validVideos[rowIndex]}
                      isActive={validVideos[rowIndex]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={rowIndex}
                    />
                  </Panel>
                  {rowIndex < 3 && (
                    <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  )}
                </React.Fragment>
              ))}
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Правая колонка */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="vertical">
              {[0, 1, 2, 3].map((rowIndex) => {
                const videoIndex = 4 + rowIndex
                return (
                  <React.Fragment key={`right-row-${rowIndex}`}>
                    <Panel defaultSize={25} minSize={10}>
                      <VideoPanel
                        video={validVideos[videoIndex]}
                        isActive={validVideos[videoIndex]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={videoIndex}
                      />
                    </Panel>
                    {rowIndex < 3 && (
                      <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                    )}
                  </React.Fragment>
                )
              })}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    )
  } else {
    // Ландшафтный режим (4x2)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхний ряд */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="horizontal">
              {[0, 1, 2, 3].map((colIndex) => (
                <React.Fragment key={`top-col-${colIndex}`}>
                  <Panel defaultSize={25} minSize={10}>
                    <VideoPanel
                      video={validVideos[colIndex]}
                      isActive={validVideos[colIndex]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={colIndex}
                    />
                  </Panel>
                  {colIndex < 3 && (
                    <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  )}
                </React.Fragment>
              ))}
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Нижний ряд */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="horizontal">
              {[0, 1, 2, 3].map((colIndex) => {
                const videoIndex = 4 + colIndex
                return (
                  <React.Fragment key={`bottom-col-${colIndex}`}>
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
        </PanelGroup>
      </div>
    )
  }
}
