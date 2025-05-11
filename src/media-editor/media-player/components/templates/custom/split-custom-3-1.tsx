import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Универсальный шаблон "3+1" (4 экрана)
 * Поддерживает следующие варианты:
 * - "3 сверху + 1 снизу" (split-3-1-landscape, split-3-1-square)
 * - "1 сверху + 3 снизу" (split-1-3-bottom-portrait, split-1-3-bottom-square)
 */
export function SplitCustom31({ videos, activeVideoId, videoRefs, isResizable = true, templateId }: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 4);

  // Определяем тип шаблона на основе ID
  const isBottomLayout = templateId ? templateId.includes('1-3-bottom') : false;

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 4) {
    return <div className="h-full w-full bg-black" />;
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    if (isBottomLayout) {
      // Шаблон "1 сверху + 3 снизу"
      return (
        <div className="flex flex-col h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Верхняя секция (большое видео) */}
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
          
          {/* Нижняя секция (3 маленьких видео) */}
          <div className="h-1/2 w-full flex">
            {/* Левое нижнее видео */}
            <div className="w-1/3 h-full">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>
            
            {/* Вертикальная разделительная линия */}
            <div className="w-[1px] h-full bg-[#35d1c1]" />
            
            {/* Среднее нижнее видео */}
            <div className="w-1/3 h-full">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
            
            {/* Вертикальная разделительная линия */}
            <div className="w-[1px] h-full bg-[#35d1c1]" />
            
            {/* Правое нижнее видео */}
            <div className="w-1/3 h-full">
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
    } else {
      // Шаблон "3 сверху + 1 снизу"
      return (
        <div className="flex flex-col h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Верхняя секция (3 маленьких видео) */}
          <div className="h-1/2 w-full flex">
            {/* Левое верхнее видео */}
            <div className="w-1/3 h-full">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>
            
            {/* Вертикальная разделительная линия */}
            <div className="w-[1px] h-full bg-[#35d1c1]" />
            
            {/* Среднее верхнее видео */}
            <div className="w-1/3 h-full">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>
            
            {/* Вертикальная разделительная линия */}
            <div className="w-[1px] h-full bg-[#35d1c1]" />
            
            {/* Правое верхнее видео */}
            <div className="w-1/3 h-full">
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
          
          {/* Нижняя секция (большое видео) */}
          <div className="h-1/2 w-full">
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </div>
        </div>
      );
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров
  if (isBottomLayout) {
    // Шаблон "1 сверху + 3 снизу"
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция (большое видео) */}
          <Panel defaultSize={50} minSize={20}>
            <VideoPanel
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Нижняя секция (3 маленьких видео) */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Левое нижнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Среднее нижнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[2]}
                  isActive={validVideos[2]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={2}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Правое нижнее видео */}
              <Panel defaultSize={33.33} minSize={10}>
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
  } else {
    // Шаблон "3 сверху + 1 снизу"
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция (3 маленьких видео) */}
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
          {/* Нижняя секция (большое видео) */}
          <Panel defaultSize={50} minSize={20}>
            <VideoPanel
              video={validVideos[3]}
              isActive={validVideos[3]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={3}
            />
          </Panel>
        </PanelGroup>
      </div>
    );
  }
}
