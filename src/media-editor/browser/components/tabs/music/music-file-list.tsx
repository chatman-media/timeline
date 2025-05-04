import { CirclePause, CirclePlay, Pause, Play } from "lucide-react"
import type { MouseEvent } from "react"
import { useMemo, useRef, useState } from "react"

import { AddMediaButton, MusicToolbar } from "@/media-editor/browser"
import { cn, formatFileSize, formatTime } from "@/lib/utils"
import { MediaFile } from "@/types/media"

import { useMusicMachine } from "./use-music-machine"

export function MusicFileList() {
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // const audioContextRef = useRef<AudioContext | null>(null)
  // const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  // const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

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

  // useEffect(() => {
  //   if (!audioRef.current) return

  //   const initAudioContext = async () => {
  //     try {
  //       if (!audioContextRef.current) {
  //         audioContextRef.current = new AudioContext()
  //       }

  //       const audioContext = audioContextRef.current

  //       if (!sourceRef.current) {
  //         sourceRef.current = audioContext.createMediaElementSource(audioRef.current)
  //       }

  //       const destination = audioContext.createMediaStreamDestination()
  //       sourceRef.current.connect(destination)
  //       sourceRef.current.connect(audioContext.destination)

  //       const recorder = new MediaRecorder(destination.stream)
  //       recorder.start()
  //       setMediaRecorder(recorder)
  //     } catch (error) {
  //       console.error("Error initializing audio context:", error)
  //     }
  //   }

  //   initAudioContext()

  //   return () => {
  //     if (mediaRecorder) {
  //       mediaRecorder.stop()
  //     }
  //     if (sourceRef.current) {
  //       sourceRef.current.disconnect()
  //     }
  //     if (audioContextRef.current) {
  //       audioContextRef.current.close()
  //     }
  //   }
  // }, [activeFile])

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
      if (audioRef.current) {
        isPlaying ? audioRef.current.pause() : audioRef.current.play()
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("ended", handleAudioEnd)
      }
      const audio = new Audio(file.path)
      audio.addEventListener("ended", handleAudioEnd)
      audioRef.current = audio
      audio.play()
      setActiveFile(file)
      setIsPlaying(true)
    }
  }

  const handleAudioEnd = () => {
    setIsPlaying(false)
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
                      className="group relative flex cursor-pointer items-center gap-1 rounded-sm border border-transparent p-0 hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]"
                    >
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
              <div className="flex w-full flex-wrap gap-3 p-2">
                {files.map((file) => (
                  <div key={file.path} className="group relative cursor-pointer">
                    <div className="flex h-15 w-[260px] items-center overflow-hidden rounded-lg border border-transparent bg-gray-100 hover:bg-gray-100 dark:bg-[#25242b] dark:group-hover:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]">
                      {/* Левая часть с кнопкой play */}
                      <div className="flex h-full w-12 items-center justify-center">
                        <button
                          onClick={(e) => handlePlayPause(e, file)}
                          className={`flex h-full w-full cursor-pointer items-center justify-center ${
                            activeFile?.path === file.path ? "opacity-100" : ""
                          }`}
                        >
                          {activeFile?.path === file.path && isPlaying ? (
                            <Pause
                              className={cn(
                                "h-5 w-5 text-white opacity-50 group-hover:opacity-100",
                              )}
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Play
                              className="h-5 w-5 text-white opacity-50 group-hover:opacity-100"
                              strokeWidth={1.5}
                            />
                          )}
                        </button>
                      </div>

                      {/* Правая часть с информацией */}
                      <div
                        className="flex flex-1 flex-col justify-between gap-5 px-0 py-0 pr-10"
                        onClick={(e) => handlePlayPause(e, file)}
                      >
                        <div className="absolute top-1 right-1">
                          {/* {activeFile?.path === file.path && mediaRecorder && isPlaying && (
                            <LiveAudioVisualizer
                              mediaRecorder={mediaRecorder}
                              width={30}
                              height={20}
                              barWidth={1}
                              gap={1}
                              barColor="#35d1c1"
                            backgroundColor="transparent"
                          />
                          )} */}
                        </div>
                        <p className="w-[170px] truncate text-xs font-medium">
                          {file.probeData?.format.tags?.title || file.name}
                        </p>
                        <div className="flex w-[170px] items-center justify-between">
                          <span className="max-w-[140px] truncate text-xs text-gray-500">
                            {file.probeData?.format.tags?.artist || ""}
                          </span>
                          {file.probeData?.format.duration && (
                            <span className="text-xs whitespace-nowrap text-gray-500">
                              {formatTime(file.probeData.format.duration)}
                            </span>
                          )}
                        </div>
                      </div>

                      <AddMediaButton file={file} size={120} onAddMedia={handleAdd} />
                    </div>
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
