import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Сетка 5x2" (10 экранов)
 * Поддерживает как ландшафтный (5x2), так и портретный (2x5) режимы
 */
export function SplitGrid5x2({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 10)

  // Определяем ориентацию на основе ID шаблона
  const isPortrait = templateId ? templateId.includes("portrait") : false
  const isSquare = templateId ? templateId.includes("square") : false

  // Если нет видео вообще, возвращаем пустой div
  if (videoCount === 0) {
    return <div className="h-full w-full bg-black" />
  }

  // Если видео меньше 10, заполняем оставшиеся ячейки пустыми видео
  const filledVideos = [...validVideos]
  while (filledVideos.length < 10) {
    filledVideos.push({ id: `empty-${filledVideos.length}`, path: "" } as any)
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    if (isPortrait || (isSquare && templateId?.includes("2x5"))) {
      // Портретный режим (2x5)
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 10).map((video, index) => {
            const col = Math.floor(index / 5)
            const row = index % 5

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 20}%`,
                  left: `${col * 50}%`,
                  width: "50%",
                  height: "20%",
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
              opacity: 0.8,
            }}
          />

          {/* Горизонтальные линии */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 20}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )
    } else {
      // Ландшафтный режим (5x2) или квадратный режим по умолчанию
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 10).map((video, index) => {
            const row = Math.floor(index / 5)
            const col = index % 5

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 50}%`,
                  left: `${col * 20}%`,
                  width: "20%",
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
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`v-line-${i}`}
              className="absolute inset-y-0 z-20"
              style={{
                left: `${i * 20}%`,
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
  if (isPortrait || (isSquare && templateId?.includes("2x5"))) {
    // Портретный режим (2x5)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="horizontal">
          {/* Левая колонка */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="vertical">
              {[0, 1, 2, 3, 4].map((rowIndex) => (
                <React.Fragment key={`left-row-${rowIndex}`}>
                  <Panel defaultSize={20} minSize={10}>
                    <VideoPanel
                      video={filledVideos[rowIndex]}
                      isActive={filledVideos[rowIndex]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={rowIndex}
                    />
                  </Panel>
                  {rowIndex < 4 && (
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
              {[0, 1, 2, 3, 4].map((rowIndex) => {
                const videoIndex = 5 + rowIndex
                return (
                  <React.Fragment key={`right-row-${rowIndex}`}>
                    <Panel defaultSize={20} minSize={10}>
                      <VideoPanel
                        video={filledVideos[videoIndex]}
                        isActive={filledVideos[videoIndex]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={videoIndex}
                      />
                    </Panel>
                    {rowIndex < 4 && (
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
    // Ландшафтный режим (5x2) или квадратный режим по умолчанию
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхний ряд */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="horizontal">
              {[0, 1, 2, 3, 4].map((colIndex) => (
                <React.Fragment key={`top-col-${colIndex}`}>
                  <Panel defaultSize={20} minSize={10}>
                    <VideoPanel
                      video={filledVideos[colIndex]}
                      isActive={filledVideos[colIndex]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={colIndex}
                    />
                  </Panel>
                  {colIndex < 4 && (
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
              {[0, 1, 2, 3, 4].map((colIndex) => {
                const videoIndex = 5 + colIndex
                return (
                  <React.Fragment key={`bottom-col-${colIndex}`}>
                    <Panel defaultSize={20} minSize={10}>
                      <VideoPanel
                        video={filledVideos[videoIndex]}
                        isActive={filledVideos[videoIndex]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={videoIndex}
                      />
                    </Panel>
                    {colIndex < 4 && (
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
