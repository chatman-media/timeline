import React from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Сетка 5x5" (25 экранов)
 */
export function SplitGrid5x5({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 25)

  // Создаем массив с заполнителями для недостающих видео
  const filledVideos = [...validVideos]

  // Если видео меньше 25, дублируем существующие для заполнения
  if (videoCount > 0 && videoCount < 25) {
    console.log(
      `[SplitGrid5x5] Доступно только ${videoCount} видео, дублируем для заполнения 25 ячеек`,
    )
    for (let i = videoCount; i < 25; i++) {
      // Создаем копию объекта видео с новым ID, чтобы избежать дублирования ключей
      const sourceVideo = validVideos[i % videoCount]
      filledVideos[i] = {
        ...sourceVideo,
        // Добавляем индекс к ID, чтобы сделать его уникальным
        id: `${sourceVideo.id}-copy-${i}`,
      }
    }
  }

  console.log(
    `[SplitGrid5x5] Рендеринг шаблона с ${videoCount} уникальными видео, всего ${filledVideos.length} видео`,
  )

  // Если нет видео вообще, возвращаем пустой div
  if (videoCount === 0) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Рендерим видео */}
        {filledVideos.slice(0, 25).map((video, index) => {
          const row = Math.floor(index / 5)
          const col = index % 5

          return (
            <div
              key={`fixed-video-${video.id}-${index}`}
              className="absolute"
              style={{
                top: `${row * 20}%`,
                left: `${col * 20}%`,
                width: "20%",
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
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {[0, 1, 2, 3, 4].map((rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            <Panel defaultSize={20} minSize={10}>
              <PanelGroup direction="horizontal">
                {[0, 1, 2, 3, 4].map((colIndex) => {
                  const videoIndex = rowIndex * 5 + colIndex
                  return (
                    <React.Fragment key={`col-${colIndex}`}>
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
            {rowIndex < 4 && <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />}
          </React.Fragment>
        ))}
      </PanelGroup>
    </div>
  )
}
