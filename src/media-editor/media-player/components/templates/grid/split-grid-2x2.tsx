import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "Сетка 2x2" (4 экрана)
 * Поддерживает как ландшафтный (2x2), так и портретный (2x2) и квадратный (2x2) режимы
 */
export function SplitGrid2x2({ videos, activeVideoId, videoRefs, isResizable = true, templateId }: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 4);

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 4) {
    return <div className="h-full w-full bg-black" />;
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex flex-col h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Верхний ряд */}
        <div className="h-1/2 w-full flex">
          {/* Верхний левый экран */}
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
          
          {/* Верхний правый экран */}
          <div className="w-1/2 h-full">
            <VideoPanel
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>
        </div>
        
        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />
        
        {/* Нижний ряд */}
        <div className="h-1/2 w-full flex">
          {/* Нижний левый экран */}
          <div className="w-1/2 h-full">
            <VideoPanel
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </div>
          
          {/* Вертикальная разделительная линия */}
          <div className="w-[1px] h-full bg-[#35d1c1]" />
          
          {/* Нижний правый экран */}
          <div className="w-1/2 h-full">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>
        </div>
      </div>
    );
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {/* Верхний ряд */}
        <Panel defaultSize={50} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Верхний левый экран */}
            <Panel defaultSize={50} minSize={10}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Верхний правый экран */}
            <Panel defaultSize={50} minSize={10}>
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижний ряд */}
        <Panel defaultSize={50} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Нижний левый экран */}
            <Panel defaultSize={50} minSize={10}>
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижний правый экран */}
            <Panel defaultSize={50} minSize={10}>
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
  );
}
