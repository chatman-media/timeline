import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "Сетка 3x2" (6 экранов)
 * Поддерживает как ландшафтный (3x2), так и портретный (2x3) режимы
 */
export function SplitGrid3x2({ videos, activeVideoId, videoRefs, isResizable = true, templateId }: TemplateProps & { templateId?: string }) {
  // Определяем ориентацию на основе ID шаблона
  const isPortrait = templateId ? templateId.includes('portrait') : false;
  const isSquare = templateId ? templateId.includes('square') : false;
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 6);

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 6) {
    return <div className="h-full w-full bg-black" />;
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    if (isPortrait || (isSquare && templateId?.includes('2x3'))) {
      // Портретный режим (2x3)
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {validVideos.slice(0, videoCount).map((video, index) => {
            // Вычисляем позицию и размер для каждого видео
            const col = Math.floor(index / 3);
            const row = index % 3;

            const style = {
              top: `${row * 33.33}%`,
              left: `${col * 50}%`,
              width: '50%',
              height: '33.33%',
            };

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: style.top,
                  left: style.left,
                  width: style.width,
                  height: style.height,
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
            );
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
      );
    } else {
      // Ландшафтный режим (3x2) или квадратный режим по умолчанию
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {validVideos.slice(0, videoCount).map((video, index) => {
            // Вычисляем позицию и размер для каждого видео
            const row = Math.floor(index / 3);
            const col = index % 3;

            const style = {
              top: `${row * 50}%`,
              left: `${col * 33.33}%`,
              width: '33.33%',
              height: '50%',
            };

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: style.top,
                  left: style.left,
                  width: style.width,
                  height: style.height,
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
            );
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
      );
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров
  if (isPortrait || (isSquare && templateId?.includes('2x3'))) {
    // Портретный режим (2x3)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="horizontal">
          {/* Левая колонка */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="vertical">
              {/* Верхний левый экран */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[0]}
                  isActive={validVideos[0]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={0}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Средний левый экран */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижний левый экран */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[2]}
                  isActive={validVideos[2]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={2}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Правая колонка */}
          <Panel defaultSize={50} minSize={10}>
            <PanelGroup direction="vertical">
              {/* Верхний правый экран */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[3]}
                  isActive={validVideos[3]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={3}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Средний правый экран */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[4]}
                  isActive={validVideos[4]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={4}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижний правый экран */}
              <Panel defaultSize={33.33} minSize={10}>
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
    );
  } else {
    // Ландшафтный режим (3x2) или квадратный режим по умолчанию
    return (
    <div className="h-full w-full" style={{ border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {/* Верхний ряд */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal">
            {/* Левое верхнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Среднее верхнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Правое верхнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижний ряд */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="horizontal">
            {/* Левое нижнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Среднее нижнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Правое нижнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
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
  );
  }
}
