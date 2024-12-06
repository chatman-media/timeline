import { useMedia } from "@/hooks/use-media"
import { formatDuration, formatTime } from "@/lib/utils"

export function MediaFilesList() {
  const { videos, isLoading } = useMedia()

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Загрузка файлов...</p>
      </div>
    )
  }

  if (!videos?.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Нет доступных файлов</p>
      </div>
    )
  }

  return (
    <div className="px-1 h-[calc(50vh-10rem)] overflow-y-auto border border-gray-200 dark:border-gray-700 border-t-0">
      <div className="space-y-2">
        {videos.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {file.thumbnail && (
              <div className="w-12 h-12 flex-shrink-0">
                <img
                  src={file.thumbnail}
                  alt={file.name}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-100">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-100">
                {file.isVideo ? "Видео" : "Аудио"}
                {file.probeData?.format.duration && (
                  <span className="ml-2">
                    {formatTime(file.probeData.format.duration)}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
