import { Plus } from "lucide-react"

import { formatDuration, formatFileSize, formatTimeWithMilliseconds } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { getAspectRatio, getFps } from "@/utils/videoUtils"

interface FileInfoProps {
  file: MediaFile
  onAddMedia: (e: React.MouseEvent, file: MediaFile) => void
}

export function FileInfo({ file, onAddMedia }: FileInfoProps) {
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
            <p className="text-xs truncate">
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
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {formatDuration(file.probeData.format.duration)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <button
        className="p-1 ml-1 rounded bg-gray-500 hover:bg-gray-800 border border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800 dark:border-gray-600 hover:dark:border-gray-300 transition-all duration-200 cursor-pointer text-white hover:text-white dark:text-gray-500 dark:hover:text-gray-200 flex-shrink-0"
        title="Добавить"
        onClick={(e) => onAddMedia(e, file)}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}
