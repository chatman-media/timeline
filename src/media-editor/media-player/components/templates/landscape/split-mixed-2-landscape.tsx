import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "Смешанное разделение (1 слева и 2 справа)" - ландшафтный формат
 * ID: split-mixed-2-landscape
 */
export function SplitMixed2Landscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
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
        {/* Левая секция */}
        <div className="w-1/2 h-full">
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </div>
        
        {/* Вертикальная разделительная линия */}
        <div className="w-[1px] h-full bg-[#35d1c1]" />
        
        {/* Правая секция */}
        <div className="w-1/2 h-full flex flex-col">
          {/* Верхняя правая секция */}
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
          
          {/* Нижняя правая секция */}
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
      <PanelGroup direction="horizontal">
        {/* Левая секция */}
        <Panel defaultSize={50} minSize={10}>
          <VideoPanel
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Правая секция */}
        <Panel defaultSize={50} minSize={10}>
          <PanelGroup direction="vertical">
            {/* Верхняя правая секция */}
            <Panel defaultSize={50} minSize={10}>
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижняя правая секция */}
            <Panel defaultSize={50} minSize={10}>
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
