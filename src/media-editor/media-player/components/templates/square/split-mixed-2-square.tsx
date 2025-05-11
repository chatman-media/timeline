import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "1 слева + 2 справа" - квадратный формат
 * ID: split-mixed-2-square
 */
export function SplitMixed2Square({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
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
        {/* Левая большая секция */}
        <div className="w-1/2 h-full">
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </div>
        
        {/* Разделительная линия */}
        <div className="w-1 h-full bg-[#35d1c1]" />
        
        {/* Правая секция с 2 видео */}
        <div className="w-1/2 h-full flex flex-col">
          {/* Верхнее правое видео */}
          <div className="h-1/2 w-full">
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>
          
          {/* Горизонтальная разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />
          
          {/* Нижнее правое видео */}
          <div className="h-1/2 w-full">
            <VideoPanel
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </div>
        </div>
      </div>
    );
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="horizontal" onLayout={(sizes) => console.log('Panel sizes:', sizes)}>
        {/* Левая большая секция */}
        <Panel defaultSize={50} minSize={20}>
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
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
            <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
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
  );
}
