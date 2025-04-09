import { memo } from "react"

import { formatDuration, formatFileSize, formatTimeWithMilliseconds } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { getAspectRatio, getFps } from "@/utils/video-utils"

interface FileInfoProps {
  file: MediaFile
  onAddMedia: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
}

// Оборачиваем в memo для предотвращения лишних рендеров
export const FileInfo = memo(function FileInfo({ file, onAddMedia, isAdded }: FileInfoProps) {
  const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-start w-full">
          <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 mb-3 max-w-full pr-2">
            {file.name}
          </p>
          <p className="text-xs text-gray-900 dark:text-gray-100 flex-shrink-0 whitespace-nowrap">
            {file.probeData?.format.size && (
              <span className="text-gray-500 dark:text-gray-400">
                {formatFileSize(file.probeData.format.size)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center w-full">
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
              {file.probeData?.format.duration && (
                <span className="text-gray-500 dark:text-gray-400">
                  {formatDuration(file.probeData.format.duration)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
