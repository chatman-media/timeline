import { memo } from "react"

import {
  formatBitrate,
  formatDuration,
  formatFileSize,
  formatTimeWithMilliseconds,
} from "@/lib/utils"
import { MediaFile } from "@/types/media"
import { getAspectRatio, getFps } from "@/utils/video-utils"

interface FileMetadataProps {
  file: MediaFile
  size?: number
}

/**
 * Компонент для отображения метаданных файла
 *
 * @param file - Объект файла с метаданными
 * @param size - Размер контейнера в пикселях
 */
export const FileMetadata = memo(function FileMetadata({ file, size = 100 }: FileMetadataProps) {
  const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")
  console.log(file)

  return (
    <div className="grid grid-rows-2 w-full overflow-hidden" style={{ height: `${size}px` }}>
      <div className="flex justify-between w-full p-2">
        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{file.name}</p>
        {!file.isImage && file.probeData?.format.duration && (
          <p
            className="font-medium flex-shrink-0"
            style={{ fontSize: size > 100 ? `13px` : "12px" }}
          >
            {formatDuration(file.probeData.format.duration, 3, true)}
          </p>
        )}

        {file.isImage && file.createdAt && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-shrink-0 whitespace-nowrap">
            {new Date(file.createdAt).toLocaleDateString("ru-RU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {file.isVideo ? (
        <div className="flex items-end w-full p-2">
          <span className="text-xs text-gray-700 dark:text-gray-200 flex-shrink-0 whitespace-nowrap">
            {formatTimeWithMilliseconds(file.startTime || 0, true, true, false)}
          </span>

          <div className="flex-1 min-w-0 ml-2 overflow-hidden">
            <p className="text-xs truncate flex justify-between items-center">
              {videoStream && (
                <span>
                  <span className="text-gray-700 dark:text-gray-200 ml-3">
                    {videoStream.width}x{videoStream.height}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 ml-3">
                    {(((videoStream.width || 0) * (videoStream.height || 0)) / 1000000).toFixed(1)}{" "}
                    MP
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 ml-3">
                    {getAspectRatio(videoStream)}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 ml-3">
                    {formatBitrate(Number(videoStream?.bit_rate))}
                  </span>
                  {getFps(videoStream) && (
                    <span className="text-gray-700 dark:text-gray-200 ml-3">
                      {getFps(videoStream)} fps
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>

          {file.probeData?.format.size && (
            <p className="text-xs text-gray-700 dark:text-gray-200 flex-shrink-0 whitespace-nowrap ml-2">
              {formatFileSize(file.probeData.format.size)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex justify-end items-end w-full p-2">
          {file.probeData?.format.size && (
            <p className="text-xs text-gray-700 dark:text-gray-200 flex-shrink-0 whitespace-nowrap">
              {formatFileSize(file.probeData.format.size)}
            </p>
          )}
        </div>
      )}
    </div>
  )
})
