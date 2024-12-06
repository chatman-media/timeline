import { useEffect, useState } from "react"

import { MediaFile } from "@/types/videos"

export function MusicFilesList() {
  const [musicFiles, setMusicFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMusicFiles = async () => {
      try {
        const response = await fetch("/api/music")
        const data = await response.json()
        setMusicFiles(data.media)
      } catch (error) {
        console.error("Error fetching music files:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMusicFiles()
  }, [])

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Загрузка аудиофайлов...</p>
      </div>
    )
  }

  if (!musicFiles?.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Нет доступных аудиофайлов</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {musicFiles.map((file) => (
          <div
            key={file.path}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {file.probeData?.format.duration && (
                  <span>
                    {Math.round(file.probeData.format.duration)}с
                  </span>
                )}
                {file.probeData?.format.tags?.title && (
                  <span className="ml-2">
                    {file.probeData.format.tags.title}
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
