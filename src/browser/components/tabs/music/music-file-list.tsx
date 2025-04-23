import { CirclePause, CirclePlay, Music, Pause, Play, Plus } from "lucide-react"
import type { MouseEvent } from "react"
import { useMemo, useState } from "react"

import { MusicToolbar } from "@/browser/components/layout/music-toolbar"
import { formatFileSize, formatTime } from "@/lib/utils"
import { MediaFile } from "@/types/media"

import { AddMediaButton } from "../../preview/add-media-button"
import { useMusicMachine } from "./use-music-machine"

export function MusicFileList() {
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useState<HTMLAudioElement | null>(null)

  const {
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    availableExtensions,
    search,
    sort,
    filter,
    changeOrder,
    changeViewMode,
    groupBy,
    changeGroupBy,
  } = useMusicMachine()

  const groupedFiles = useMemo(() => {
    if (groupBy === "none") {
      return { "": filteredFiles }
    }

    const groups = filteredFiles.reduce(
      (acc, file) => {
        const key = file.probeData?.format.tags?.[groupBy] || "Неизвестно"
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(file)
        return acc
      },
      {} as Record<string, MediaFile[]>,
    )

    // Сортируем группы
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      if (sortOrder === "asc") {
        return a.localeCompare(b)
      }
      return b.localeCompare(a)
    })

    // Сортируем файлы внутри групп
    return Object.fromEntries(
      sortedGroups.map(([group, files]) => [
        group,
        files.sort((a, b) => {
          let comparison = 0
          switch (sortBy) {
          case "name":
            const nameA = String(a.probeData?.format.tags?.TOPE || a.name)
            const nameB = String(b.probeData?.format.tags?.TOPE || b.name)
            comparison = nameA.localeCompare(nameB)
            break
          case "title":
            const titleA = String(a.probeData?.format.tags?.title || a.name)
            const titleB = String(b.probeData?.format.tags?.title || b.name)
            comparison = titleA.localeCompare(titleB)
            break
          case "artist":
            const artistA = String(a.probeData?.format.tags?.artist || "")
            const artistB = String(b.probeData?.format.tags?.artist || "")
            comparison = artistA.localeCompare(artistB)
            break
          case "date":
            const dateA = new Date(a.probeData?.format.tags?.date || "1970-01-01")
            const dateB = new Date(b.probeData?.format.tags?.date || "1970-01-01")
            comparison = dateA.getTime() - dateB.getTime()
            break
          case "duration":
            comparison = (a.probeData?.format.duration || 0) - (b.probeData?.format.duration || 0)
            break
          case "size":
            comparison = (a.probeData?.format.size || 0) - (b.probeData?.format.size || 0)
            break
          default:
            comparison = 0
          }
          return sortOrder === "asc" ? comparison : -comparison
        }),
      ]),
    )
  }, [filteredFiles, groupBy, sortBy, sortOrder])

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

  const handleImport = () => {
    console.log("Импорт файлов")
  }

  const handleImportFile = () => {
    console.log("Импорт отдельных файлов")
  }

  const handleImportFolder = () => {
    console.log("Импорт папки")
  }

  const handleAdd = (e: MouseEvent, file: MediaFile) => {
    console.log(e, file)
  }

  return (
    <div className="flex h-full flex-col">
      <MusicToolbar
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
        searchQuery={searchQuery}
        setSearchQuery={search}
        onImport={handleImport}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
        onSort={sort}
        onFilter={filter}
        onChangeOrder={changeOrder}
        sortOrder={sortOrder}
        currentSortBy={sortBy}
        currentFilterType={filterType}
        availableExtensions={availableExtensions}
        currentGroupBy={groupBy}
        onGroupBy={changeGroupBy}
      />
      <div className="flex-1 overflow-y-auto p-1 dark:bg-[#1b1a1f]">
        {Object.entries(groupedFiles).map(([group, files]) => (
          <div key={group} className="">
            {group && <h2 className="mb-2 px-4 text-lg font-semibold">{group}</h2>}
            {viewMode === "list" ? (
              <div key={group} className="h-full overflow-y-hidden">
                <div className="space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className="group relative flex cursor-pointer items-center gap-1 p-0 hover:bg-gray-100 dark:bg-[#25242b] dark:hover:bg-gray-800"
                    >
                      {/* <Waveform audioUrl={file.path} /> */}
                      <div className="relative">
                        <div className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded">
                          <button
                            onClick={(e) => handlePlayPause(e, file)}
                            className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded bg-black/30 opacity-50 transition-opacity duration-200 group-hover:opacity-100 ${
                              activeFile?.path === file.path ? "opacity-100" : ""
                            }`}
                          >
                            {activeFile?.path === file.path && isPlaying ? (
                              <CirclePause className="h-6 w-6 text-white" />
                            ) : (
                              <CirclePlay className="h-6 w-6 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div
                        className="flex h-12 min-w-0 flex-1 flex-col justify-between p-1"
                        onClick={(e) => handlePlayPause(e, file)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="max-w-[300px] truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.probeData?.format.tags?.title || file.name}
                          </p>
                          <p className="min-w-12 text-right text-xs text-gray-900 dark:text-gray-100">
                            {file.probeData?.format.size && (
                              <span className="text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.probeData.format.size)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-between truncate pr-7">
                          <div className="w-full truncate text-xs text-gray-500">
                            {file.probeData?.format.tags?.artist && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.artist}
                              </span>
                            )}
                            {file.probeData?.format.tags?.album && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.album}
                              </span>
                            )}
                            {/* {file.probeData?.format.tags?.title && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.title}
                              </span>
                            )} */}
                            {file.probeData?.format.tags?.genre && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.genre}
                              </span>
                            )}
                            {(file.probeData?.format.tags?.date ||
                              file.probeData?.format.tags?.TDOR) && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.date || file.probeData.format.tags.TDOR}
                              </span>
                            )}
                          </div>

                          <div className="w-20 truncate text-right text-xs text-gray-500">
                            {file.probeData?.format.duration && (
                              <span>{formatTime(file.probeData.format.duration)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <AddMediaButton file={file} onAddMedia={handleAdd} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {files.map((file) => (
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
                      <p className="truncate text-sm font-medium">
                        {file.probeData?.format.tags?.title || file.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {file.probeData?.format.tags?.artist && (
                          <span>{file.probeData.format.tags.artist}</span>
                        )}
                        {file.probeData?.format.tags?.date && (
                          <span className="ml-2">{file.probeData.format.tags.date}</span>
                        )}
                        {file.probeData?.format.duration && (
                          <span className="ml-2">{formatTime(file.probeData.format.duration)}</span>
                        )}
                      </p>
                    </div>
                    <button
                      className="absolute top-2 right-2 cursor-pointer rounded-full bg-gray-800/70 p-1 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-gray-800"
                      title="Добавить в плейлист"
                      onClick={(e) => handleAdd(e, file)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
