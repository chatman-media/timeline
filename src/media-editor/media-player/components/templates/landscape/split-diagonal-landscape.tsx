import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Шаблон "Диагональное разделение" - ландшафтный формат
 * ID: split-diagonal-landscape
 */
export function SplitDiagonalLandscape({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Используем хук для локализации
  const { t } = useTranslation()

  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 2)

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 2) {
    return <div className="h-full w-full bg-black" />
  }

  // Определяем ориентацию и тип шаблона на основе ID шаблона
  const isPortrait = templateId ? templateId.includes("portrait") : false
  const isSquare = templateId ? templateId.includes("square") : false
  const isVertical = templateId ? templateId.includes("vertical-square") : false

  console.log(`[SplitDiagonalLandscape] Рендеринг шаблона ${templateId} с параметрами:`, {
    isPortrait,
    isSquare,
    isVertical,
    isResizable,
  })

  // Состояние для хранения текущего положения диагональной линии
  const [splitPoints, setSplitPoints] = useState<{ x: number; y: number }[]>(() => {
    if (isPortrait && !isVertical) {
      // Портретный режим - горизонтальная ось
      return [
        { x: 0, y: 40 }, // Начальная точка для портретного режима (левый край, 40% от верха)
        { x: 100, y: 60 }, // Конечная точка для портретного режима (правый край, 60% от верха)
      ]
    } else if (isPortrait && isVertical) {
      // Портретный режим - вертикальная ось
      return [
        { x: 65, y: 0 }, // Начальная точка (65% от левого края, верх)
        { x: 35, y: 100 }, // Конечная точка (35% от левого края, низ)
      ]
    } else if (isSquare && isVertical) {
      // Квадратный режим с вертикальной осью
      return [
        { x: 65, y: 0 }, // Начальная точка (65% от левого края, верх)
        { x: 35, y: 100 }, // Конечная точка (35% от левого края, низ)
      ]
    } else if (isSquare && !isVertical) {
      // Квадратный режим с горизонтальной осью
      return [
        { x: 0, y: 35 }, // Начальная точка (левый край, 35% от верха)
        { x: 100, y: 65 }, // Конечная точка (правый край, 65% от верха)
      ]
    } else {
      // Ландшафтный режим - вертикальная ось
      return [
        { x: 66.67, y: 0 }, // Начальная точка для ландшафтного режима (2/3 от левого края, верх)
        { x: 33.33, y: 100 }, // Конечная точка для ландшафтного режима (1/3 от левого края, низ)
      ]
    }
  })

  // Состояние для отслеживания перетаскивания
  const [isDragging, setIsDragging] = useState(false)

  // Смещение курсора относительно линии при начале перетаскивания
  const [dragOffset, setDragOffset] = useState<number>(0)

  // Состояние для отслеживания, какую точку перетаскиваем (0 - верхнюю, 1 - нижнюю)
  const [dragPoint, setDragPoint] = useState<number | null>(null)

  // Ссылка на контейнер для диагонального шаблона
  const diagonalContainerRef = useRef<HTMLDivElement>(null)

  // Обработчик начала перетаскивания
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pointIndex: number = 0) => {
      e.preventDefault()

      // Запоминаем, какую точку перетаскиваем
      setDragPoint(pointIndex)

      // Вычисляем смещение курсора относительно выбранной точки или центра линии
      if (diagonalContainerRef.current) {
        const rect = diagonalContainerRef.current.getBoundingClientRect()

        // Для режимов с горизонтальной осью (квадратный с горизонтальной осью и портретный без вертикальной оси)
        if ((isSquare && !isVertical) || (isPortrait && !isVertical)) {
          const cursorY = ((e.clientY - rect.top) / rect.height) * 100

          // Если перетаскиваем всю линию (pointIndex === 2), используем центр линии
          if (pointIndex === 2) {
            const centerY = (splitPoints[0].y + splitPoints[1].y) / 2
            setDragOffset(cursorY - centerY)
          } else {
            // Иначе используем выбранную точку
            setDragOffset(cursorY - splitPoints[pointIndex].y)
          }
        } else {
          // Для режимов с вертикальной осью (ландшафтный, квадратный с вертикальной осью и портретный с вертикальной осью)
          const cursorX = ((e.clientX - rect.left) / rect.width) * 100

          // Если перетаскиваем всю линию (pointIndex === 2), используем центр линии
          if (pointIndex === 2) {
            const centerX = (splitPoints[0].x + splitPoints[1].x) / 2
            setDragOffset(cursorX - centerX)
          } else {
            // Иначе используем выбранную точку
            setDragOffset(cursorX - splitPoints[pointIndex].x)
          }
        }
      }

      setIsDragging(true)
    },
    [splitPoints, isSquare, isVertical],
  )

  // Обработчик перетаскивания
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !diagonalContainerRef.current || dragPoint === null) return

      // Получаем размеры и позицию контейнера из ref
      const rect = diagonalContainerRef.current.getBoundingClientRect()

      // Вычисляем относительную позицию курсора в процентах
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Для режимов с горизонтальной осью (квадратный с горизонтальной осью и портретный без вертикальной оси)
      if ((isSquare && !isVertical) || (isPortrait && !isVertical)) {
        // Создаем копию текущих точек
        const newPoints = [...splitPoints]

        // Вычисляем новую позицию с учетом смещения
        const newY = y - dragOffset

        if (dragPoint === 2) {
          // Если перетаскиваем всю линию, смещаем обе точки
          const diffY = newY - (splitPoints[0].y + splitPoints[1].y) / 2
          newPoints[0].y = splitPoints[0].y + diffY
          newPoints[1].y = splitPoints[1].y + diffY
        } else {
          // Иначе обновляем только выбранную точку
          newPoints[dragPoint].y = newY
        }

        // Для совместимости с остальным кодом
        let newY1 = newPoints[0].y
        let newY2 = newPoints[1].y

        // Проверяем, не выходит ли линия за границы
        if (dragPoint === 2) {
          // Если перетаскиваем всю линию, проверяем обе точки
          // Левая точка должна быть в пределах от 0% до 100%
          if (newY1 < 0) {
            const adjustment = -newY1
            newY1 += adjustment
            newY2 += adjustment
          } else if (newY1 > 100) {
            const adjustment = newY1 - 100
            newY1 -= adjustment
            newY2 -= adjustment
          }

          // Правая точка должна быть в пределах от 0% до 100%
          if (newY2 < 0) {
            const adjustment = -newY2
            newY1 += adjustment
            newY2 += adjustment
          } else if (newY2 > 100) {
            const adjustment = newY2 - 100
            newY1 -= adjustment
            newY2 -= adjustment
          }
        } else if (dragPoint === 0) {
          // Если перетаскиваем левую точку, ограничиваем только её
          newY1 = Math.max(0, Math.min(100, newY1))
        } else if (dragPoint === 1) {
          // Если перетаскиваем правую точку, ограничиваем только её
          newY2 = Math.max(0, Math.min(100, newY2))
        }

        // Обновляем положение линии
        setSplitPoints([
          { x: 0, y: newY1 },
          { x: 100, y: newY2 },
        ])
      } else {
        // Для режимов с вертикальной осью (ландшафтный, квадратный с вертикальной осью и портретный с вертикальной осью)
        // Создаем копию текущих точек
        const newPoints = [...splitPoints]

        // Вычисляем новую позицию с учетом смещения
        const newX = x - dragOffset

        if (dragPoint === 2) {
          // Если перетаскиваем всю линию, смещаем обе точки
          const diffX = newX - (splitPoints[0].x + splitPoints[1].x) / 2
          newPoints[0].x = splitPoints[0].x + diffX
          newPoints[1].x = splitPoints[1].x + diffX
        } else {
          // Иначе обновляем только выбранную точку
          newPoints[dragPoint].x = newX
        }

        // Для совместимости с остальным кодом
        let newX1 = newPoints[0].x
        let newX2 = newPoints[1].x

        // Проверяем, не выходит ли линия за границы
        if (dragPoint === 2) {
          // Если перетаскиваем всю линию, проверяем обе точки
          // Верхняя точка должна быть в пределах от 0% до 100%
          if (newX1 < 0) {
            const adjustment = -newX1
            newX1 += adjustment
            newX2 += adjustment
          } else if (newX1 > 100) {
            const adjustment = newX1 - 100
            newX1 -= adjustment
            newX2 -= adjustment
          }

          // Нижняя точка должна быть в пределах от 0% до 100%
          if (newX2 < 0) {
            const adjustment = -newX2
            newX1 += adjustment
            newX2 += adjustment
          } else if (newX2 > 100) {
            const adjustment = newX2 - 100
            newX1 -= adjustment
            newX2 -= adjustment
          }
        } else if (dragPoint === 0) {
          // Если перетаскиваем верхнюю точку, ограничиваем только её
          newX1 = Math.max(0, Math.min(100, newX1))
        } else if (dragPoint === 1) {
          // Если перетаскиваем нижнюю точку, ограничиваем только её
          newX2 = Math.max(0, Math.min(100, newX2))
        }

        // Обновляем положение линии
        setSplitPoints([
          { x: newX1, y: 0 },
          { x: newX2, y: 100 },
        ])
      }
    },
    [isDragging, splitPoints, dragOffset, dragPoint],
  )

  // Обработчик окончания перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragPoint(null)
  }, [])

  // Добавляем и удаляем обработчики событий для перетаскивания
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    // Для портретного режима
    if (isPortrait) {
      // Портретный режим с горизонтальной осью
      if (!isVertical) {
        console.log(
          `[SplitDiagonalLandscape] Рендеринг в режиме не resizable (портретный с горизонтальной осью)`,
        )
        return (
          <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
            {/* Первый экран (верхний) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: "#000",
                clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 40%)",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              <div className="relative h-full w-full">
                <VideoPanel
                  video={validVideos[0]}
                  isActive={validVideos[0]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={0}
                  labelPosition="center"
                />
              <div className="absolute top-1 left-[50%] z-20 bg-opacity-50 rounded-sm bg-black px-1.5 py-0.5 text-xs font-medium text-white -translate-x-1/2 transform text-center">
                  {t("timeline.player.camera", "Камера")} 1
                </div>
              </div>
            </div>

            {/* Линия разделения */}
            <div
              className="absolute inset-0 z-20"
              style={{
                clipPath: "polygon(0 39.9%, 0 40.1%, 100% 60.1%, 100% 59.9%)",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />

            {/* Второй экран (нижний) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: "#000",
                clipPath: "polygon(0 40%, 100% 60%, 100% 100%, 0 100%)",
                zIndex: 10,
              }}
            >
              <div className="relative h-full w-full">
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                  labelPosition="center"
                />
              <div className="absolute bottom-1 left-[50%] z-20 bg-opacity-50 rounded-sm bg-black px-1.5 py-0.5 text-xs font-medium text-white -translate-x-1/2 transform text-center">
                  {t("timeline.player.camera", "Камера")} 2
                </div>
              </div>
            </div>
          </div>
        )
      }
      // Портретный режим с вертикальной осью
      else {
        console.log(
          `[SplitDiagonalLandscape] Рендеринг в режиме не resizable (портретный с вертикальной осью)`,
        )
        return (
          <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
            {/* Первый экран (левый) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: "#000",
                clipPath: "polygon(0 0, 65% 0, 35% 100%, 0 100%)",
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
                labelPosition="left"
              />
            </div>

            {/* Линия разделения */}
            <div
              className="absolute inset-0 z-20"
              style={{
                clipPath: "polygon(64.9% 0, 65.1% 0, 35.1% 100%, 34.9% 100%)",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />

            {/* Второй экран (правый) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: "#000",
                clipPath: "polygon(65% 0, 100% 0, 100% 100%, 35% 100%)",
                zIndex: 10,
              }}
            >
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
                labelPosition="right"
              />
            </div>
          </div>
        )
      }
    }
    // Для квадратного режима с горизонтальной осью
    else if (isSquare && !isVertical) {
      console.log(
        `[SplitDiagonalLandscape] Рендеринг в режиме не resizable (квадратный с горизонтальной осью)`,
      )
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Первый экран (верхний) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "#000",
              clipPath: "polygon(0 0, 100% 0, 100% 65%, 0 35%)",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            <div className="relative h-full w-full">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
                labelPosition="center"
              />
              {/* Для первой камеры в горизонтальном шаблоне добавляем метку сверху */}
              <div className="absolute top-1 left-[50%] z-20 bg-opacity-50 rounded-sm bg-black px-1.5 py-0.5 text-xs font-medium text-white -translate-x-1/2 transform text-center">
                {t("timeline.player.camera")} 1
              </div>
            </div>
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: "polygon(0 34.9%, 0 35.1%, 100% 65.1%, 100% 64.9%)",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Второй экран (нижний) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "#000",
              clipPath: "polygon(0 35%, 100% 65%, 100% 100%, 0 100%)",
              zIndex: 10,
            }}
          >
            <div className="relative h-full w-full">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
                labelPosition="center"
              />
              {/* Скрываем метку с большим шрифтом, оставляя только 2 метки на камеру */}
            </div>
          </div>
        </div>
      )
    }
    // Для квадратного режима с вертикальной осью
    else if (isSquare && isVertical) {
      console.log(
        `[SplitDiagonalLandscape] Рендеринг в режиме не resizable (квадратный с вертикальной осью)`,
      )
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Первый экран (левый) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "#000",
              clipPath: "polygon(0 0, 65% 0, 35% 100%, 0 100%)",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
              labelPosition="left"
            />
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: "polygon(64.9% 0, 65.1% 0, 35.1% 100%, 34.9% 100%)",
              backgroundColor: "#35d1c1",
              opacity: 0.8,
            }}
          />

          {/* Второй экран (правый) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "#000",
              clipPath: "polygon(65% 0, 100% 0, 100% 100%, 35% 100%)",
              zIndex: 10,
            }}
          >
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
              labelPosition="right"
            />
          </div>
        </div>
      )
    }
    // Для ландшафтного режима - вертикальная ось
    else {
      console.log(`[SplitDiagonalLandscape] Рендеринг в режиме не resizable (ландшафтный)`)
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Первый экран (левый) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "#000",
              clipPath: "polygon(0 0, 66.67% 0, 33.33% 100%, 0 100%)",
              zIndex: 10,
              overflow: "hidden",
            }}
          >
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
              labelPosition="left"
            />
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-20"
            style={{
              clipPath: "polygon(66.62% 0, 66.72% 0, 33.38% 100%, 33.28% 100%)",
              backgroundColor: "#35d1c1",
            }}
          />

          {/* Второй экран (правый) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "#000",
              clipPath: "polygon(66.67% 0, 100% 0, 100% 100%, 33.33% 100%)",
              zIndex: 10,
            }}
          >
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
              labelPosition="right"
            />
          </div>
        </div>
      )
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров
  console.log(`[SplitDiagonalLandscape] Рендеринг в режиме resizable для шаблона ${templateId}`)

  // Для режимов с горизонтальной осью (квадратный с горизонтальной осью и портретный без вертикальной оси)
  if ((isSquare && !isVertical) || (isPortrait && !isVertical)) {
    return (
      <div
        ref={diagonalContainerRef}
        className="relative h-full w-full"
        style={{ border: "1px solid #35d1c1" }}
      >
        {/* Рендерим видео */}
        {validVideos.slice(0, videoCount).map((video, index) => {
          // Создаем clipPath для видео на основе текущего положения линии
          const clipPaths =
            isSquare && !isVertical
              ? [
                `polygon(0 0, 100% 0, 100% 65%, 0 35%)`,
                `polygon(0 35%, 100% 65%, 100% 100%, 0 100%)`,
              ]
              : [
                `polygon(0 0, 100% 0, 100% ${splitPoints[1].y}%, 0 ${splitPoints[0].y}%)`,
                `polygon(0 ${splitPoints[0].y}%, 100% ${splitPoints[1].y}%, 100% 100%, 0 100%)`,
              ]

          return (
            <div
              key={`fixed-video-${video.id}-${index}`}
              className="absolute inset-0"
              style={{
                clipPath: clipPaths[index],
                zIndex: 10, // Поверх шаблона
              }}
            >
              <div className="relative h-full w-full">
                <VideoPanel
                  video={video}
                  isActive={video.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={index}
                  hideLabel={false}
                  labelPosition="center"
                />
                {/* Для первой камеры в горизонтальном шаблоне добавляем метку сверху */}
                {index === 0 && (
                  <div className="absolute top-1 left-[50%] z-20 bg-opacity-50 rounded-sm bg-black px-1.5 py-0.5 text-xs font-medium text-white -translate-x-1/2 transform text-center">
                    {t("timeline.player.camera")} {index + 1}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Добавляем разделительную линию с учетом угла наклона */}
        <div
          className="absolute inset-0 z-20"
          style={{
            clipPath:
              isSquare && !isVertical
                ? `polygon(
              0 34.8%,
              0 35.2%,
              100% 65.2%,
              100% 64.8%
            )`
                : `polygon(
              0 ${splitPoints[0].y - 0.2}%,
              0 ${splitPoints[0].y + 0.2}%,
              100% ${splitPoints[1].y + 0.2}%,
              100% ${splitPoints[1].y - 0.2}%
            )`,
            backgroundColor: "#35d1c1",
            pointerEvents: "none", // Отключаем события мыши для линии
          }}
        />

        {/* Области для перетаскивания */}
        {isSquare && !isVertical ? (
          <>
            {/* Левая область для перетаскивания (фиксированная) */}
            <div
              className="absolute z-30"
              style={{
                left: 0,
                top: "30%",
                width: "20%",
                height: "10%",
                cursor: "ns-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 0)}
            />

            {/* Центральная область для перетаскивания всей линии (фиксированная) */}
            <div
              className="absolute z-30"
              style={{
                top: "35%",
                height: "30%",
                left: "20%",
                right: "20%",
                transform: "skew(15deg)",
                cursor: "row-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 2)}
            />

            {/* Правая область для перетаскивания (фиксированная) */}
            <div
              className="absolute z-30"
              style={{
                right: 0,
                top: "60%",
                width: "20%",
                height: "10%",
                cursor: "ns-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 1)}
            />
          </>
        ) : (
          <>
            {/* Левая область для перетаскивания */}
            <div
              className="absolute z-30"
              style={{
                left: 0,
                top: `${splitPoints[0].y - 5}%`,
                width: "20%",
                height: "10%",
                cursor: "ns-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 0)}
            />

            {/* Центральная область для перетаскивания всей линии */}
            <div
              className="absolute z-30"
              style={{
                top: `${Math.min(splitPoints[0].y, splitPoints[1].y) - 2}%`,
                height: `${Math.abs(splitPoints[0].y - splitPoints[1].y) + 4}%`,
                left: "20%",
                right: "20%",
                transform: `skew(${Math.atan2(splitPoints[1].y - splitPoints[0].y, 100) * (180 / Math.PI)}deg)`,
                cursor: "row-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 2)}
            />

            {/* Правая область для перетаскивания */}
            <div
              className="absolute z-30"
              style={{
                right: 0,
                top: `${splitPoints[1].y - 5}%`,
                width: "20%",
                height: "10%",
                cursor: "ns-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 1)}
            />
          </>
        )}
      </div>
    )
  } else {
    // Для портретного и ландшафтного режимов (вертикальная ось)
    return (
      <div
        ref={diagonalContainerRef}
        className="relative h-full w-full"
        style={{ border: "1px solid #35d1c1" }}
      >
        {/* Рендерим видео */}
        {validVideos.slice(0, videoCount).map((video, index) => {
          // Создаем clipPath для видео на основе текущего положения линии
          const clipPaths =
            isSquare && isVertical
              ? [
                `polygon(0 0, 65% 0, 35% 100%, 0 100%)`,
                `polygon(65% 0, 100% 0, 100% 100%, 35% 100%)`,
              ]
              : [
                `polygon(0 0, ${splitPoints[0].x}% 0, ${splitPoints[1].x}% 100%, 0 100%)`,
                `polygon(${splitPoints[0].x}% 0, 100% 0, 100% 100%, ${splitPoints[1].x}% 100%)`,
              ]

          return (
            <div
              key={`fixed-video-${video.id}-${index}`}
              className="absolute inset-0"
              style={{
                clipPath: clipPaths[index],
                zIndex: 10, // Поверх шаблона
              }}
            >
              <div className="relative h-full w-full">
                <VideoPanel
                  video={video}
                  isActive={video.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={index}
                  hideLabel={false}
                  labelPosition={index % 2 === 0 ? "left" : "right"}
                />
                {/* Скрываем метку с большим шрифтом, оставляя только 2 метки на камеру */}
              </div>
            </div>
          )
        })}

        {/* Добавляем разделительную линию с учетом угла наклона */}
        <div
          className="absolute inset-0 z-20"
          style={{
            clipPath:
              isSquare && isVertical
                ? `polygon(
              64.8% 0,
              65.2% 0,
              35.2% 100%,
              34.8% 100%
            )`
                : `polygon(
              ${splitPoints[0].x - 0.2}% 0,
              ${splitPoints[0].x + 0.2}% 0,
              ${splitPoints[1].x + 0.2}% 100%,
              ${splitPoints[1].x - 0.2}% 100%
            )`,
            backgroundColor: "#35d1c1",
            pointerEvents: "none", // Отключаем события мыши для линии
          }}
        />

        {/* Верхняя область для перетаскивания */}
        {isSquare && isVertical ? (
          <>
            {/* Верхняя область для перетаскивания (фиксированная) */}
            <div
              className="absolute z-30"
              style={{
                top: 0,
                left: "60%",
                width: "10%",
                height: "20%",
                cursor: "ew-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 0)}
            />

            {/* Центральная область для перетаскивания всей линии (фиксированная) */}
            <div
              className="absolute z-30"
              style={{
                top: "20%",
                bottom: "20%",
                left: "45%",
                width: "10%",
                transform: "skew(-15deg)",
                cursor: "col-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 2)}
            />

            {/* Нижняя область для перетаскивания (фиксированная) */}
            <div
              className="absolute z-30"
              style={{
                bottom: 0,
                left: "30%",
                width: "10%",
                height: "20%",
                cursor: "ew-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 1)}
            />
          </>
        ) : (
          <>
            {/* Верхняя область для перетаскивания */}
            <div
              className="absolute z-30"
              style={{
                top: 0,
                left: `${splitPoints[0].x - 5}%`,
                width: "10%",
                height: "20%",
                cursor: "ew-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 0)}
            />

            {/* Центральная область для перетаскивания всей линии */}
            <div
              className="absolute z-30"
              style={{
                top: "20%",
                bottom: "20%",
                left: `${Math.min(splitPoints[0].x, splitPoints[1].x) - 2}%`,
                width: `${Math.abs(splitPoints[0].x - splitPoints[1].x) + 4}%`,
                transform: `skew(${Math.atan2(splitPoints[1].x - splitPoints[0].x, 100) * (180 / Math.PI)}deg)`,
                cursor: "col-resize",
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 2)}
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
                backgroundColor: "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, 1)}
            />
          </>
        )}
      </div>
    )
  }
}
