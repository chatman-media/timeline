import { Pause, Play, Plus } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect, useRef, useState } from "react"

import { MusicToolbar } from "@/browser/components/layout/music-toolbar"
import { formatFileSize, formatTime } from "@/lib/utils"
import { MediaFile } from "@/types/media"

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
  const [viewMode, setViewMode] = useState<"list" | "thumbnails">("list")
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

  const handleViewModeChange = (mode: "list" | "thumbnails") => {
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

  return (
    <div className="flex h-full flex-col">
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
      {/* {activeFile && renderAudioPlayer()} */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "list" && (
          <div className="h-full overflow-y-auto">
            <div className="space-y-1">
              {musicFiles.map((file) => (
                <div
                  key={file.path}
                  className="group flex cursor-pointer items-center gap-3 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="relative">
                    <div className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
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
                      className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                        activeFile?.path === file.path ? "opacity-100" : ""
                      }`}
                    >
                      {activeFile?.path === file.path && isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </button>
                  </div>
                  <div className="min-w-0 flex-1 p-1">
                    <div className="flex items-center justify-between">
                      <p className="max-w-[300px] truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="min-w-12 text-right text-xs text-gray-900 dark:text-gray-100">
                        {file.probeData?.format.size && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.probeData.format.size)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between truncate">
                      <div className="w-[330px] truncate text-xs text-gray-500">
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
                    className="mr-4 cursor-pointer rounded border border-gray-700 bg-gray-500 p-1 text-white transition-all duration-200 hover:bg-gray-800 hover:text-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500 hover:dark:border-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    title="Добавить"
                    onClick={(e) => handleAdd(e, file)}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "thumbnails" && (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {musicFiles.map((file) => (
              <div key={file.path} className="group relative cursor-pointer">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex h-full w-full items-center justify-center">
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
                    className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                      activeFile?.path === file.path ? "opacity-100" : ""
                    }`}
                  >
                    {activeFile?.path === file.path && isPlaying ? (
                      <Pause className="h-12 w-12 text-white" />
                    ) : (
                      <Play className="h-12 w-12 text-white" />
                    )}
                  </button>
                </div>
                <div className="mt-2">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {file.probeData?.format.duration && formatTime(file.probeData.format.duration)}
                  </p>
                </div>
                <button
                  className="absolute top-2 right-2 cursor-pointer rounded-full bg-gray-800/70 p-1 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-gray-800"
                  title="Добавить"
                  onClick={(e) => handleAdd(e, file)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

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
