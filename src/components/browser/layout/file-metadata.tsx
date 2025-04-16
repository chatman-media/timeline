import { memo } from "react"

import { formatDuration, formatFileSize, formatTimeWithMilliseconds } from "@/lib/utils"
import { MediaFile } from "@/types/media"
import { getAspectRatio, getFps } from "@/utils/video-utils"

interface FileMetadataProps {
  file: MediaFile
  size?: number
}

// Оборачиваем в memo для предотвращения лишних рендеров
export const FileMetadata = memo(function FileMetadata({ file, size = 100 }: FileMetadataProps) {
  const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")

  return (
    <div className="grid grid-rows-2 w-full overflow-hidden" style={{ height: `${size}px` }}>
      <div className="flex justify-between w-full p-2">
        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{file.name}</p>
        {file.isVideo && file.probeData?.format.duration && (
          <p className="text-xs flex-shrink-0">{formatDuration(file.probeData.format.duration)}</p>
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
                  <span className="text-gray-700 dark:text-gray-200 ml-2">
                    {getAspectRatio(videoStream)}
                  </span>
                  {getFps(videoStream) && (
                    <span className="ml-2 text-gray-700 dark:text-gray-200 ml-2">
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
