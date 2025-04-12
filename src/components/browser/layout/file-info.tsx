import { memo } from "react"

import { formatDuration, formatFileSize, formatTimeWithMilliseconds } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { getAspectRatio, getFps } from "@/utils/video-utils"

interface FileInfoProps {
  file: MediaFile
  size?: number
}

// Оборачиваем в memo для предотвращения лишних рендеров
export const FileInfo = memo(function FileInfo({ file, size = 100 }: FileInfoProps) {
  const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")

  return (
    <div className="grid grid-rows-2 w-full overflow-hidden" style={{ height: `${size}px` }}>
      <div className="flex justify-between w-full p-1">
        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{file.name}</p>
        {file.probeData?.format.duration && (
          <p className="text-xs flex-shrink-0">{formatDuration(file.probeData.format.duration)}</p>
        )}
      </div>

      <div className="flex items-end w-full p-1">
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
          {formatTimeWithMilliseconds(file.startTime || 0, true, true, false)}
        </span>

        <div className="flex-1 min-w-0 ml-2 overflow-hidden">
          <p className="text-xs truncate flex justify-between items-center">
            {file.isVideo && videoStream && (
              <span>
                <span className="text-gray-500 dark:text-gray-400">
                  {getAspectRatio(videoStream)}
                </span>
                {getFps(videoStream) && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {getFps(videoStream)} fps
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        {file.probeData?.format.size && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap ml-2">
            {formatFileSize(file.probeData.format.size)}
          </p>
        )}
      </div>
    </div>
  )
})
