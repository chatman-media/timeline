import { Pause, Play, Plus } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect, useRef, useState } from "react"

import { AudioPlayer } from "@/components/browser/layout/audio-player"
import { MusicToolbar } from "@/components/browser/layout/music-toolbar"
import { formatFileSize, formatTime } from "@/lib/utils"
import { MediaFile } from "@/types/videos"

export function MusicFileList() {
  const [musicFiles, setMusicFiles] = useState<MediaFile[]>([])
  const [, setIsLoading] = useState(true)
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const audioRef = useState<HTMLAudioElement | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid" | "thumbnails">("list")
  const [sortBy, setSortBy] = useState<string>("name")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const fetchMusicFiles = async (pageNum: number) => {
    try {
      setIsLoadingMore(true)
      const response = await fetch(
        `/api/music?page=${pageNum}&limit=20&sort=${sortBy}&order=${sortOrder}&filter=${filterType}`,
      )
      const data = await response.json()

      if (pageNum === 1) {
        setMusicFiles(data.media)
      } else {
        setMusicFiles((prev) => [...prev, ...data.media])
      }

      setHasMore(musicFiles.length + data.media.length < data.total)
    } catch (error) {
      console.error("Error fetching music files:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchMusicFiles(1)
  }, [sortBy, sortOrder, filterType])

  useEffect(() => {
    fetchMusicFiles(1)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          setPage((prev) => prev + 1)
          fetchMusicFiles(page + 1)
        }
      },
      {
        threshold: 0.5,
        rootMargin: "100px",
      },
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, page])

  const handlePlayPause = (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation()

    if (activeFile?.path === file.path) {
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
      setActiveFile(file)
      setIsPlaying(true)
    }
  }

  const handleViewModeChange = (mode: "list" | "grid" | "thumbnails") => {
    setViewMode(mode)
  }

  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy)
  }

  const handleFilter = (newFilterType: string) => {
    setFilterType(newFilterType)
  }

  const handleChangeOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const handleImport = () => {
    console.log("Импорт файлов")
  }

  const handleImportFile = () => {
    console.log("Импорт отдельных файлов")
  }

  const handleImportFolder = () => {
    console.log("Импорт папки")
  }

  const handleAdd = (e: MouseEvent<HTMLButtonElement>, file: MediaFile) => {
    console.log(e, file)
  }

  const renderAudioPlayer = () => {
    if (!activeFile) return null

    const formatDuration = (seconds?: number) => {
      if (!seconds) return "00:00"
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    return (
      <div className="border-b">
        <AudioPlayer
          title={activeFile.name || "Неизвестный трек"}
          duration={formatDuration(activeFile.probeData?.format.duration)}
          isPlaying={isPlaying}
          onPlay={() => {
            if (audioRef[0]) {
              audioRef[0].play()
              setIsPlaying(true)
            }
          }}
          onPause={() => {
            if (audioRef[0]) {
              audioRef[0].pause()
              setIsPlaying(false)
            }
          }}
        />
      </div>
    )
  }

  const renderMusicFiles = () => {
    switch (viewMode) {
      case "list":
        return (
          <div className="h-full overflow-y-auto">
            <div className="space-y-1">
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
                        activeFile?.path === file.path ? "opacity-100" : ""
                      }`}
                    >
                      {activeFile?.path === file.path && isPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 p-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 max-w-[300px]">
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
                    <div className="flex justify-between items-center truncate">
                      <div className="text-xs text-gray-500 w-[330px] truncate">
                        {file.probeData?.format.duration && (
                          <span>{formatTime(file.probeData.format.duration)}</span>
                        )}
                        {file.probeData?.format.tags?.title && (
                          <span className="ml-4 text-gray-500 dark:text-gray-400">
                            {file.probeData.format.tags.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-1 mr-4 rounded bg-gray-500 hover:bg-gray-800 border border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800 dark:border-gray-600 hover:dark:border-gray-300 transition-all duration-200 cursor-pointer text-white hover:text-white dark:text-gray-500 dark:hover:text-gray-200"
                    title="Добавить"
                    onClick={(e) => handleAdd(e, file)}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      case "grid":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {musicFiles.map((file) => (
              <div
                key={file.path}
                className="relative group rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
              >
                <div className="bg-gray-100 dark:bg-gray-800 aspect-square flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 dark:text-gray-500"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <button
                    onClick={(e) => handlePlayPause(e, file)}
                    className={`absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer ${
                      activeFile?.path === file.path ? "opacity-100" : ""
                    }`}
                  >
                    {activeFile?.path === file.path && isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white" />
                    )}
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>
                      {file.probeData?.format.duration &&
                        formatTime(file.probeData.format.duration)}
                    </span>
                    <span>
                      {file.probeData?.format.size && formatFileSize(file.probeData.format.size)}
                    </span>
                  </div>
                </div>
                <button
                  className="absolute top-2 right-2 p-1 rounded-full bg-gray-800/70 hover:bg-gray-800 transition-all duration-200 cursor-pointer text-white"
                  title="Добавить"
                  onClick={(e) => handleAdd(e, file)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )

      case "thumbnails":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            {musicFiles.map((file) => (
              <div key={file.path} className="relative group cursor-pointer">
                <div className="bg-gray-100 dark:bg-gray-800 aspect-square rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400 dark:text-gray-500"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                  <button
                    onClick={(e) => handlePlayPause(e, file)}
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg cursor-pointer ${
                      activeFile?.path === file.path ? "opacity-100" : ""
                    }`}
                  >
                    {activeFile?.path === file.path && isPlaying ? (
                      <Pause className="w-12 h-12 text-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white" />
                    )}
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {file.probeData?.format.duration && formatTime(file.probeData.format.duration)}
                  </p>
                </div>
                <button
                  className="absolute top-2 right-2 p-1 rounded-full bg-gray-800/70 hover:bg-gray-800 transition-all duration-200 cursor-pointer text-white opacity-0 group-hover:opacity-100"
                  title="Добавить"
                  onClick={(e) => handleAdd(e, file)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MusicToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onImport={handleImport}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
        onSort={handleSort}
        onFilter={handleFilter}
        onChangeOrder={handleChangeOrder}
        sortOrder={sortOrder}
        currentSortBy={sortBy}
        currentFilterType={filterType}
      />
      {activeFile && renderAudioPlayer()}
      <div className="flex-1 overflow-y-auto">
        {renderMusicFiles()}

        <div ref={loaderRef} className="p-2 pt-0 text-center">
          {isLoadingMore && <p className="text-sm text-gray-500">Загрузка...</p>}
          {!hasMore && musicFiles.length > 0 && (
            <p className="text-sm text-gray-500">Больше файлов нет</p>
          )}
        </div>
      </div>
    </div>
  )
}
