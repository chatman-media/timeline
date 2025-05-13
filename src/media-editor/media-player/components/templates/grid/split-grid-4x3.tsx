import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Сетка 4x3" (12 экранов)
 */
export function SplitGrid4x3({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)

  // Определяем ориентацию и тип шаблона на основе ID шаблона
  const isPortrait = templateId ? templateId.includes("portrait") : false

  // Если видео меньше 12, заполняем оставшиеся ячейки пустыми видео
  const filledVideos = [...validVideos]
  while (filledVideos.length < 12) {
    filledVideos.push({ id: `empty-${filledVideos.length}`, path: "" } as any)
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    // Для портретного режима 4x3
    if (isPortrait) {
      // Портретный режим 4x3
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 12).map((video, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 33.33}%`,
                  left: `${col * 25}%`,
                  width: "25%",
                  height: "33.33%",
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
                opacity: 0.8, // Делаем линии тоньше (прозрачнее)
              }}
            />
          ))}

          {/* Горизонтальные линии */}
          {[1, 2].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 33.33}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8, // Делаем линии тоньше (прозрачнее)
              }}
            />
          ))}
        </div>
      )
    } else {
      // Ландшафтный или квадратный режим
      // Ландшафтный или квадратный режим 4x3
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 12).map((video, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 33.33}%`,
                  left: `${col * 25}%`,
                  width: "25%",
                  height: "33.33%",
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
          {[1, 2].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 33.33}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров

  // Для портретного режима 4x3
  if (isPortrait) {
    // Портретный режим resizable 4x3
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {[0, 1, 2].map((rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              <Panel defaultSize={rowIndex === 2 ? 33.34 : 33.33} minSize={10}>
                <PanelGroup direction="horizontal">
                  {[0, 1, 2, 3].map((colIndex) => {
                    const videoIndex = rowIndex * 4 + colIndex
                    return (
                      <React.Fragment key={`col-${colIndex}`}>
                        <Panel defaultSize={25} minSize={10}>
                          <VideoPanel
                            video={filledVideos[videoIndex]}
                            isActive={filledVideos[videoIndex]?.id === activeVideoId}
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
              {rowIndex < 2 && (
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    )
  } else {
    // Ландшафтный или квадратный режим
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {[0, 1, 2].map((rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              <Panel defaultSize={rowIndex === 2 ? 33.34 : 33.33} minSize={10}>
                <PanelGroup direction="horizontal">
                  {[0, 1, 2, 3].map((colIndex) => {
                    const videoIndex = rowIndex * 4 + colIndex
                    return (
                      <React.Fragment key={`col-${colIndex}`}>
                        <Panel defaultSize={25} minSize={10}>
                          <VideoPanel
                            video={filledVideos[videoIndex]}
                            isActive={filledVideos[videoIndex]?.id === activeVideoId}
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
              {rowIndex < 2 && (
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    )
  }
}
