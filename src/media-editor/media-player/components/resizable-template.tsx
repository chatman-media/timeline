import React, { useCallback, useEffect, useRef, useState } from "react"
import { ImperativePanelHandle, Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { ResizableVideo } from "@/media-editor/media-player/components/resizable-video"
import { AppliedTemplate, getVideoStyleForTemplate } from "@/media-editor/media-player/services/template-service"
import { MediaFile } from "@/types/media"
import { usePlayerContext } from "../services"

interface ResizableTemplateProps {
  appliedTemplate: AppliedTemplate
  videos: MediaFile[]
  activeVideoId: string | null
  videoRefs?: Record<string, HTMLVideoElement>
}

/**
 * Компонент для отображения настраиваемого шаблона с возможностью изменения размеров панелей
 */
export function ResizableTemplate({
  appliedTemplate,
  videos,
  activeVideoId,
  videoRefs,
}: ResizableTemplateProps) {
  // Получаем флаг isResizableMode из контекста плеера
  const { isResizableMode } = usePlayerContext()

  // Определяем тип шаблона и количество видео
  const template = appliedTemplate.template

  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path)
  console.log("[ResizableTemplate] Валидные видео:", validVideos.map(v => v.id))

  const videoCount = Math.min(validVideos.length, template?.screens || 1)

  // Состояние для хранения размеров панелей
  const [panelSizes, setPanelSizes] = useState<number[]>([])

  // Эффект для инициализации размеров панелей
  useEffect(() => {
    if (template && videoCount > 0) {
      // Инициализируем размеры панелей равномерно
      const initialSizes = Array(videoCount).fill(100 / videoCount)
      setPanelSizes(initialSizes)
    }
  }, [template, videoCount])

  // Обработчик изменения размера панели
  const handlePanelResize = useCallback((panelIndex: number, size: number) => {
    setPanelSizes((prevSizes) => {
      const newSizes = [...prevSizes]
      newSizes[panelIndex] = size
      return newSizes
    })
  }, [])

  // Если нет шаблона или видео, возвращаем пустой div
  if (!template || videoCount === 0) {
    return <div className="h-full w-full bg-black" />
  }

  // Определяем направление разделения в зависимости от типа шаблона
  // Если тип "resizable", то обрабатываем его как "horizontal"
  const effectiveSplit = template.split === "resizable" ? "horizontal" : template.split
  const direction = effectiveSplit === "horizontal" ? "vertical" : "horizontal"

  // Функция для рендеринга шаблона в фиксированном режиме
  const renderFixedTemplate = () => {
    // Специальная обработка для шаблона "Diagonal Cross"
    if (template.id && template.id.includes("split-diagonal-cross")) {
      return (
        <div className="relative h-full w-full">
          {/* Рендерим видео */}
          {validVideos.slice(0, videoCount).map((video, index) => {
            // Получаем стили для видео в зависимости от шаблона
            const videoStyle = getVideoStyleForTemplate(template, index, videoCount)

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: videoStyle.top || '0',
                  left: videoStyle.left || '0',
                  width: videoStyle.width || '100%',
                  height: videoStyle.height || '100%',
                  clipPath: videoStyle.clipPath,
                  zIndex: 10, // Поверх шаблона
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

          {/* Добавляем диагональные линии разделения цвета #35d1c1 */}
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: "polygon(0 0, 1.5% 0, 100% 98.5%, 100% 100%, 98.5% 100%, 0 1.5%)",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: "polygon(100% 0, 100% 1.5%, 1.5% 100%, 0 100%, 0 98.5%, 98.5% 0)",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Добавляем надписи с названиями камер */}
          <div
            className="absolute z-30 text-white text-sm"
            style={{
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "2px 8px",
              borderRadius: "4px"
            }}
          >
            Камера 1
          </div>
          <div
            className="absolute z-30 text-white text-sm"
            style={{
              bottom: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "2px 8px",
              borderRadius: "4px"
            }}
          >
            Камера 2
          </div>
          <div
            className="absolute z-30 text-white text-sm"
            style={{
              top: "50%",
              left: "15%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "2px 8px",
              borderRadius: "4px"
            }}
          >
            Камера 3
          </div>
          <div
            className="absolute z-30 text-white text-sm"
            style={{
              top: "50%",
              right: "15%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "2px 8px",
              borderRadius: "4px"
            }}
          >
            Камера 4
          </div>
        </div>
      )
    }

    // Создаем модифицированный шаблон с линиями цвета #35d1c1
    const modifiedTemplate = template.render();

    // Стандартный рендеринг для остальных шаблонов
    return (
      <div className="relative h-full w-full">
        {/* Рендерим модифицированный шаблон как фон */}
        {modifiedTemplate}

        {/* Рендерим видео поверх шаблона */}
        {validVideos.slice(0, videoCount).map((video, index) => {
          // Получаем стили для видео в зависимости от шаблона
          const videoStyle = getVideoStyleForTemplate(template, index, videoCount)

          return (
            <div
              key={`fixed-video-${video.id}-${index}`}
              className="absolute"
              style={{
                top: videoStyle.top || '0',
                left: videoStyle.left || '0',
                width: videoStyle.width || '100%',
                height: videoStyle.height || '100%',
                clipPath: videoStyle.clipPath,
                zIndex: 10, // Поверх шаблона
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

        {/* Добавляем дополнительные разделительные линии для шаблонов */}
        {template.split === "vertical" && (
          <div className="absolute inset-y-0 left-0 right-0 z-30 flex">
            {Array.from({ length: template.screens - 1 }).map((_, i) => (
              <div key={`v-line-${i}`} className="flex-1">
                <div
                  className="absolute right-0 inset-y-0 w-1"
                  style={{ backgroundColor: "#35d1c1", opacity: 0.8 }}
                />
              </div>
            ))}
          </div>
        )}

        {template.split === "horizontal" && (
          <div className="absolute inset-x-0 top-0 bottom-0 z-30 flex flex-col">
            {Array.from({ length: template.screens - 1 }).map((_, i) => (
              <div key={`h-line-${i}`} className="flex-1">
                <div
                  className="absolute bottom-0 inset-x-0 h-1"
                  style={{ backgroundColor: "#35d1c1", opacity: 0.8 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Убираем разделительные линии для шаблонов с типом Grid */}
      </div>
    )
  }

  // Для шаблона "Diagonal Cross" всегда используем стандартный рендеринг
  if (template.id && template.id.includes("split-diagonal-cross")) {
    console.log("[ResizableTemplate] Рендеринг шаблона Diagonal Cross:", template.id)
    return renderFixedTemplate()
  }

  // Добавляем отладочный вывод
  console.log("[ResizableTemplate] Рендеринг шаблона:", template.id, "isResizableMode:", isResizableMode)

  // Проверяем, включен ли режим resizable
  // Если режим resizable выключен, используем стандартный рендеринг шаблона с видео
  if (!isResizableMode) {
    return renderFixedTemplate()
  }

  // Все шаблоны теперь resizable, независимо от наличия флага resizable
  // Обрабатываем их в зависимости только от типа разделения
  // Для шаблонов с типом "horizontal", "vertical" или "resizable" используем PanelGroup с соответствующим направлением
  if (effectiveSplit === "horizontal" || effectiveSplit === "vertical") {
    // Для шаблона с 2 экранами
    if (template.screens === 2) {
      // Определяем направление разделения по типу split
      const panelDirection = effectiveSplit === "horizontal" ? "vertical" : "horizontal"

      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction={panelDirection} onLayout={(sizes) => setPanelSizes(sizes)}>
            <Panel minSize={10}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle
              className={
                panelDirection === "horizontal"
                  ? "w-1 bg-gray-700 hover:bg-gray-500"
                  : "h-1 bg-gray-700 hover:bg-gray-500"
              }
            />
            <Panel minSize={10}>
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
          </PanelGroup>
        </div>
      )
    }

    // Для шаблона с 3 экранами
    if (template.screens === 3) {
      // Определяем направление разделения по типу split
      const panelDirection = template.split === "horizontal" ? "vertical" : "horizontal"

      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction={panelDirection} onLayout={(sizes) => setPanelSizes(sizes)}>
            {validVideos.slice(0, videoCount).map((video, index) => (
              <React.Fragment key={`fragment-${video.id}-${index}`}>
                <Panel key={`panel-${video.id}`} minSize={10}>
                  <VideoPanel
                    video={video}
                    isActive={video.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={index}
                  />
                </Panel>
                {index < videoCount - 1 && (
                  <PanelResizeHandle
                    key={`handle-${index}`}
                    className={
                      panelDirection === "horizontal"
                        ? "w-1 bg-gray-700 hover:bg-gray-500"
                        : "h-1 bg-gray-700 hover:bg-gray-500"
                    }
                  />
                )}
              </React.Fragment>
            ))}
          </PanelGroup>
        </div>
      )
    }

    // Для шаблона с 4 экранами вертикально (split-vertical-4-landscape)
    if (template.screens === 4 && template.id && template.id.includes("split-vertical-4-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="horizontal" onLayout={(sizes) => setPanelSizes(sizes)}>
            {validVideos.slice(0, videoCount).map((video, index) => (
              <React.Fragment key={`fragment-${video.id}-${index}`}>
                <Panel key={`panel-${video.id}`} minSize={10}>
                  <VideoPanel
                    video={video}
                    isActive={video.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={index}
                  />
                </Panel>
                {index < videoCount - 1 && (
                  <PanelResizeHandle
                    key={`handle-${index}`}
                    className="w-1 bg-gray-700 hover:bg-gray-500"
                  />
                )}
              </React.Fragment>
            ))}
          </PanelGroup>
        </div>
      )
    }
    // Для шаблона с 4 экранами (сетка 2x2)
    else if (template.screens === 4) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
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
        </div>
      )
    }
  }

  // Для шаблонов с сеткой (custom) используем вложенные PanelGroup
  // Теперь все шаблоны с типом custom также resizable
  if (template.split === "custom") {
    // Для шаблона "5 screens: 1 left + 4 right" (5 экранов, вариант 1)
    if (template.screens === 5 && template.id && template.id.includes("split-custom-5-1-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="horizontal" onLayout={(sizes) => setPanelSizes(sizes)}>
            {/* Левая большая секция */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
            {/* Правая секция */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="vertical">
                {/* Верхняя правая секция */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Нижняя правая секция */}
                <Panel defaultSize={50} minSize={20}>
                  <PanelGroup direction="vertical">
                    {/* Верхняя часть нижней правой секции */}
                    <Panel defaultSize={50} minSize={20}>
                      <PanelGroup direction="horizontal">
                        <Panel defaultSize={50} minSize={20}>
                          <VideoPanel
                            video={validVideos[2]}
                            isActive={validVideos[2]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={2}
                          />
                        </Panel>
                        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
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
                    <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                    {/* Нижняя часть нижней правой секции */}
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
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для шаблона "5 screens: 1 right + 4 left" (5 экранов, вариант 2)
    else if (template.screens === 5 && template.id && template.id.includes("split-custom-5-2-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="horizontal" onLayout={(sizes) => setPanelSizes(sizes)}>
            {/* Левая секция с 4 видео */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="vertical">
                {/* Верхняя левая секция - большое видео */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Нижняя левая секция - 3 маленьких видео */}
                <Panel defaultSize={50} minSize={20}>
                  <PanelGroup direction="vertical">
                    {/* Верхняя часть нижней левой секции - 2 маленьких видео */}
                    <Panel defaultSize={50} minSize={20}>
                      <PanelGroup direction="horizontal">
                        <Panel defaultSize={50} minSize={20}>
                          <VideoPanel
                            video={validVideos[1]}
                            isActive={validVideos[1]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={1}
                          />
                        </Panel>
                        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                        <Panel defaultSize={50} minSize={20}>
                          <VideoPanel
                            video={validVideos[2]}
                            isActive={validVideos[2]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={2}
                          />
                        </Panel>
                      </PanelGroup>
                    </Panel>
                    <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                    {/* Нижняя часть нижней левой секции - 1 видео на всю ширину */}
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
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
            {/* Правая большая секция */}
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
    // Для шаблона "5 screens: 1 middle + 2 top + 2 bottom" (5 экранов, вариант 3)
    else if (template.screens === 5 && template.id && template.id.includes("split-custom-5-3-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
            {/* Верхний ряд с 2 видео */}
            <Panel defaultSize={33.33} minSize={20}>
              <PanelGroup direction="horizontal">
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
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
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Средний ряд с 1 видео */}
            <Panel defaultSize={33.33} minSize={20}>
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд с 2 видео */}
            <Panel defaultSize={33.33} minSize={20}>
              <PanelGroup direction="horizontal">
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[3]}
                    isActive={validVideos[3]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={3}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
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
    // Для шаблона "1 left + 3 right" (4 экрана)
    else if (template.screens === 4 && template.id && template.id.includes("split-1-3-landscape") && !template.id.includes("bottom")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="horizontal">
            {/* Левая большая секция */}
            <Panel>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
            {/* Правая секция с 3 видео */}
            <Panel>
              <PanelGroup direction="vertical">
                {/* Верхнее правое видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Среднее правое видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Нижнее правое видео */}
                <Panel>
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
        </div>
      )
    }
    // Для шаблона "3 left + 1 right" (4 экрана)
    else if (template.screens === 4 && template.id && template.id.includes("split-3-1-right-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="horizontal">
            {/* Левая секция с 3 видео */}
            <Panel>
              <PanelGroup direction="vertical">
                {/* Верхнее левое видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Среднее левое видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Нижнее левое видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
            {/* Правая большая секция */}
            <Panel>
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
    // Для шаблона "1 top + 3 bottom" (4 экрана)
    else if (template.screens === 4 && template.id && template.id.includes("split-1-3-bottom-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="vertical">
            {/* Верхняя большая секция */}
            <Panel>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижняя секция с 3 видео */}
            <Panel>
              <PanelGroup direction="horizontal">
                {/* Левое нижнее видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                {/* Среднее нижнее видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                {/* Правое нижнее видео */}
                <Panel>
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
        </div>
      )
    }
    // Для шаблона "3 top + 1 bottom" (4 экрана)
    else if (template.screens === 4 && template.id && template.id.includes("split-3-1-landscape") && !template.id.includes("right")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="vertical">
            {/* Верхняя секция с 3 видео */}
            <Panel>
              <PanelGroup direction="horizontal">
                {/* Левое верхнее видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                {/* Среднее верхнее видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                {/* Правое верхнее видео */}
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижняя большая секция */}
            <Panel>
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
    // Для шаблона "Mixed Split (1+2)" (3 экрана)
    else if (template.screens === 3 && template.id && template.id.includes("split-mixed-2-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="horizontal" onLayout={(sizes) => setPanelSizes(sizes)}>
            {/* Левая большая секция */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
            {/* Правая секция с 2 видео */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="vertical">
                {/* Верхнее правое видео */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Нижнее правое видео */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для шаблона "Mixed Split (2+1)" (3 экрана)
    else if (template.screens === 3 && template.id && template.id.includes("split-mixed-1-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
            {/* Верхняя большая секция */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижняя секция с 2 видео */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="horizontal">
                {/* Левое нижнее видео */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                {/* Правое нижнее видео */}
                <Panel defaultSize={50} minSize={20}>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для сетки 2x2 (4 экрана)
    else if (template.screens === 4) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}

                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}

                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}

                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
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
        </div>
      )
    }

    // Для сетки 3x2 (6 экранов)
    else if (template.screens === 6 && template.id && template.id.includes("split-grid-3x2-landscape")) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[3]}
                    isActive={validVideos[3]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={3}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[4]}
                    isActive={validVideos[4]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={4}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[5]}
                    isActive={validVideos[5]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={5}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для сетки 3x3 (9 экранов)
    else if (template.screens === 9 && template.id && template.id.includes("split-grid-3x3-landscape")) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Средний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[3]}
                    isActive={validVideos[3]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={3}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[4]}
                    isActive={validVideos[4]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={4}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[5]}
                    isActive={validVideos[5]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={5}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[6]}
                    isActive={validVideos[6]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={6}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[7]}
                    isActive={validVideos[7]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={7}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
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
    // Для сетки 4x2 (8 экранов)
    else if (template.screens === 8 && template.id && template.id.includes("split-grid-4x2-landscape")) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[0]}
                    isActive={validVideos[0]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={0}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[1]}
                    isActive={validVideos[1]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={1}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[2]}
                    isActive={validVideos[2]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={2}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[3]}
                    isActive={validVideos[3]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={3}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel>
              <PanelGroup direction="horizontal">
                <Panel>
                  <VideoPanel
                    video={validVideos[4]}
                    isActive={validVideos[4]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={4}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[5]}
                    isActive={validVideos[5]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={5}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[6]}
                    isActive={validVideos[6]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={6}
                  />
                </Panel>
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                <Panel>
                  <VideoPanel
                    video={validVideos[7]}
                    isActive={validVideos[7]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={7}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для сетки 5x2 (10 экранов)
    else if (template.screens === 10 && template.id && template.id.includes("split-grid-5x2-landscape")) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="horizontal">
                {[0, 1, 2, 3, 4].map((index) => (
                  <React.Fragment key={`fragment-top-${index}`}>
                    <Panel defaultSize={20} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 4 && (
                      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="horizontal">
                {[5, 6, 7, 8, 9].map((index) => (
                  <React.Fragment key={`fragment-bottom-${index}`}>
                    <Panel defaultSize={20} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 9 && (
                      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для сетки 4x3 (12 экранов)
    else if (template.screens === 12 && template.id && template.id.includes("split-grid-4x3-landscape")) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel defaultSize={33.33} minSize={20}>
              <PanelGroup direction="horizontal">
                {[0, 1, 2, 3].map((index) => (
                  <React.Fragment key={`fragment-top-${index}`}>
                    <Panel defaultSize={25} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 3 && (
                      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Средний ряд */}
            <Panel defaultSize={33.33} minSize={20}>
              <PanelGroup direction="horizontal">
                {[4, 5, 6, 7].map((index) => (
                  <React.Fragment key={`fragment-middle-${index}`}>
                    <Panel defaultSize={25} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 7 && (
                      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижний ряд */}
            <Panel defaultSize={33.33} minSize={20}>
              <PanelGroup direction="horizontal">
                {[8, 9, 10, 11].map((index) => (
                  <React.Fragment key={`fragment-bottom-${index}`}>
                    <Panel defaultSize={25} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 11 && (
                      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      )
    }
    // Для сетки 4x4 (16 экранов)
    else if (template.screens === 16 && template.id && template.id.includes("split-grid-4x4-landscape")) {
      return (
        <div className="h-full w-full">
          <PanelGroup direction="vertical">
            {[0, 1, 2, 3].map((rowIndex) => (
              <React.Fragment key={`fragment-row-${rowIndex}`}>
                <Panel defaultSize={25} minSize={10}>
                  <PanelGroup direction="horizontal">
                    {[0, 1, 2, 3].map((colIndex) => {
                      const index = rowIndex * 4 + colIndex;
                      return (
                        <React.Fragment key={`fragment-cell-${index}`}>
                          <Panel defaultSize={25} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {colIndex < 3 && (
                            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </PanelGroup>
                </Panel>
                {rowIndex < 3 && (
                  <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                )}
              </React.Fragment>
            ))}
          </PanelGroup>
        </div>
      )
    }
    // Для других типов сеток можно добавить аналогичную логику
    // ...
  }

  // Для диагональных шаблонов
  if (template.split === "diagonal") {
    // Для диагональных шаблонов используем специальную обработку
    // Так как диагональное разделение сложно реализовать с помощью PanelGroup,
    // мы используем стандартный рендеринг шаблона
    return template.render()
  }

  // Для всех остальных шаблонов используем PanelGroup
  return (
    <div className="h-full w-full" style={{ overflow: "visible" }}>
      <PanelGroup direction={direction} onLayout={(sizes) => setPanelSizes(sizes)}>
        {validVideos.slice(0, videoCount).map((video, index) => (
          <React.Fragment key={`fragment-${video.id}-${index}`}>
            <Panel key={`panel-${video.id}`} minSize={10}>
              <VideoPanel
                video={video}
                isActive={video.id === activeVideoId}
                videoRefs={videoRefs}
                index={index}
              />
            </Panel>
            {index < videoCount - 1 && (
              <PanelResizeHandle
                key={`handle-${index}`}
                className={
                  direction === "horizontal"
                    ? "w-1 bg-gray-700 hover:bg-gray-500"
                    : "h-1 bg-gray-700 hover:bg-gray-500"
                }
              />
            )}
          </React.Fragment>
        ))}
      </PanelGroup>
    </div>
  )
}

interface VideoPanelProps {
  video: MediaFile
  isActive: boolean
  videoRefs?: Record<string, HTMLVideoElement>
  index?: number // Индекс видео в шаблоне
}

/**
 * Компонент для отображения видео в панели
 */
function VideoPanel({ video, isActive, videoRefs, index = 0 }: VideoPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Проверяем, что видео существует и имеет путь
  if (!video || !video.path) {
    console.error(`[VideoPanel] Ошибка: видео не определено или не имеет пути`, video)
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <span className="text-white">Видео недоступно</span>
      </div>
    )
  }

  // Логируем информацию о видео для отладки
  console.log(`[VideoPanel] Рендеринг видео ${video.id}, isActive: ${isActive}, path: ${video.path}`)

  return (
    <div
      className="relative h-full w-full"
      ref={containerRef}
    >
      <ResizableVideo
        video={video}
        isActive={isActive}
        containerRef={containerRef}
        videoRefs={videoRefs}
        index={index}
      />
    </div>
  )
}
