import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "5 экранов: вариант 2 (4 маленьких слева, 1 большой справа)" - ландшафтный формат
 * ID: split-custom-5-2-landscape
 */
export function SplitCustom52Landscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
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
      <div className="flex h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Левая секция (4 маленьких видео) */}
        <div className="w-1/2 h-full flex flex-col">
          {/* Верхняя левая секция */}
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
          
          {/* Нижняя левая секция */}
          <div className="h-1/2 w-full flex flex-col">
            {/* Верхняя часть нижней левой секции */}
            <div className="h-1/2 w-full flex">
              {/* Левое видео */}
              <div className="w-1/2 h-full">
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </div>
              
              {/* Вертикальная разделительная линия */}
              <div className="w-[1px] h-full bg-[#35d1c1]" />
              
              {/* Правое видео */}
              <div className="w-1/2 h-full">
                <VideoPanel
                  video={validVideos[2]}
                  isActive={validVideos[2]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={2}
                />
              </div>
            </div>
            
            {/* Горизонтальная разделительная линия */}
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            
            {/* Нижняя часть нижней левой секции */}
            <div className="h-1/2 w-full">
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </div>
          </div>
        </div>
        
        {/* Разделительная линия */}
        <div className="w-[1px] h-full bg-[#35d1c1]" />
        
        {/* Правая секция (большое видео) */}
        <div className="w-1/2 h-full">
          <VideoPanel
            video={validVideos[4]}
            isActive={validVideos[4]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={4}
          />
        </div>
      </div>
    );
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="horizontal">
        {/* Левая секция (4 маленьких видео) */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="vertical">
            {/* Верхняя левая секция */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижняя левая секция */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="vertical">
                {/* Верхняя часть нижней левой секции */}
                <Panel defaultSize={50} minSize={10}>
                  <PanelGroup direction="horizontal">
                    {/* Левое видео */}
                    <Panel defaultSize={50} minSize={10}>
                      <VideoPanel
                        video={validVideos[1]}
                        isActive={validVideos[1]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={1}
                      />
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                    {/* Правое видео */}
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
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                {/* Нижняя часть нижней левой секции */}
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
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Правая секция (большое видео) */}
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
  );
}
