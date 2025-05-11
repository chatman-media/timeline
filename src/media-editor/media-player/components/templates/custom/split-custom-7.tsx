import React from "react"
import { useTranslation } from "react-i18next"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanel } from "@/media-editor/media-player/components/templates/common"

import { TemplateProps } from "../types"

/**
 * Универсальный шаблон "7 экранов" (варианты 1-4)
 * Поддерживает квадратный формат
 *
 * Варианты:
 * 1. Большой экран справа внизу, 6 маленьких экранов слева и сверху (split-custom-7-1-square)
 * 2. Большой экран слева внизу, 6 маленьких экранов справа и сверху (split-custom-7-2-square)
 * 3. Большой экран слева вверху, 6 маленьких экранов справа и снизу (split-custom-7-3-square)
 * 4. Большой экран справа вверху, 6 маленьких экранов слева и снизу (split-custom-7-4-square)
 */
export function SplitCustom7({
  videos,
  activeVideoId,
  videoRefs,
  isResizable = true,
  templateId,
}: TemplateProps & { templateId?: string }) {
  // Используем хук для локализации
  const { t, i18n } = useTranslation()

  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v && v.path)
  const videoCount = Math.min(validVideos.length, 7)

  // Определяем вариант шаблона на основе ID
  // Формат ID: split-custom-7-1-square, split-custom-7-2-square и т.д.
  // Извлекаем номер варианта (1, 2, 3, 4) из ID
  const variant = templateId ? parseInt(templateId.split("-")[3] || "1") : 1

  // Получаем локализованное название шаблона
  const templateName = t(`templates.custom7_${variant}`)

  console.log(`[SplitCustom7] Рендеринг шаблона ${templateId} (${templateName}) с параметрами:`, {
    variant,
    isResizable,
    language: i18n.language,
  })

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 7) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    // Вариант 1: Большой экран справа внизу
    if (variant === 1) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Верхний ряд (3 видео) */}
          <div className="absolute top-0 right-0 left-0 flex h-1/2">
            {/* Верхнее левое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Верхнее среднее видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Верхнее правое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
          </div>

          {/* Горизонтальная линия */}
          <div className="absolute top-1/2 right-0 left-0 h-[1px] bg-[#35d1c1]" />

          {/* Нижняя левая секция (3 видео) */}
          <div className="absolute bottom-0 left-0 flex h-1/2 w-1/2 flex-col">
            {/* Среднее левое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Среднее среднее видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Нижнее левое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[5]}
                isActive={validVideos[5]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={5}
              />
            </div>
          </div>

          {/* Вертикальная линия */}
          <div className="absolute top-1/2 bottom-0 left-1/2 w-[1px] bg-[#35d1c1]" />

          {/* Большой экран (правый нижний) */}
          <div className="absolute right-0 bottom-0 h-1/2 w-1/2">
            <VideoPanel
              video={validVideos[6]}
              isActive={validVideos[6]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={6}
            />
          </div>
        </div>
      )
    }
    // Вариант 2: Большой экран слева внизу
    else if (variant === 2) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Верхний ряд (3 видео) */}
          <div className="absolute top-0 right-0 left-0 flex h-1/2">
            {/* Верхнее левое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Верхнее среднее видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Верхнее правое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
          </div>

          {/* Горизонтальная линия */}
          <div className="absolute top-1/2 right-0 left-0 h-[1px] bg-[#35d1c1]" />

          {/* Большой экран (левый нижний) */}
          <div className="absolute bottom-0 left-0 h-1/2 w-1/2">
            <VideoPanel
              video={validVideos[6]}
              isActive={validVideos[6]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={6}
            />
          </div>

          {/* Вертикальная линия */}
          <div className="absolute top-1/2 bottom-0 left-1/2 w-[1px] bg-[#35d1c1]" />

          {/* Нижняя правая секция (3 видео) */}
          <div className="absolute right-0 bottom-0 flex h-1/2 w-1/2 flex-col">
            {/* Среднее правое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Среднее среднее видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Нижнее правое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[5]}
                isActive={validVideos[5]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={5}
              />
            </div>
          </div>
        </div>
      )
    }
    // Вариант 3: Большой экран слева вверху
    else if (variant === 3) {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Большой экран (левый верхний) */}
          <div className="absolute top-0 left-0 h-1/2 w-1/2">
            <VideoPanel
              video={validVideos[6]}
              isActive={validVideos[6]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={6}
            />
          </div>

          {/* Вертикальная линия */}
          <div className="absolute top-0 bottom-1/2 left-1/2 w-[1px] bg-[#35d1c1]" />

          {/* Верхняя правая секция (3 видео) */}
          <div className="absolute top-0 right-0 flex h-1/2 w-1/2 flex-col">
            {/* Верхнее правое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Среднее правое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Нижнее правое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
          </div>

          {/* Горизонтальная линия */}
          <div className="absolute top-1/2 right-0 left-0 h-[1px] bg-[#35d1c1]" />

          {/* Нижний ряд (3 видео) */}
          <div className="absolute right-0 bottom-0 left-0 flex h-1/2">
            {/* Нижнее левое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Нижнее среднее видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Нижнее правое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[5]}
                isActive={validVideos[5]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={5}
              />
            </div>
          </div>
        </div>
      )
    }
    // Вариант 4: Большой экран справа вверху
    else {
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Верхняя левая секция (3 видео) */}
          <div className="absolute top-0 left-0 flex h-1/2 w-1/2 flex-col">
            {/* Верхнее левое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Среднее левое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </div>
            <div className="h-[1px] w-full bg-[#35d1c1]" />
            {/* Нижнее левое видео */}
            <div className="h-1/3 w-full">
              <VideoPanel
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </div>
          </div>

          {/* Вертикальная линия */}
          <div className="absolute top-0 bottom-1/2 left-1/2 w-[1px] bg-[#35d1c1]" />

          {/* Большой экран (правый верхний) */}
          <div className="absolute top-0 right-0 h-1/2 w-1/2">
            <VideoPanel
              video={validVideos[6]}
              isActive={validVideos[6]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={6}
            />
          </div>

          {/* Горизонтальная линия */}
          <div className="absolute top-1/2 right-0 left-0 h-[1px] bg-[#35d1c1]" />

          {/* Нижний ряд (3 видео) */}
          <div className="absolute right-0 bottom-0 left-0 flex h-1/2">
            {/* Нижнее левое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[3]}
                isActive={validVideos[3]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={3}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Нижнее среднее видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </div>
            <div className="h-full w-[1px] bg-[#35d1c1]" />
            {/* Нижнее правое видео */}
            <div className="h-full w-1/3">
              <VideoPanel
                video={validVideos[5]}
                isActive={validVideos[5]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={5}
              />
            </div>
          </div>
        </div>
      )
    }
  }

  // Реализация с возможностью изменения размеров
  // Вариант 1: Большой экран справа внизу
  if (variant === 1) {
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция (3 видео) */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Верхнее левое видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[0]}
                  isActive={validVideos[0]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={0}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Верхнее среднее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Верхнее правое видео */}
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
          {/* Нижняя секция */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Нижняя левая секция (3 видео) */}
              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  {/* Среднее левое видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[3]}
                      isActive={validVideos[3]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={3}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Среднее среднее видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[4]}
                      isActive={validVideos[4]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={4}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Нижнее левое видео */}
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
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Большой экран (правый нижний) */}
              <Panel defaultSize={50} minSize={20}>
                <VideoPanel
                  video={validVideos[6]}
                  isActive={validVideos[6]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={6}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    )
  }
  // Вариант 2: Большой экран слева внизу
  else if (variant === 2) {
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция (3 видео) */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Верхнее левое видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[0]}
                  isActive={validVideos[0]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={0}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Верхнее среднее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[1]}
                  isActive={validVideos[1]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={1}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Верхнее правое видео */}
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
          {/* Нижняя секция */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Большой экран (левый нижний) */}
              <Panel defaultSize={50} minSize={20}>
                <VideoPanel
                  video={validVideos[6]}
                  isActive={validVideos[6]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={6}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижняя правая секция (3 видео) */}
              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  {/* Среднее правое видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[3]}
                      isActive={validVideos[3]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={3}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Среднее среднее видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[4]}
                      isActive={validVideos[4]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={4}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Нижнее правое видео */}
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
          </Panel>
        </PanelGroup>
      </div>
    )
  }
  // Вариант 3: Большой экран слева вверху
  else if (variant === 3) {
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Большой экран (левый верхний) */}
              <Panel defaultSize={50} minSize={20}>
                <VideoPanel
                  video={validVideos[6]}
                  isActive={validVideos[6]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={6}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Верхняя правая секция (3 видео) */}
              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  {/* Верхнее правое видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[0]}
                      isActive={validVideos[0]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={0}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Среднее правое видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[1]}
                      isActive={validVideos[1]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={1}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Нижнее правое видео */}
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
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Нижняя секция (3 видео) */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Нижнее левое видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[3]}
                  isActive={validVideos[3]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={3}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижнее среднее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[4]}
                  isActive={validVideos[4]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={4}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижнее правое видео */}
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
    )
  }
  // Вариант 4: Большой экран справа вверху
  else {
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Верхняя секция */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Верхняя левая секция (3 видео) */}
              <Panel defaultSize={50} minSize={20}>
                <PanelGroup direction="vertical">
                  {/* Верхнее левое видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[0]}
                      isActive={validVideos[0]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={0}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Среднее левое видео */}
                  <Panel defaultSize={33.33} minSize={10}>
                    <VideoPanel
                      video={validVideos[1]}
                      isActive={validVideos[1]?.id === activeVideoId}
                      videoRefs={videoRefs}
                      index={1}
                    />
                  </Panel>
                  <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                  {/* Нижнее левое видео */}
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
              {/* Большой экран (правый верхний) */}
              <Panel defaultSize={50} minSize={20}>
                <VideoPanel
                  video={validVideos[6]}
                  isActive={validVideos[6]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={6}
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
          {/* Нижняя секция (3 видео) */}
          <Panel defaultSize={50} minSize={20}>
            <PanelGroup direction="horizontal">
              {/* Нижнее левое видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[3]}
                  isActive={validVideos[3]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={3}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижнее среднее видео */}
              <Panel defaultSize={33.33} minSize={10}>
                <VideoPanel
                  video={validVideos[4]}
                  isActive={validVideos[4]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={4}
                />
              </Panel>
              <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              {/* Нижнее правое видео */}
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
    )
  }
}
