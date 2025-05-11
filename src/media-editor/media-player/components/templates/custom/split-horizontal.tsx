import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '../common';

/**
 * Универсальный шаблон "2 экрана по горизонтали"
 * Поддерживает все форматы: landscape, portrait, square
 */
export function SplitHorizontal({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 2);

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 2) {
    return <div className="h-full w-full bg-black" />;
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex flex-col h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Верхняя секция */}
        <div className="h-1/2 w-full">
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </div>
        
        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />
        
        {/* Нижняя секция */}
        <div className="h-1/2 w-full">
          <VideoPanel
            video={validVideos[1]}
            isActive={validVideos[1]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={1}
          />
        </div>
      </div>
    );
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {/* Верхняя секция */}
        <Panel defaultSize={50} minSize={20}>
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижняя секция */}
        <Panel defaultSize={50} minSize={20}>
          <VideoPanel
            video={validVideos[1]}
            isActive={validVideos[1]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={1}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
