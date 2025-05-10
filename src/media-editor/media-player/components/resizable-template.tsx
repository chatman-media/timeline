import React, { useCallback, useEffect, useRef, useState } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useTranslation } from "react-i18next"

import { AspectRatio } from "@/components/ui/aspect-ratio"
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

  // Состояние для хранения текущего положения диагональной линии для диагонального шаблона
  const [splitPoints, setSplitPoints] = useState<{x: number, y: number}[]>(
    template?.splitPoints ? [...template.splitPoints] : [
      { x: 66.67, y: 0 }, // Начальная точка (2/3 от левого края, верх)
      { x: 33.33, y: 100 } // Конечная точка (1/3 от левого края, низ)
    ]
  );

  // Состояние для отслеживания перетаскивания
  const [isDragging, setIsDragging] = useState(false);

  // Смещение курсора относительно линии при начале перетаскивания
  const [dragOffset, setDragOffset] = useState<number>(0);

  // Состояние для отслеживания, какую точку перетаскиваем (0 - верхнюю, 1 - нижнюю)
  const [dragPoint, setDragPoint] = useState<number | null>(null);

  // Ссылка на контейнер для диагонального шаблона
  const diagonalContainerRef = useRef<HTMLDivElement>(null);

  // Обработчик начала перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent, pointIndex: number = 0) => {
    e.preventDefault();

    // Запоминаем, какую точку перетаскиваем
    setDragPoint(pointIndex);

    // Вычисляем смещение курсора относительно выбранной точки или центра линии
    if (diagonalContainerRef.current) {
      const rect = diagonalContainerRef.current.getBoundingClientRect();
      const cursorX = ((e.clientX - rect.left) / rect.width) * 100;

      // Если перетаскиваем всю линию (pointIndex === 2), используем центр линии
      if (pointIndex === 2) {
        const centerX = (splitPoints[0].x + splitPoints[1].x) / 2;
        setDragOffset(cursorX - centerX);
      } else {
        // Иначе используем выбранную точку
        setDragOffset(cursorX - splitPoints[pointIndex].x);
      }
    }

    setIsDragging(true);
  }, [splitPoints]);

  // Обработчик перетаскивания
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !diagonalContainerRef.current || dragPoint === null) return;

    // Получаем размеры и позицию контейнера из ref
    const rect = diagonalContainerRef.current.getBoundingClientRect();

    // Вычисляем относительную позицию курсора в процентах
    const x = ((e.clientX - rect.left) / rect.width) * 100;

    // Создаем копию текущих точек
    const newPoints = [...splitPoints];

    // Вычисляем новую позицию с учетом смещения
    const newX = x - dragOffset;

    if (dragPoint === 2) {
      // Если перетаскиваем всю линию, смещаем обе точки
      const diffX = newX - ((splitPoints[0].x + splitPoints[1].x) / 2);
      newPoints[0].x = splitPoints[0].x + diffX;
      newPoints[1].x = splitPoints[1].x + diffX;
    } else {
      // Иначе обновляем только выбранную точку
      newPoints[dragPoint].x = newX;
    }

    // Для совместимости с остальным кодом
    let newX1 = newPoints[0].x;
    let newX2 = newPoints[1].x;

    // Проверяем, не выходит ли линия за границы
    if (dragPoint === 2) {
      // Если перетаскиваем всю линию, проверяем обе точки
      // Верхняя точка должна быть в пределах от 0% до 100%
      if (newX1 < 0) {
        const adjustment = -newX1;
        newX1 += adjustment;
        newX2 += adjustment;
      } else if (newX1 > 100) {
        const adjustment = newX1 - 100;
        newX1 -= adjustment;
        newX2 -= adjustment;
      }

      // Нижняя точка должна быть в пределах от 0% до 100%
      if (newX2 < 0) {
        const adjustment = -newX2;
        newX1 += adjustment;
        newX2 += adjustment;
      } else if (newX2 > 100) {
        const adjustment = newX2 - 100;
        newX1 -= adjustment;
        newX2 -= adjustment;
      }
    } else if (dragPoint === 0) {
      // Если перетаскиваем верхнюю точку, ограничиваем только её
      newX1 = Math.max(0, Math.min(100, newX1));
    } else if (dragPoint === 1) {
      // Если перетаскиваем нижнюю точку, ограничиваем только её
      newX2 = Math.max(0, Math.min(100, newX2));
    }

    // Обновляем положение линии
    setSplitPoints([
      { x: newX1, y: 0 },
      { x: newX2, y: 100 }
    ]);
  }, [isDragging, splitPoints, dragOffset, dragPoint]);

  // Обработчик окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragPoint(null);
  }, []);

  // Добавляем и удаляем обработчики событий для перетаскивания
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  // Для вертикального разделения (split=vertical) используем horizontal direction в PanelGroup
  // Для горизонтального разделения (split=horizontal) используем vertical direction в PanelGroup
  const direction = effectiveSplit === "vertical" ? "horizontal" : "vertical"

  // Функция для рендеринга шаблона в фиксированном режиме
  const renderFixedTemplate = () => {


    // Специальная обработка для сетки 5x5 (25 экранов)
    if (template.screens === 25 && template.id && (template.id.includes("split-grid-5x5-landscape") || template.id.includes("split-grid-5x5-portrait"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

    // Специальная обработка для сетки 3x2 (6 экранов)
    if (template.screens === 6 && template.id && (template.id.includes("split-grid-3x2-landscape") || template.id.includes("split-grid-2x3-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии */}
          {isPortrait ? (
            // Для портретного режима (2x3)
            <>
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
              <div
                className="absolute inset-x-0 top-1/3 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-x-0 top-2/3 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
            </>
          ) : (
            // Для ландшафтного режима (3x2)
            <>
              {/* Вертикальные линии */}
              <div
                className="absolute inset-y-0 left-1/3 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-y-0 left-2/3 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              {/* Горизонтальная линия */}
              <div
                className="absolute inset-x-0 top-1/2 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
            </>
          )}
        </div>
      )
    }

    // Специальная обработка для сетки 4x2 (8 экранов) или 2x4 (портретный режим)
    if (template.screens === 8 && template.id && (template.id.includes("split-grid-4x2-landscape") || template.id.includes("split-grid-2x4-portrait") || template.id.includes("split-grid-2x4-square"))) {
      // Определяем, является ли шаблон портретным или квадратным
      const isPortrait = template.id && template.id.includes("portrait");
      const isSquare = template.id && template.id.includes("square");
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии */}
          {/* Вертикальные линии */}
          <div
            className="absolute inset-y-0 left-1/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 left-2/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 left-3/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
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

    // Специальная обработка для сетки 4x3 (12 экранов) или 3x4 (портретный режим)
    if (template.screens === 12 && template.id && (template.id.includes("split-grid-4x3-landscape") || template.id.includes("split-grid-3x4-portrait") || template.id.includes("split-grid-4x3-square"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии */}
          {isPortrait ? (
            // Для портретного режима (3x4)
            <>
              {/* Вертикальные линии */}
              <div
                className="absolute inset-y-0 left-1/3 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-y-0 left-2/3 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              {/* Горизонтальные линии */}
              <div
                className="absolute inset-x-0 top-1/4 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-x-0 top-2/4 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-x-0 top-3/4 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
            </>
          ) : (
            // Для ландшафтного режима (4x3)
            <>
              {/* Вертикальные линии */}
              <div
                className="absolute inset-y-0 left-1/4 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-y-0 left-2/4 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-y-0 left-3/4 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              {/* Горизонтальные линии */}
              <div
                className="absolute inset-x-0 top-1/3 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-x-0 top-2/3 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
            </>
          )}
        </div>
      )
    }

    // Специальная обработка для шаблона "1 left + 3 right"
    if (template.screens === 4 && template.id && (template.id.includes("split-1-3-landscape") || template.id.includes("split-1-3-portrait") || template.id.includes("split-1-3-square")) && !template.id.includes("bottom")) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Добавляем вертикальную разделительную линию */}
          <div
            className="absolute inset-y-0 left-1/2 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          {/* Добавляем горизонтальные разделительные линии в правой части */}
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "33.33%",
              left: "50%",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "66.66%",
              left: "50%",
            }}
          />
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

          {/* Добавляем вертикальную разделительную линию */}
          <div
            className="absolute inset-y-0 left-1/2 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Добавляем горизонтальные разделительные линии в правой части */}
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "33.33%",
              left: "50%",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "66.66%",
              left: "50%",
            }}
          />
        </div>
      )
    }

    // Специальная обработка для шаблона "1 top + 3 bottom"
    if (template.screens === 4 && template.id && (template.id.includes("split-1-3-bottom-landscape") || template.id.includes("split-1-3-bottom-portrait") || template.id.includes("split-1-3-bottom-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Добавляем горизонтальную разделительную линию */}
          <div
            className="absolute inset-x-0 top-1/2 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          {/* Добавляем вертикальные разделительные линии в нижней части */}
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "33.33%",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "66.66%",
            }}
          />
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

          {/* Добавляем горизонтальную разделительную линию */}
          <div
            className="absolute inset-x-0 top-1/2 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Добавляем вертикальные разделительные линии в нижней части */}
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "33.33%",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "66.66%",
            }}
          />
        </div>
      )
    }

    // Специальная обработка для шаблона "3 left + 1 right"
    if (template.screens === 4 && template.id && (template.id.includes("split-3-1-right-landscape") || template.id.includes("split-3-1-right-portrait") || template.id.includes("split-3-1-right-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Добавляем вертикальную разделительную линию */}
          <div
            className="absolute inset-y-0 left-1/2 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          {/* Добавляем горизонтальные разделительные линии в левой части */}
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "33.33%",
              left: "0",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "66.66%",
              left: "0",
            }}
          />
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

          {/* Добавляем вертикальную разделительную линию */}
          <div
            className="absolute inset-y-0 left-1/2 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Добавляем горизонтальные разделительные линии в левой части */}
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "33.33%",
              left: "0",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              width: "50%",
              top: "66.66%",
              left: "0",
            }}
          />
        </div>
      )
    }

    // Специальная обработка для шаблона "3 screens horizontal"
    if (template.screens === 3 && template.id && (template.id.includes("split-horizontal-3-landscape") || template.id.includes("split-horizontal-3-portrait") || template.id.includes("split-horizontal-3-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем горизонтальные разделительные линии */}
          <div
            className="absolute inset-x-0 top-1/3 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-x-0 top-2/3 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        </div>
      )
    }

    // Специальная обработка для шаблона "4 screens vertical"
    if (template.screens === 4 && template.id && (template.id.includes("split-vertical-4-landscape") || template.id.includes("split-vertical-4-portrait") || template.id.includes("split-vertical-4-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии справа */}
          <div
            className="absolute inset-y-0 right-1/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 right-2/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 right-3/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        </div>
      )
    }

    // Специальная обработка для шаблона "2 screens vertical"
    if (template.screens === 2 && template.id && (template.id.includes("split-vertical-landscape") || template.id.includes("split-vertical-portrait") || template.id.includes("split-vertical-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем вертикальную разделительную линию */}
          <div
            className="absolute inset-y-0 left-1/2 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        </div>
      )
    }

    // Специальная обработка для шаблона "2 screens horizontal"
    if (template.screens === 2 && template.id && (template.id.includes("split-horizontal-landscape") || template.id.includes("split-horizontal-portrait") || template.id.includes("split-horizontal-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем горизонтальную разделительную линию */}
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

    // Специальная обработка для шаблона "5 screens: 1 top + 4 bottom"
    if (template.screens === 5 && template.id && template.id.includes("split-custom-5-1-portrait")) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем горизонтальную разделительную линию */}
          <div
            className="absolute inset-x-0 top-1/2 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Добавляем вертикальные разделительные линии в нижней части */}
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "25%",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "50%",
            }}
          />
          <div
            className="absolute z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              height: "50%",
              top: "50%",
              left: "75%",
            }}
          />

          {/* Добавляем горизонтальную разделительную линию в нижней части */}
          <div
            className="absolute inset-x-0 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
              top: "75%",
            }}
          />
        </div>
      )
    }

    // Специальная обработка для сетки 2x2 (4 экрана)
    if (template.screens === 4 && template.id && (template.id.includes("split-grid-2x2-landscape") || template.id.includes("split-grid-2x2-portrait") || template.id.includes("split-grid-2x2-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

    // Специальная обработка для сетки 3x3 (9 экранов)
    if (template.screens === 9 && template.id && (template.id.includes("split-grid-3x3-landscape") || template.id.includes("split-grid-3x3-portrait") || template.id.includes("split-grid-3x3-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии */}
          {/* Вертикальные линии */}
          <div
            className="absolute inset-y-0 left-1/3 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 left-2/3 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          {/* Горизонтальные линии */}
          <div
            className="absolute inset-x-0 top-1/3 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-x-0 top-2/3 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        </div>
      )
    }

    // Специальная обработка для сетки 4x4 (16 экранов)
    if (template.screens === 16 && template.id && (template.id.includes("split-grid-4x4-landscape") || template.id.includes("split-grid-4x4-portrait") || template.id.includes("split-grid-4x4-square"))) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии */}
          {/* Вертикальные линии */}
          <div
            className="absolute inset-y-0 left-1/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 left-2/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-y-0 left-3/4 z-20"
            style={{
              width: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          {/* Горизонтальные линии */}
          <div
            className="absolute inset-x-0 top-1/4 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-x-0 top-2/4 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
          <div
            className="absolute inset-x-0 top-3/4 z-20"
            style={{
              height: "1px",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />
        </div>
      )
    }

    // Специальная обработка для сетки 2x5 (10 экранов) или 5x2 (10 экранов)
    if (template.screens === 10 && template.id && (template.id.includes("split-grid-5x2-landscape") || template.id.includes("split-grid-2x5-portrait") || template.id.includes("split-grid-2x5-square"))) {
      // Определяем, является ли шаблон портретным или квадратным
      const isPortrait = template.id && template.id.includes("portrait");
      const isSquare = template.id && template.id.includes("square");

      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем разделительные линии */}
          {isPortrait || isSquare ? (
            // Для портретного режима (2x5) или квадратного (2x5)
            <>
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
              <div
                className="absolute inset-x-0 top-1/5 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  top: "20%"
                }}
              />
              <div
                className="absolute inset-x-0 top-2/5 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  top: "40%"
                }}
              />
              <div
                className="absolute inset-x-0 top-3/5 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  top: "60%"
                }}
              />
              <div
                className="absolute inset-x-0 top-4/5 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  top: "80%"
                }}
              />
            </>
          ) : (
            // Для ландшафтного режима (5x2)
            <>
              {/* Вертикальные линии */}
              <div
                className="absolute inset-y-0 left-1/5 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  left: "20%"
                }}
              />
              <div
                className="absolute inset-y-0 left-2/5 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  left: "40%"
                }}
              />
              <div
                className="absolute inset-y-0 left-3/5 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  left: "60%"
                }}
              />
              <div
                className="absolute inset-y-0 left-4/5 z-20"
                style={{
                  width: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                  left: "80%"
                }}
              />
              {/* Горизонтальная линия */}
              <div
                className="absolute inset-x-0 top-1/2 z-20"
                style={{
                  height: "1px",
                  backgroundColor: "#35d1c1",
                  opacity: 0.8,
                }}
              />
            </>
          )}
        </div>
      )
    }

    // Создаем модифицированный шаблон с линиями цвета #35d1c1
    const modifiedTemplate = template.render();

    // Стандартный рендеринг для остальных шаблонов
    return (
      <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

  // Для шаблона "Diagonal Cross" обработка перенесена в блок для диагональных шаблонов
  if (template.id && template.id.includes("split-diagonal-cross") && template.split !== "diagonal") {
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
      // Для вертикального разделения (split=vertical) используем horizontal direction в PanelGroup
      // Для горизонтального разделения (split=horizontal) используем vertical direction в PanelGroup
      const panelDirection = effectiveSplit === "vertical" ? "horizontal" : "vertical"

      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для шаблона "1 top + 2 bottom" (1 сверху + 2 снизу)
      if (template.id && (template.id.includes("split-mixed-1") || template.id.includes("split-1-3-bottom"))) {
        if (isPortrait) {
          return (
            <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
              <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
                <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
                  <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
                    {/* Верхняя секция с 1 видео */}
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
                  </PanelGroup>
                </AspectRatio>
              </div>
            </div>
          )
        } else {
          return (
            <div className="h-full w-full" style={{ overflow: "visible" }}>
              <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
                {/* Верхняя секция с 1 видео */}
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
              </PanelGroup>
            </div>
          )
        }
      }

      // Для шаблона "1 left + 2 right" (1 слева + 2 справа)
      else if (template.id && (template.id.includes("split-mixed-2") || template.id.includes("split-1-3-landscape"))) {
        if (isPortrait) {
          return (
            <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
              <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
                <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
                  <PanelGroup direction="horizontal" onLayout={(sizes) => setPanelSizes(sizes)}>
                    {/* Левая секция с 1 видео */}
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
                        <Panel defaultSize={50} minSize={20}>
                          <VideoPanel
                            video={validVideos[1]}
                            isActive={validVideos[1]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={1}
                          />
                        </Panel>
                        <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
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
                </AspectRatio>
              </div>
            </div>
          )
        } else {
          return (
            <div className="h-full w-full" style={{ overflow: "visible" }}>
              <PanelGroup direction="horizontal" onLayout={(sizes) => setPanelSizes(sizes)}>
                {/* Левая секция с 1 видео */}
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
                    <Panel defaultSize={50} minSize={20}>
                      <VideoPanel
                        video={validVideos[1]}
                        isActive={validVideos[1]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={1}
                      />
                    </Panel>
                    <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
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
      }

      // Для обычных шаблонов с 3 экранами
      else {
        // Определяем направление разделения по типу split
        // Для вертикального разделения (split=vertical) используем horizontal direction в PanelGroup
        // Для горизонтального разделения (split=horizontal) используем vertical direction в PanelGroup
        const panelDirection = template.split === "vertical" ? "horizontal" : "vertical"

        // Для портретных шаблонов добавляем ограничение по соотношению сторон
        if (isPortrait) {
          return (
            <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
              <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
                <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
                </AspectRatio>
              </div>
            </div>
          )
        }

        // Для ландшафтных шаблонов используем стандартный рендеринг
        return (
          <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    }

    // Для шаблона с 3 экранами вертикально (split-vertical-3-landscape)
    if (template.screens === 3 && template.id && template.id.includes("split-vertical-3-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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

    // Для шаблона с 3 экранами вертикально (split-vertical-3-portrait)
    else if (template.screens === 3 && template.id && template.id.includes("split-vertical-3-portrait")) {
      return (
        <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
          <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
            <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
            </AspectRatio>
          </div>
        </div>
      )
    }
    // Для шаблона с 3 экранами горизонтально (split-horizontal-3-portrait)
    else if (template.screens === 3 && template.id && template.id.includes("split-horizontal-3-portrait")) {
      return (
        <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
          <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
            <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
              <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
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
                        className="h-1 bg-gray-700 hover:bg-gray-500"
                      />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </AspectRatio>
          </div>
        </div>
      )
    }
    // Для шаблона с 4 экранами вертикально (split-vertical-4-landscape)
    else if (template.screens === 4 && template.id && template.id.includes("split-vertical-4-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    // Для шаблона с 4 экранами вертикально (split-vertical-4-portrait)
    else if (template.screens === 4 && template.id && template.id.includes("split-vertical-4-portrait")) {
      return (
        <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
          <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
            <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
            </AspectRatio>
          </div>
        </div>
      )
    }
    // Для шаблона с 4 экранами горизонтально (split-horizontal-4-landscape)
    else if (template.screens === 4 && template.id && template.id.includes("split-horizontal-4-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
          <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
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
                    className="h-1 bg-gray-700 hover:bg-gray-500"
                  />
                )}
              </React.Fragment>
            ))}
          </PanelGroup>
        </div>
      )
    }
    // Для шаблона с 4 экранами горизонтально (split-horizontal-4-portrait)
    else if (template.screens === 4 && template.id && template.id.includes("split-horizontal-4-portrait")) {
      return (
        <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
          <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
            <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
              <PanelGroup direction="vertical" onLayout={(sizes) => setPanelSizes(sizes)}>
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
                        className="h-1 bg-gray-700 hover:bg-gray-500"
                      />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </AspectRatio>
          </div>
        </div>
      )
    }
    // Для шаблона с 4 экранами (сетка 2x2)
    else if (template.screens === 4) {
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    // Для шаблона "1 left + 3 right" (4 экрана) - ландшафтный формат
    else if (template.screens === 4 && template.id && template.id.includes("split-1-3-landscape") && !template.id.includes("bottom") && !template.id.includes("portrait")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    // Для шаблона "1 top + 3 bottom" (4 экрана) - ландшафтный формат
    else if (template.screens === 4 && template.id && template.id.includes("split-1-3-bottom-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    // Для шаблона "1 bottom + 4 top" (5 экранов) - ландшафтный или портретный формат
    else if (template.screens === 5 && template.id && (template.id.includes("split-4-1-bottom-landscape") || template.id.includes("split-4-1-bottom-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
                <PanelGroup direction="vertical">
                  {/* Верхняя секция с 4 видео в квадрате */}
                  <Panel defaultSize={70} minSize={30}>
                    <PanelGroup direction="vertical">
                      {/* Верхний ряд */}
                      <Panel defaultSize={50} minSize={20}>
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
                          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
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
                      <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                      {/* Нижний ряд */}
                      <Panel defaultSize={50} minSize={20}>
                        <PanelGroup direction="horizontal">
                          {/* Левое нижнее видео */}
                          <Panel defaultSize={50} minSize={20}>
                            <VideoPanel
                              video={validVideos[2]}
                              isActive={validVideos[2]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={2}
                            />
                          </Panel>
                          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                          {/* Правое нижнее видео */}
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
                  <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                  {/* Нижняя большая секция */}
                  <Panel defaultSize={30} minSize={20}>
                    <VideoPanel
                      video={validVideos[4]}
                      isActive={validVideos[4]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={4}
                    />
                  </Panel>
                </PanelGroup>
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ overflow: "visible" }}>
          <PanelGroup direction="vertical">
            {/* Верхняя секция с 4 видео в квадрате */}
            <Panel defaultSize={70} minSize={30}>
              <PanelGroup direction="vertical">
                {/* Верхний ряд */}
                <Panel defaultSize={50} minSize={20}>
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
                    <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
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
                <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                {/* Нижний ряд */}
                <Panel defaultSize={50} minSize={20}>
                  <PanelGroup direction="horizontal">
                    {/* Левое нижнее видео */}
                    <Panel defaultSize={50} minSize={20}>
                      <VideoPanel
                        video={validVideos[2]}
                        isActive={validVideos[2]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={2}
                      />
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                    {/* Правое нижнее видео */}
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
            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
            {/* Нижняя большая секция */}
            <Panel defaultSize={30} minSize={20}>
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
    // Для шаблона "3 top + 1 bottom" (4 экрана)
    else if (template.screens === 4 && template.id && template.id.includes("split-3-1-landscape") && !template.id.includes("right")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    // Для шаблона "Mixed Split (1+2)" (3 экрана) - ландшафтный формат
    else if (template.screens === 3 && template.id && template.id.includes("split-mixed-2-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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
    // Для шаблона "Mixed Split (2+1)" (3 экрана) или "3 screens horizontal" - ландшафтный формат
    else if (template.screens === 3 && template.id && (template.id.includes("split-mixed-1-landscape") || template.id === "split-horizontal-3-landscape")) {
      return (
        <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
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

    // Для шаблона "1 left + 2 right" (1 большое слева, 2 маленьких справа) - портретный формат
    else if (template.screens === 3 && template.id && template.id.includes("split-mixed-2-portrait")) {
      return (
        <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
          <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
            <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
            </AspectRatio>
          </div>
        </div>
      )
    }

    // Для шаблона "1 top + 2 bottom" (1 большое сверху, 2 маленьких снизу) - портретный формат
    else if (template.screens === 3 && template.id && template.id.includes("split-1-3-portrait")) {
      return (
        <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
          <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
            <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
            </AspectRatio>
          </div>
        </div>
      )
    }
    // Для сетки 2x2 (4 экрана)
    else if (template.screens === 4) {
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

    // Для сетки 3x2 (6 экранов) - ландшафтный или портретный формат
    else if (template.screens === 6 && template.id && (template.id.includes("split-grid-3x2-landscape") || template.id.includes("split-grid-2x3-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
                <PanelGroup direction="horizontal">
                  {/* Левый столбец */}
                  <Panel defaultSize={50} minSize={20}>
                    <PanelGroup direction="vertical">
                      {[0, 1, 2].map((index) => (
                        <React.Fragment key={`fragment-left-${index}`}>
                          <Panel defaultSize={33.33} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {index < 2 && (
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                  {/* Правый столбец */}
                  <Panel defaultSize={50} minSize={20}>
                    <PanelGroup direction="vertical">
                      {[3, 4, 5].map((index) => (
                        <React.Fragment key={`fragment-right-${index}`}>
                          <Panel defaultSize={33.33} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {index < 5 && (
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                </PanelGroup>
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          <PanelGroup direction="vertical">
            {/* Верхний ряд */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="horizontal">
                {[0, 1, 2].map((index) => (
                  <React.Fragment key={`fragment-top-${index}`}>
                    <Panel defaultSize={33.33} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 2 && (
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
                {[3, 4, 5].map((index) => (
                  <React.Fragment key={`fragment-bottom-${index}`}>
                    <Panel defaultSize={33.33} minSize={10}>
                      <VideoPanel
                        video={validVideos[index]}
                        isActive={validVideos[index]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={index}
                      />
                    </Panel>
                    {index < 5 && (
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
    // Для сетки 3x3 (9 экранов)
    else if (template.screens === 9 && template.id && template.id.includes("split-grid-3x3-landscape")) {
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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
    // Для сетки 5x2 (10 экранов) или 2x5 (портретный режим)
    else if (template.screens === 10 && template.id && (template.id.includes("split-grid-5x2-landscape") || template.id.includes("split-grid-2x5-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
                <PanelGroup direction="horizontal">
                  {/* Левый столбец */}
                  <Panel defaultSize={50} minSize={20}>
                    <PanelGroup direction="vertical">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <React.Fragment key={`fragment-left-${index}`}>
                          <Panel defaultSize={20} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {index < 4 && (
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                  {/* Правый столбец */}
                  <Panel defaultSize={50} minSize={20}>
                    <PanelGroup direction="vertical">
                      {[5, 6, 7, 8, 9].map((index) => (
                        <React.Fragment key={`fragment-right-${index}`}>
                          <Panel defaultSize={20} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {index < 9 && (
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                </PanelGroup>
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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
    // Для сетки 4x3 (12 экранов) или 3x4 (портретный режим)
    else if (template.screens === 12 && template.id && (template.id.includes("split-grid-4x3-landscape") || template.id.includes("split-grid-3x4-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
                <PanelGroup direction="horizontal">
                  {/* Левый столбец */}
                  <Panel defaultSize={33.33} minSize={20}>
                    <PanelGroup direction="vertical">
                      {[0, 1, 2, 3].map((index) => (
                        <React.Fragment key={`fragment-left-${index}`}>
                          <Panel defaultSize={25} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {index < 3 && (
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                  {/* Средний столбец */}
                  <Panel defaultSize={33.33} minSize={20}>
                    <PanelGroup direction="vertical">
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
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                  {/* Правый столбец */}
                  <Panel defaultSize={33.33} minSize={20}>
                    <PanelGroup direction="vertical">
                      {[8, 9, 10, 11].map((index) => (
                        <React.Fragment key={`fragment-right-${index}`}>
                          <Panel defaultSize={25} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {index < 11 && (
                            <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      ))}
                    </PanelGroup>
                  </Panel>
                </PanelGroup>
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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
    // Для сетки 4x4 (16 экранов) или 4x4 (портретный режим)
    else if (template.screens === 16 && template.id && (template.id.includes("split-grid-4x4-landscape") || template.id.includes("split-grid-4x4-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full">
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
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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
    // Для сетки 5x5 (25 экранов)
    else if (template.screens === 25 && template.id && (template.id.includes("split-grid-5x5-landscape") || template.id.includes("split-grid-5x5-portrait"))) {
      // Определяем, является ли шаблон портретным
      const isPortrait = template.id && template.id.includes("portrait");

      // Для портретных шаблонов добавляем ограничение по соотношению сторон
      if (isPortrait) {
        return (
          <div className="h-full w-full flex items-center justify-center" style={{ overflow: "visible" }}>
            <div className="h-full flex items-center" style={{ maxWidth: "56.25vh" }}>
              <AspectRatio ratio={9/16} className="h-auto max-h-full w-full" style={{ border: "1px solid #35d1c1" }}>
                <PanelGroup direction="vertical">
                  {[0, 1, 2, 3, 4].map((rowIndex) => (
                    <React.Fragment key={`fragment-row-${rowIndex}`}>
                      <Panel defaultSize={20} minSize={10}>
                        <PanelGroup direction="horizontal">
                          {[0, 1, 2, 3, 4].map((colIndex) => {
                            const index = rowIndex * 5 + colIndex;
                            return (
                              <React.Fragment key={`fragment-cell-${index}`}>
                                <Panel defaultSize={20} minSize={10}>
                                  <VideoPanel
                                    video={validVideos[index]}
                                    isActive={validVideos[index]?.id === activeVideoId}
                                    videoRefs={videoRefs}
                                    index={index}
                                  />
                                </Panel>
                                {colIndex < 4 && (
                                  <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </PanelGroup>
                      </Panel>
                      {rowIndex < 4 && (
                        <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-500" />
                      )}
                    </React.Fragment>
                  ))}
                </PanelGroup>
              </AspectRatio>
            </div>
          </div>
        )
      }

      // Для ландшафтных шаблонов используем стандартный рендеринг
      return (
        <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          <PanelGroup direction="vertical">
            {[0, 1, 2, 3, 4].map((rowIndex) => (
              <React.Fragment key={`fragment-row-${rowIndex}`}>
                <Panel defaultSize={20} minSize={10}>
                  <PanelGroup direction="horizontal">
                    {[0, 1, 2, 3, 4].map((colIndex) => {
                      const index = rowIndex * 5 + colIndex;
                      return (
                        <React.Fragment key={`fragment-cell-${index}`}>
                          <Panel defaultSize={20} minSize={10}>
                            <VideoPanel
                              video={validVideos[index]}
                              isActive={validVideos[index]?.id === activeVideoId}
                              videoRefs={videoRefs}
                              index={index}
                            />
                          </Panel>
                          {colIndex < 4 && (
                            <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-500" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </PanelGroup>
                </Panel>
                {rowIndex < 4 && (
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
    // Для диагональных шаблонов с 2 экранами
    if (template.screens === 2) {
      // Создаем clipPath для видео на основе текущего положения линии
      const clipPaths = [
        `polygon(0 0, ${splitPoints[0].x}% 0, ${splitPoints[1].x}% 100%, 0 100%)`,
        `polygon(${splitPoints[0].x}% 0, 100% 0, 100% 100%, ${splitPoints[1].x}% 100%)`
      ];

      return (
        <div
          ref={diagonalContainerRef}
          className="relative h-full w-full"
          style={{ border: "1px solid #35d1c1" }}
        >
          {/* Рендерим видео */}
          {validVideos.slice(0, videoCount).map((video, index) => {
            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  clipPath: clipPaths[index],
                  zIndex: 10, // Поверх шаблона
                }}
              >
                <VideoPanel
                  video={video}
                  isActive={video.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={index}
                  hideLabel={false}
                  labelPosition={index % 2 === 0 ? "left" : "right"}
                />
              </div>
            )
          })}

          {/* Добавляем разделительную линию */}
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: `polygon(
                ${splitPoints[0].x - 0.5}% 0,
                ${splitPoints[0].x + 0.5}% 0,
                ${splitPoints[1].x + 0.5}% 100%,
                ${splitPoints[1].x - 0.5}% 100%
              )`,
              backgroundColor: "#35d1c1",
              pointerEvents: "none" // Отключаем события мыши для линии
            }}
          />

          {/* Центральная область для перетаскивания всей линии */}
          <div
            className="absolute z-30"
            style={{
              top: "20%",
              bottom: "20%",
              left: `${(splitPoints[0].x + splitPoints[1].x) / 2 - 5}%`,
              width: "10%",
              cursor: "ew-resize",
              backgroundColor: "transparent"
            }}
            onMouseDown={(e) => handleMouseDown(e, 2)}
          />

          {/* Верхняя область для перетаскивания */}
          <div
            className="absolute z-30"
            style={{
              top: 0,
              left: `${splitPoints[0].x - 5}%`,
              width: "10%",
              height: "20%",
              cursor: "ew-resize",
              backgroundColor: "transparent"
            }}
            onMouseDown={(e) => handleMouseDown(e, 0)}
          />

          {/* Нижняя область для перетаскивания */}
          <div
            className="absolute z-30"
            style={{
              bottom: 0,
              left: `${splitPoints[1].x - 5}%`,
              width: "10%",
              height: "20%",
              cursor: "ew-resize",
              backgroundColor: "transparent"
            }}
            onMouseDown={(e) => handleMouseDown(e, 1)}
          />

          {/* Надписи с названиями камер добавляются в компоненте VideoPanel */}
        </div>
      )
    }
    // Для диагональных шаблонов с 4 экранами (Diagonal Cross)
    else if (template.id && template.id.includes("split-diagonal-cross")) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
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

          {/* Добавляем надписи с названиями камер */}
          {validVideos.slice(0, videoCount).map((_, index) => {
            // Определяем позицию для каждой камеры
            const style: React.CSSProperties = {
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "2px 8px",
              borderRadius: "4px"
            };

            if (index === 0) {
              style.top = "10%";
              style.left = "10%";
            } else if (index === 1) {
              style.top = "10%";
              style.right = "10%";
            } else if (index === 2) {
              style.bottom = "10%";
              style.right = "10%";
            } else if (index === 3) {
              style.bottom = "10%";
              style.left = "10%";
            }

            return (
              <div
                key={`camera-label-${index}`}
                className="absolute z-30 text-white text-sm"
                style={style}
              >
                Camera {index + 1}
              </div>
            );
          })}
        </div>
      )
    }

    // Для других диагональных шаблонов используем стандартный рендеринг
    return renderFixedTemplate()
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
  hideLabel?: boolean // Флаг для скрытия надписи с названием камеры
  labelPosition?: 'left' | 'right' | 'center' // Позиция надписи с названием камеры
}

/**
 * Компонент для отображения видео в панели
 */
function VideoPanel({ video, isActive, videoRefs, index = 0, hideLabel = false, labelPosition = 'center' }: VideoPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  // Проверяем, что видео существует и имеет путь
  if (!video || !video.path) {
    console.error(`[VideoPanel] Ошибка: видео не определено или не имеет пути`, video)
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        <span className="text-white">{t('timeline.player.videoUnavailable', 'Видео недоступно')}</span>
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
        videoRefs={videoRefs}
        index={index}
        hideLabel={hideLabel}
        labelPosition={labelPosition}
      />
    </div>
  )
}
