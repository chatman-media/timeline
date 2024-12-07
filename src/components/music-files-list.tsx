import { useEffect, useState } from "react"
import { Play, Pause } from "lucide-react"

import { MediaFile } from "@/types/videos"
import { formatTime, formatFileSize } from "@/lib/utils"

export function MusicFilesList() {
  const [musicFiles, setMusicFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useState<HTMLAudioElement | null>(null)

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

  const handlePlayPause = (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation()
    
    if (activeFile === file.path) {
      setIsPlaying(!isPlaying)
      if (audioRef[0]) {
        isPlaying ? audioRef[0].pause() : audioRef[0].play()
      }
    } else {
      if (audioRef[0]) {
        audioRef[0].pause()
      }
      const audio = new Audio(file.path)
      audioRef[1](audio)
      audio.play()
      setActiveFile(file.path)
      setIsPlaying(true)
    }
  }

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
    <div className="p-0">
      <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {musicFiles.map((file) => (
          <div
            key={file.path}
            className="flex items-center gap-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-8 h-8 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center cursor-pointer">
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
              <button
                onClick={(e) => handlePlayPause(e, file)}
                className={`absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded cursor-pointer ${
                  activeFile === file.path ? 'opacity-100' : ''
                }`}
              >
                {activeFile === file.path && isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 max-w-[300px]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-900 dark:text-gray-100">
                  {file.probeData?.format.size && (
                    <span className="text-gray-500 dark:text-gray-400 pr-2">
                      {formatFileSize(file.probeData.format.size)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {file.probeData?.format.duration && (
                    <span>
                      {formatTime(file.probeData.format.duration)}
                    </span>
                  )}
                  {file.probeData?.format.tags?.title && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      {file.probeData.format.tags.title}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}