import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { MediaFile } from "@/types/videos"
import {
  FileGroup,
  getFileType,
  getSequentialFiles,
  getSequentialGroups,
  groupFilesByDate,
  prepareFileGroups,
} from "@/utils/mediaUtils"

import { Skeleton } from "../ui/skeleton"
import { FileInfo, MediaPreview, StatusBar } from "."
import { formatDuration, formatFileSize } from "@/lib/utils"

export function MediaFilesList({ viewMode }: { viewMode: "list" | "grid" | "thumbnails" }) {
  const { media, isLoading, addNewTracks, fetchVideos, setHasFetched } = useMedia()
  console.log(media)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({})
  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>(
    {},
  )
  const [fileGroups, setFileGroups] = useState<Record<string, FileGroup>>({})
  const [addedFiles, setAddedFiles] = useState<Set<string>>(new Set())

  const { setPlayingFileId, handlePlayPause, handleMouseLeave } = useVideoPlayer({
    videoRefs,
  })

  const groupedSequences = useMemo(() => getSequentialGroups(media), [media])
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
    if (addedFiles.has(fileId) || file.probeData?.streams?.[0]?.codec_type !== "video") return
    addNewTracks([file])
    setAddedFiles((prev) => new Set([...prev, fileId]))
  }, [addNewTracks, addedFiles, getFileId])

  // Handlers for StatusBar
  const handleUpdateList = useCallback(() => {
    setHasFetched(false)
    fetchVideos()
  }, [setHasFetched, fetchVideos])

  const handleAddAllFiles = useCallback(() => {
    addNewTracks(media)
    setAddedFiles((prev) => new Set([...prev, ...media.map((file) => getFileId(file))]))
  }, [media, addNewTracks, getFileId])

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
    setAddedFiles((prev) => new Set([...prev, ...dateFiles.map((file) => getFileId(file))]))
  }, [media, addNewTracks, getFileId])

  const handleAddAllVideoFiles = useCallback(() => {
    handleAddByIds(fileGroups.videos.fileIds)
  }, [fileGroups])

  const handleAddAllAudioFiles = useCallback(() => {
    handleAddByIds(fileGroups.audio.fileIds)
  }, [fileGroups])

  const handleAddSequentialFiles = useCallback(() => {
    if (!sequentialFiles) return
    addNewTracks(sequentialFiles)
    setAddedFiles((prev) => new Set([...prev, ...sequentialFiles.map((file) => getFileId(file))]))
  }, [sequentialFiles, addNewTracks, getFileId])

  useEffect(() => {
    if (media.length) {
      setFileGroups(prepareFileGroups(media))
    }
  }, [media])

  const handleAddByIds = useCallback((fileIds: string[]) => {
    const filesToAdd = media.filter((file) => fileIds.includes(file.id))
    addNewTracks(filesToAdd)
    setAddedFiles((prev) => new Set([...prev, ...fileIds]))
  }, [media, addNewTracks])

  if (isLoading) {
    return (
      <div className="px-0 h-[calc(50vh-70px)] overflow-y-auto">
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
    <div className="relative h-[calc(50vh-44px)]">
      <div className="h-[calc(100%-30px)] overflow-y-auto">
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
                    ? `${Math.round(parseInt(file.probeData.format.bit_rate) / 1000)} Kbps`
                    : "-"
                  const fileSize = formatFileSize(file.probeData?.format.size)

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
                    className={`flex items-center gap-3 p-0 pr-2 rounded-md group
                    ${
                      isAdded
                        ? "opacity-50 pointer-events-none"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="relative flex gap-1">
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
                      />
                    </div>
                    <FileInfo file={file} onAddMedia={handleAddMedia} />
                  </div>
                )
              })}
            </div>
          )}
      </div>
      <div className="absolute bottom-[-4px] left-[-4px] right-[-4px] bg-white dark:bg-[#1b1a1f] m-0 p-0">
        <StatusBar
          media={sortedMedia}
          onAddAllVideoFiles={handleAddAllVideoFiles}
          onAddAllAudioFiles={handleAddAllAudioFiles}
          onAddSequentialFiles={handleAddSequentialFiles}
          onAddDateFiles={handleAddDateFiles}
          onAddAllFiles={handleAddAllFiles}
          onUpdateList={handleUpdateList}
          groupedSequences={groupedSequences}
          sortedDates={sortedDates}
        />
      </div>
    </div>
  )
}
