import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TemplateProps } from '../types';
import { VideoPanel } from '@/media-editor/media-player/components/templates/common';

/**
 * Шаблон "Сетка 3x4" (12 экранов)
 * Поддерживает как ландшафтный (3x4), так и портретный (4x3) режимы
 */
export function SplitGrid3x4({ videos, activeVideoId, videoRefs, isResizable = true, templateId }: TemplateProps & { templateId?: string }) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter(v => v && v.path);
  const videoCount = Math.min(validVideos.length, 12);

  // Определяем ориентацию и тип шаблона на основе ID шаблона
  const isPortrait = templateId ? templateId.includes('portrait') : false;
  const isSquare = templateId ? templateId.includes('square') : false;
  const isLandscape = templateId ? templateId.includes('landscape') : false;

  // Определяем, является ли шаблон 4x3 или 3x4
  const is4x3 = templateId ? templateId.includes('4x3') : false;
  const is3x4 = templateId ? templateId.includes('3x4') : true; // По умолчанию считаем 3x4

  console.log(`[SplitGrid3x4] Рендеринг шаблона ${templateId} с параметрами:`, {
    isPortrait, isSquare, isLandscape, is4x3, is3x4
  });

  // Если нет видео вообще, возвращаем пустой div
  if (videoCount === 0) {
    return <div className="h-full w-full bg-black" />;
  }

  // Если видео меньше 12, заполняем оставшиеся ячейки пустыми видео
  const filledVideos = [...validVideos];
  while (filledVideos.length < 12) {
    filledVideos.push({ id: `empty-${filledVideos.length}`, path: '' } as any);
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    // Для портретного режима 4x3 или квадратного режима 4x3
    if ((isPortrait && is4x3) || (isSquare && is4x3)) {
      console.log(`[SplitGrid3x4] Рендеринг в режиме 4x3 (портретный или квадратный)`);
      // Портретный режим (4x3)
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 12).map((video, index) => {
            const col = Math.floor(index / 3);
            const row = index % 3;

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 33.33}%`,
                  left: `${col * 25}%`,
                  width: "25%",
                  height: "33.33%",
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
          {[1, 2, 3].map((i) => (
            <div
              key={`v-line-${i}`}
              className="absolute inset-y-0 z-20"
              style={{
                left: `${i * 25}%`,
                width: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />
          ))}

          {/* Горизонтальные линии */}
          {[1, 2].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 33.33}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      );
    } else if (isPortrait && is3x4) {
      console.log(`[SplitGrid3x4] Рендеринг в режиме 3x4 (портретный)`);
      // Портретный режим (3x4) - 3 колонки и 4 ряда
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 12).map((video, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 25}%`,
                  left: `${col * 33.33}%`,
                  width: "33.33%",
                  height: "25%",
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
          {[1, 2].map((i) => (
            <div
              key={`v-line-${i}`}
              className="absolute inset-y-0 z-20"
              style={{
                left: `${i * 33.33}%`,
                width: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8, // Делаем линии тоньше (прозрачнее)
              }}
            />
          ))}

          {/* Горизонтальные линии */}
          {[1, 2, 3].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 25}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8, // Делаем линии тоньше (прозрачнее)
              }}
            />
          ))}
        </div>
      );
    } else if ((isLandscape && is3x4) || (isSquare && is3x4)) {
      console.log(`[SplitGrid3x4] Рендеринг в режиме 3x4 (ландшафтный или квадратный)`);
      // Ландшафтный режим (3x4) или квадратный режим по умолчанию
      return (
        <div className="relative h-full w-full" style={{ border: "1px solid #35d1c1" }}>
          {/* Рендерим видео */}
          {filledVideos.slice(0, 12).map((video, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;

            return (
              <div
                key={`fixed-video-${video.id}-${index}`}
                className="absolute"
                style={{
                  top: `${row * 25}%`,
                  left: `${col * 33.33}%`,
                  width: "33.33%",
                  height: "25%",
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
          {[1, 2].map((i) => (
            <div
              key={`v-line-${i}`}
              className="absolute inset-y-0 z-20"
              style={{
                left: `${i * 33.33}%`,
                width: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />
          ))}

          {/* Горизонтальные линии */}
          {[1, 2, 3].map((i) => (
            <div
              key={`h-line-${i}`}
              className="absolute inset-x-0 z-20"
              style={{
                top: `${i * 25}%`,
                height: "1px",
                backgroundColor: "#35d1c1",
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      );
    }
  }

  // Рендеринг в режиме с возможностью изменения размеров
  // Для портретного режима 4x3 или квадратного режима 4x3
  console.log(`[SplitGrid3x4] Рендеринг в режиме resizable для шаблона ${templateId}`);
  if ((isPortrait && is4x3) || (isSquare && is4x3)) {
    // Портретный режим (4x3)
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="horizontal">
          {/* Колонки */}
          {[0, 1, 2, 3].map((colIndex) => (
            <React.Fragment key={`col-${colIndex}`}>
              <Panel defaultSize={25} minSize={10}>
                <PanelGroup direction="vertical">
                  {[0, 1, 2].map((rowIndex) => {
                    const videoIndex = colIndex * 3 + rowIndex;
                    return (
                      <React.Fragment key={`cell-${videoIndex}`}>
                        <Panel defaultSize={33.33} minSize={10}>
                          <VideoPanel
                            video={filledVideos[videoIndex]}
                            isActive={filledVideos[videoIndex]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={videoIndex}
                          />
                        </Panel>
                        {rowIndex < 2 && (
                          <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              </Panel>
              {colIndex < 3 && (
                <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    );
  } else if (isPortrait && is3x4) {
    console.log(`[SplitGrid3x4] Рендеринг в режиме resizable 3x4 (портретный)`);
    // Портретный режим (3x4) - 3 колонки и 4 ряда
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Ряды */}
          {[0, 1, 2, 3].map((rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              <Panel defaultSize={25} minSize={10}>
                <PanelGroup direction="horizontal">
                  {[0, 1, 2].map((colIndex) => {
                    const videoIndex = rowIndex * 3 + colIndex;
                    return (
                      <React.Fragment key={`cell-${videoIndex}`}>
                        <Panel defaultSize={33.33} minSize={10}>
                          <VideoPanel
                            video={filledVideos[videoIndex]}
                            isActive={filledVideos[videoIndex]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={videoIndex}
                          />
                        </Panel>
                        {colIndex < 2 && (
                          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              </Panel>
              {rowIndex < 3 && (
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    );
  } else if ((isLandscape && is3x4) || (isSquare && is3x4)) {
    console.log(`[SplitGrid3x4] Рендеринг в режиме resizable 3x4 (ландшафтный или квадратный)`);
    // Ландшафтный режим (3x4) или квадратный режим по умолчанию
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Ряды */}
          {[0, 1, 2, 3].map((rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              <Panel defaultSize={25} minSize={10}>
                <PanelGroup direction="horizontal">
                  {[0, 1, 2].map((colIndex) => {
                    const videoIndex = rowIndex * 3 + colIndex;
                    return (
                      <React.Fragment key={`cell-${videoIndex}`}>
                        <Panel defaultSize={33.33} minSize={10}>
                          <VideoPanel
                            video={filledVideos[videoIndex]}
                            isActive={filledVideos[videoIndex]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={videoIndex}
                          />
                        </Panel>
                        {colIndex < 2 && (
                          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              </Panel>
              {rowIndex < 3 && (
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    );
  } else {
    // Если ни одно из условий не выполнилось, используем режим 3x4 по умолчанию
    console.log(`[SplitGrid3x4] Рендеринг в режиме по умолчанию (3x4)`);
    return (
      <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
        <PanelGroup direction="vertical">
          {/* Ряды */}
          {[0, 1, 2, 3].map((rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              <Panel defaultSize={25} minSize={10}>
                <PanelGroup direction="horizontal">
                  {[0, 1, 2].map((colIndex) => {
                    const videoIndex = rowIndex * 3 + colIndex;
                    return (
                      <React.Fragment key={`cell-${videoIndex}`}>
                        <Panel defaultSize={33.33} minSize={10}>
                          <VideoPanel
                            video={filledVideos[videoIndex]}
                            isActive={filledVideos[videoIndex]?.id === activeVideoId}
                            videoRefs={videoRefs}
                            index={videoIndex}
                          />
                        </Panel>
                        {colIndex < 2 && (
                          <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </PanelGroup>
              </Panel>
              {rowIndex < 3 && (
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      </div>
    );
  }
}
