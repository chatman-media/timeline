import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "Диагональное разделение" - ландшафтный формат
 * ID: split-diagonal-landscape
 */
export function SplitDiagonalLandscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 2);

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 2) {
    return <div className="h-full w-full bg-black" />;
  }

  // Состояние для хранения текущего положения диагональной линии
  const [splitPoints, setSplitPoints] = useState<{x: number, y: number}[]>([
    { x: 66.67, y: 0 }, // Начальная точка (2/3 от левого края, верх)
    { x: 33.33, y: 100 } // Конечная точка (1/3 от левого края, низ)
  ]);

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

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Первый экран (левый) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "#000",
            clipPath: "polygon(0 0, 66.67% 0, 33.33% 100%, 0 100%)",
            zIndex: 10,
            overflow: "hidden"
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
            clipPath: "polygon(66.57% 0, 66.77% 0, 33.43% 100%, 33.23% 100%)",
            backgroundColor: "#35d1c1",
          }}
        />

        {/* Второй экран (правый) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "#000",
            clipPath: "polygon(66.67% 0, 100% 0, 100% 100%, 33.33% 100%)",
            zIndex: 10
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
    );
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div
      ref={diagonalContainerRef}
      className="relative h-full w-full"
      style={{ border: "1px solid #35d1c1" }}
    >
      {/* Рендерим видео */}
      {validVideos.slice(0, videoCount).map((video, index) => {
        // Создаем clipPath для видео на основе текущего положения линии
        const clipPaths = [
          `polygon(0 0, ${splitPoints[0].x}% 0, ${splitPoints[1].x}% 100%, 0 100%)`,
          `polygon(${splitPoints[0].x}% 0, 100% 0, 100% 100%, ${splitPoints[1].x}% 100%)`
        ];

        return (
          <div
            key={`fixed-video-${video.id}-${index}`}
            className="absolute inset-0"
            style={{
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

      {/* Добавляем разделительную линию с учетом угла наклона */}
      <div
        className="absolute inset-0 z-20"
        style={{
          clipPath: `polygon(
            ${splitPoints[0].x - 0.2}% 0,
            ${splitPoints[0].x + 0.2}% 0,
            ${splitPoints[1].x + 0.2}% 100%,
            ${splitPoints[1].x - 0.2}% 100%
          )`,
          backgroundColor: "#35d1c1",
          pointerEvents: "none" // Отключаем события мыши для линии
        }}
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
          backgroundColor: "transparent"
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
          backgroundColor: "transparent"
        }}
        onMouseDown={(e) => handleMouseDown(e, 1)}
      />
    </div>
  );
}
