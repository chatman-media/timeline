import { useMedia } from "@/hooks/use-media"

import { ActiveVideo } from "./active-video"
import { MediaFilesList } from "./media-files-list"
import { ThemeToggle } from "./layout/theme-toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { VideoMetadata } from "./video-metadata"
import { MusicFilesList } from  "./music-files-list"

export function MediaEditor() {
  const {
    activeVideo,
  } = useMedia()

  return (
    <div data-testid="media-player" className="media-editor flex flex-row ml-[40px] px-1 py-1 h-[50%]">
      <ThemeToggle />
      <div className="basis-1/4">
        <Tabs  defaultValue="media" className="w-full">
          <TabsList>
            <TabsTrigger value="media">Медиатека</TabsTrigger>
            <TabsTrigger value="music">Музыка</TabsTrigger>
            <TabsTrigger value="text">Текст</TabsTrigger>
            <TabsTrigger value="effects">Эффекты</TabsTrigger>
            <TabsTrigger value="transitions">Переходы</TabsTrigger>
            {/* <TabsTrigger value="subtitles">Субтитры</TabsTrigger> */}
          </TabsList>
          <TabsContent value="media">
            <MediaFilesList />
          </TabsContent>
          <TabsContent value="music">
            <MusicFilesList />
          </TabsContent>
          <TabsContent value="text">
            Тут будет редактор текста.
          </TabsContent>
          <TabsContent value="effects">
            Тут будут видео эффекты.
          </TabsContent>
          <TabsContent value="transitions">
            Тут будут переходы между клипами.
          </TabsContent>
          {
            /* <TabsContent value="subtitles">
            Тут будет редактор субтитров.
          </TabsContent> */
          }
        </Tabs>
      </div>
      <div className="basis-1/2">
        <div className="bg-gray-50 dark:bg-[#111111] p-4 border border-gray-200 dark:border-gray-800">
          <ActiveVideo />
        </div>
      </div>
      <div className="basis-1/4">
        <VideoMetadata probeData={activeVideo?.probeData} />
      </div>
      {
        /* <div className="flex gap-8 w-full px-2 sm:px-13 py-2">
        <div className="flex flex-col gap-4 w-[15%]">
          <div className="text-sm text-secondary-foreground bg-secondary px-3 py-1.5 rounded-md font-mono shadow-sm">
            {formatTimeWithMilliseconds(currentTime, true, true, true)}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={play}
              className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {isPlaying ? "Пауза" : "Play"}
            </button>
            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
              <span>Или нажмите P</span>
            </div>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              Камера: {activeCamera}
            </div>
            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
              <span>Нажмите номер нужной камеры</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-16 w-full px-3 sm:px-5">
        <div className="flex flex-row gap-2 justify-end">
          <div className="mt-4 flex items-center w-80">
            <button
              onClick={decreaseScale}
              className="p-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-1"
            >
              -
            </button>

            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded relative">
              <div
                className="absolute h-full bg-primary rounded"
                style={scaleStyle}
              />
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="absolute w-full h-full cursor-pointer"
              />
            </div>

            <button
              onClick={increaseScale}
              className="p-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 ml-1"
            >
              +
            </button>

            <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
              {scalePercentage}
            </span>
          </div>
        </div>
        <Timeline scale={scale} />
      </div> */
      }
    </div>
  )
}
