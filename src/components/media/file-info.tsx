import { formatDuration, formatFileSize, formatTimeWithMilliseconds } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import { Plus } from "lucide-react"

interface FileInfoProps {
  file: MediaFile
  onAddMedia: (e: React.MouseEvent, file: MediaFile) => void
}

export function FileInfo({ file, onAddMedia }: FileInfoProps) {
  return (
    <div className="flex flex-1 items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 mb-3">
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
            {formatTimeWithMilliseconds(file.startTime || 0, true, true, false)}
          </span>

          <p className="text-xs">
            {file.isVideo && file.probeData?.streams?.[0] && (
              <span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {file.probeData.streams[0].width}x{file.probeData.streams[0].height}
                </span>
                {file.probeData?.streams[0].codec_name && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    {file.probeData.streams[0].codec_name}
                  </span>
                )}
              </span>
            )}
            {file.probeData?.format.duration && (
              <span className="text-gray-500 dark:text-gray-400 ml-4">
                {formatDuration(file.probeData.format.duration)}
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        className="p-1 mr-1 rounded bg-gray-500 hover:bg-gray-800 border border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800 dark:border-gray-600 hover:dark:border-gray-300 transition-all duration-200 cursor-pointer text-white hover:text-white dark:text-gray-500 dark:hover:text-gray-200"
        title="Добавить"
        onClick={(e) => onAddMedia(e, file)}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  )
}
