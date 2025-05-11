import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "5 экранов: вариант 3 (средний на всю ширину, верхний и нижний ряды по 2 экрана)" - ландшафтный формат
 * ID: split-custom-5-3-landscape
 */
export function SplitCustom53Landscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 5);

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 5) {
    return <div className="h-full w-full bg-black" />;
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex flex-col h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Верхний ряд */}
        <div className="h-1/3 w-full flex">
          {/* Верхнее левое видео */}
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
          
          {/* Верхнее правое видео */}
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
        
        {/* Средний ряд (на всю ширину) */}
        <div className="h-1/3 w-full">
          <VideoPanel
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </div>
        
        {/* Горизонтальная разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />
        
        {/* Нижний ряд */}
        <div className="h-1/3 w-full flex">
          {/* Нижнее левое видео */}
          <div className="w-1/2 h-full">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>
          
          {/* Вертикальная разделительная линия */}
          <div className="w-[1px] h-full bg-[#35d1c1]" />
          
          {/* Нижнее правое видео */}
          <div className="w-1/2 h-full">
            <VideoPanel
              video={validVideos[4]}
              isActive={validVideos[4]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={4}
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
        <Panel defaultSize={33.33} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Верхнее левое видео */}
            <Panel defaultSize={50} minSize={10}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Верхнее правое видео */}
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
        {/* Средний ряд (на всю ширину) */}
        <Panel defaultSize={33.33} minSize={10}>
          <VideoPanel
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Нижний ряд */}
        <Panel defaultSize={33.33} minSize={10}>
          <PanelGroup direction="horizontal">
            {/* Нижнее левое видео */}
            <Panel defaultSize={50} minSize={10}>
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижнее правое видео */}
            <Panel defaultSize={50} minSize={10}>
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
  );
}
