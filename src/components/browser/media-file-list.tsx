import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useVideoStore } from "@/hooks/useVideoStore"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { formatDuration, formatFileSize } from "@/lib/utils"
import { MediaFile } from "@/types/videos"
import {
  FileGroup,
  getFileType,
  getSequentialFiles,
  groupFilesByDate,
  prepareFileGroups,
} from "@/utils/mediaUtils"

import { Skeleton } from "../ui/skeleton"
import { FileInfo, MediaPreview } from "."
import { StatusBar } from "./status-bar"

export function MediaFileList(
  { viewMode = "thumbnails" }: { viewMode?: "list" | "grid" | "thumbnails" },
) {
  const { media, isLoading, addNewTracks, fetchVideos, setHasFetched } = useVideoStore()

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({})
  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>(
    {},
  )
  const [addedFiles, setAddedFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const [fileGroups, setFileGroups] = useState<Record<string, FileGroup>>({})

  const { setPlayingFileId, handlePlayPause, handleMouseLeave } = useVideoPlayer({
    videoRefs,
  })

  const sequentialFiles = useMemo(() => getSequentialFiles(media), [media])
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])

  const sortedMedia = useMemo(() => {
    return [...media].sort((a, b) => {
      const timeA = a.startTime || 0
      const timeB = b.startTime || 0
      return timeB - timeA
    })
  }, [media])

  const getFileId = useCallback((file: MediaFile) => {
    return file.id || file.path || file.name
  }, [])

  const handleMouseMove = useCallback((
    e: React.MouseEvent<HTMLDivElement>,
    fileId: string,
    duration: number,
    streamIndex: number = 0,
  ) => {
    const mediaElement = e.currentTarget.querySelector(`[data-stream="${streamIndex}"]`)
      ?.parentElement || e.currentTarget
    if (!mediaElement) return

    const rect = mediaElement.getBoundingClientRect()

    if (e.clientX < rect.left || e.clientX > rect.right) {
      setHoverTimes((prev: Record<string, { [streamIndex: number]: number }>) => ({
        ...prev,
        [fileId]: {
          ...(prev[fileId] || {}),
          // deno-lint-ignore no-explicit-any
          [streamIndex]: null as any,
        },
      }))
      return
    }

    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const percentage = x / rect.width
    const time = percentage * duration

    if (Number.isFinite(time)) {
      setHoverTimes((prev: Record<string, { [streamIndex: number]: number }>) => ({
        ...prev,
        [fileId]: {
          ...(prev[fileId] || {}),
          [streamIndex]: time,
        },
      }))
      const videoElement = videoRefs.current[`${fileId}-${streamIndex}`]
      if (videoElement) {
        videoElement.currentTime = time
      }
    }
  }, [])

  const handleAddMedia = useCallback((e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation()
    const fileId = getFileId(file)
    if (addedFiles.has(fileId)) return

    // Check if file has video or audio stream
    const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")
    const audioStream = file.probeData?.streams?.find((s) => s.codec_type === "audio")

    // Only add if file has either video or audio
    if (videoStream || audioStream) {
      addNewTracks([file])
      setAddedFiles((prev) => new Set([...prev, fileId]))
    }
  }, [addNewTracks, addedFiles, getFileId])

  const handleUpdateList = useCallback(() => {
    setHasFetched(false)
    fetchVideos()
  }, [setHasFetched, fetchVideos])

  // Handlers for StatusBar
  const handleAddAllFiles = useCallback(() => {
    addNewTracks(media)
  }, [media, addNewTracks])

  const handleAddDateFiles = useCallback((targetDate: string) => {
    const dateFiles = media.filter((file) => {
      if (!file.startTime) return false
      const fileDate = new Date(file.startTime * 1000).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
      return fileDate === targetDate && file.probeData?.streams?.[0]?.codec_type === "video"
    })
    addNewTracks(dateFiles)
  }, [media, addNewTracks])

  const handleAddAllVideoFiles = useCallback(() => {
    handleAddByIds(fileGroups.videos.fileIds)
  }, [fileGroups])

  const handleAddAllAudioFiles = useCallback(() => {
    handleAddByIds(fileGroups.audio.fileIds)
  }, [fileGroups])

  const handleAddSequentialFiles = useCallback(() => {
    if (!sequentialFiles) return
    addNewTracks(sequentialFiles)
  }, [sequentialFiles, addNewTracks])

  useEffect(() => {
    if (media.length) {
      setFileGroups(prepareFileGroups(media))
    }
  }, [media])

  const handleAddByIds = useCallback((fileIds: string[]) => {
    const filesToAdd = media.filter((file) => fileIds.includes(file.id))
    addNewTracks(filesToAdd)
  }, [media, addNewTracks])

  if (isLoading) {
    return (
      <div className="px-0 h-[calc(50vh-29px)] overflow-y-auto">
        <div className="space-y-2 dark:bg-[#1b1a1f]">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-0 pr-2 rounded-md">
              <div className="h-[60px] w-[80px]">
                <Skeleton className="h-full w-full rounded" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-7 w-7 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!media?.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Нет доступных файлов</p>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(50vh-29px)]">
      <div className="h-full overflow-y-auto pl-[3px]">
        {viewMode === "list"
          ? (
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Название
                  </th>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Начало
                  </th>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Длительность
                  </th>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Разрешение
                  </th>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Кодек
                  </th>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Битрейт
                  </th>
                  <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 uppercase">
                    Размер
                  </th>
                  <th className="px-4 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {sortedMedia.map((file) => {
                  const fileId = getFileId(file)
                  const isAdded = addedFiles.has(fileId)
                  const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")
                  const startTime = file.startTime
                    ? new Date(file.startTime * 1000).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                    : "-"
                  const duration = file.probeData?.format.duration
                    ? formatDuration(file.probeData.format.duration)
                    : "-"
                  const resolution = videoStream
                    ? `${videoStream.width}x${videoStream.height}`
                    : "-"
                  const codec = videoStream?.codec_name?.toUpperCase() || "-"
                  const bitrate = file.probeData?.format.bit_rate
                    ? `${Math.round(file.probeData.format.bit_rate / 1000)} Kbps`
                    : "-"
                  const fileSize = formatFileSize(file.probeData?.format.size || 0)

                  return (
                    <tr
                      key={fileId}
                      className={`border-b dark:border-gray-700 ${
                        isAdded
                          ? "opacity-50 pointer-events-none"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{file.name}</td>
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{startTime}</td>
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{duration}</td>
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{resolution}</td>
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{codec}</td>
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{bitrate}</td>
                      <td className="px-3 py-0 text-[12px] whitespace-nowrap">{fileSize}</td>
                      <td className="px-3 py-0">
                        <button
                          onClick={(e) => handleAddMedia(e, file)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
          : (
            <div className="space-y-2">
              {sortedMedia.map((file) => {
                const fileId = getFileId(file)
                const duration = file.probeData?.format.duration || 1
                const isAudio = getFileType(file) === "audio"
                const isAdded = addedFiles.has(fileId)

                return (
                  <div
                    key={fileId}
                    className={`flex items-center gap-3 p-0 pr-2 rounded-md group w-full overflow-hidden
                    ${
                      isAdded
                        ? "opacity-50 pointer-events-none"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    style={{ maxWidth: "100%" }}
                  >
                    <div className="relative flex-shrink-0 flex gap-1">
                      <MediaPreview
                        file={file}
                        fileId={fileId}
                        duration={duration}
                        isAudio={isAudio}
                        videoRefs={videoRefs}
                        loadedVideos={loadedVideos}
                        setLoadedVideos={setLoadedVideos}
                        hoverTimes={hoverTimes}
                        handleMouseMove={handleMouseMove}
                        handlePlayPause={handlePlayPause}
                        handleMouseLeave={handleMouseLeave}
                        setPlayingFileId={setPlayingFileId}
                        onAddMedia={handleAddMedia}
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <FileInfo file={file} onAddMedia={handleAddMedia} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 m-0 p-0 h-[20px]">
        <StatusBar
          media={sortedMedia}
          onAddAllVideoFiles={handleAddAllVideoFiles}
          onAddAllAudioFiles={handleAddAllAudioFiles}
          onAddDateFiles={handleAddDateFiles}
          onAddAllFiles={handleAddAllFiles}
          sortedDates={sortedDates}
        />
      </div>
    </div>
  )
}
