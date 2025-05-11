import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "3 экрана по вертикали" - ландшафтный формат
 * ID: split-vertical-3-landscape
 */
export function SplitVertical3Landscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 3);

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 3) {
    return <div className="h-full w-full bg-black" />;
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Первое видео */}
        <div className="w-1/3 h-full">
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </div>
        
        {/* Разделительная линия */}
        <div className="w-[1px] h-full bg-[#35d1c1]" />
        
        {/* Второе видео */}
        <div className="w-1/3 h-full">
          <VideoPanel
            video={validVideos[1]}
            isActive={validVideos[1]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={1}
          />
        </div>
        
        {/* Разделительная линия */}
        <div className="w-[1px] h-full bg-[#35d1c1]" />
        
        {/* Третье видео */}
        <div className="w-1/3 h-full">
          <VideoPanel
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </div>
      </div>
    );
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="horizontal">
        {/* Первая секция */}
        <Panel defaultSize={33.33} minSize={10}>
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Вторая секция */}
        <Panel defaultSize={33.33} minSize={10}>
          <VideoPanel
            video={validVideos[1]}
            isActive={validVideos[1]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={1}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Третья секция */}
        <Panel defaultSize={33.33} minSize={10}>
          <VideoPanel
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
