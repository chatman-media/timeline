import { Pause, Play, PlusSquare } from "lucide-react"
import { useState } from "react"

import { useMedia } from "@/hooks/use-media"
import {
  formatFileSize,
  formatTime,
  formatTimeWithMilliseconds,
  parseFileNameDateTime,
} from "@/lib/utils"

import { Button } from "../ui/button"
import { TrackControls } from "./track-controls"

export function MediaFilesList() {
  const { media, videos, isLoading } = useMedia()
  const [playingFileId, setPlayingFileId] = useState<string | null>(null)

  const handlePlayPause = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation()
    setPlayingFileId((current) => current === fileName ? null : fileName)
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Загрузка файлов...</p>
      </div>
    )
  }

  if (!media?.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Нет доступных файлов</p>
      </div>
    )
  }

  console.log(media)
  return (
    <>
      <div className="px-0 h-[calc(40vh-35px)] overflow-y-auto">
        <div className="space-y-2 bg-gray-50 dark:bg-gray-900">
          {media.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 p-0 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group"
            >
              <TrackControls
                iconSize={3}
                onAddToTrack={(e) => {
                  e.stopPropagation()
                  // TODO: Добавить обработчик добавления в трек
                }}
                onRemoveFromTrack={(e) => {
                  e.stopPropagation()
                  // TODO: Добавить обработчик удаления из трека
                }}
              />
              <div className="relative">
                {file.thumbnail
                  ? (
                    <div className="w-15 h-15 flex-shrink-0">
                      <video
                        src={file.path}
                        className="w-full h-full object-cover rounded"
                        // muted
                        loop
                        playsInline
                        autoPlay={playingFileId === file.name}
                        key={playingFileId === file.name ? "playing" : "stopped"}
                      />
                    </div>
                  )
                  : (
                    <div className="w-15 h-15 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500 dark:text-gray-400"
                      >
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  )}
                <button
                  onClick={(e) => handlePlayPause(e, file.name)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded cursor-pointer"
                >
                  {playingFileId === file.name
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white" />}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-900 dark:text-gray-100 min-w-12 text-right">
                    {file.probeData?.format.size && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.probeData.format.size)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {(() => {
                      const fileDate = parseFileNameDateTime(file.name)
                      return fileDate
                        ? formatTimeWithMilliseconds(fileDate.getTime() / 1000, true, true, false)
                        : formatTimeWithMilliseconds(
                          file.probeData?.format.creation_time || 0,
                          true,
                          true,
                          false,
                        )
                    })()}
                  </span>

                  <p className="text-xs">
                    {file.isVideo && file.probeData?.streams?.[0] && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        {file.probeData.streams[0].width}x{file.probeData.streams[0].height}
                      </span>
                    )}
                    {file.probeData?.format.duration && (
                      <span className="text-gray-500 dark:text-gray-400 ml-4">
                        {formatTime(file.probeData.format.duration)}
                      </span>
                    )}
                  </p>

                  {
                    /* {file.probeData?.streams[0].codec_name && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      {file.probeData.streams[0].codec_name}
                    </span>
                  )} */
                  }
                  {
                    /* {file.probeData?.streams[0].display_aspect_ratio && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      {file.probeData.streams[0].display_aspect_ratio}
                    </span>
                  )} */
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* строка состояния и кнопка добавления всех файлов в трек */}
      <div className="flex justify-between items-center p-0 text-sm m-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Видео: {media.filter((file) => file.probeData?.streams?.[0]?.codec_type === "video").length} | Аудио:{" "}
          {media.filter((file) => file.probeData?.streams?.[0]?.codec_type === "audio").length}
        </span>
        <div className="flex items-center gap-2 group">
          <span className="text-xs text-gray-500 dark:text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity">
            Добавить все
          </span>
          <Button
            variant="secondary"
            size="icon"
            className="w-4 h-4 hover:bg-background/90 border-0 bg-transparent rounded flex items-center cursor-pointer group inset-0 text-sm text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
            onClick={() => {/* TODO: implement add all files */}}
          >
            <PlusSquare />
          </Button>
        </div>
      </div>
    </>
  )
}
