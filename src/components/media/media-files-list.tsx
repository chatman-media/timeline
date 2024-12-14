import { useCallback, useMemo, useRef, useState } from "react"

import { useMedia } from "@/hooks/use-media"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { MediaFile } from "@/types/videos"
import { getSequentialFiles, getSequentialGroups, groupFilesByDate } from "@/utils/mediaUtils"

import { Skeleton } from "../ui/skeleton"
import { MediaPreview } from "./media-preview"
import { StatusBar } from "./status-bar"
import { FileInfo } from "./file-info"

export function MediaFilesList() {
  const { media, isLoading, addNewTracks, fetchVideos, setHasFetched } = useMedia()
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({})
  const [hoverTimes, setHoverTimes] = useState<Record<string, { [streamIndex: number]: number }>>(
    {},
  )

  const { setPlayingFileId, handlePlayPause, handleMouseLeave } = useVideoPlayer({
    videoRefs,
  })

  const groupedSequences = useMemo(() => getSequentialGroups(media), [media])
  const sequentialFiles = useMemo(() => getSequentialFiles(media), [media])
  const sortedDates = useMemo(() => groupFilesByDate(media), [media])

  const sortedMedia = useMemo(() => {
    return [...media].sort((a, b) => {
      const timeA = a.startTime || 0;
      const timeB = b.startTime || 0;
      return timeB - timeA;
    });
  }, [media]);

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
    if (file.probeData?.streams?.[0]?.codec_type !== "video") return
    addNewTracks([file])
  }, [addNewTracks])

  // Handlers for StatusBar
  const handleUpdateList = useCallback(() => {
    setHasFetched(false)
    fetchVideos()
  }, [setHasFetched, fetchVideos])

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
    const videoFiles = media.filter((f) => f.probeData?.streams?.[0]?.codec_type === "video")
    addNewTracks(videoFiles)
  }, [media, addNewTracks])

  const handleAddAllAudioFiles = useCallback(() => {
    const audioFiles = media.filter((f) => f.probeData?.streams?.[0]?.codec_type === "audio")
    addNewTracks(audioFiles)
  }, [media, addNewTracks])

  const handleAddSequentialFiles = useCallback(() => {
    if (!sequentialFiles) return
    addNewTracks(sequentialFiles)
  }, [sequentialFiles, addNewTracks])

  if (isLoading) {
    return (
      <div className="px-0 h-[calc(50vh-10px)] overflow-y-auto">
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
    <>
      <div className="px-0 h-[calc(50vh-10px)] overflow-y-auto">
        <div className="space-y-2">
          {sortedMedia.map((file) => {
            const fileId = getFileId(file)
            const duration = file.probeData?.format.duration || 1
            const isAudio = file.probeData?.streams?.[0]?.codec_type === "audio"

            return (
              <div
                key={fileId}
                className="flex items-center gap-3 p-0 pr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group"
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
      </div>
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
    </>
  )
}
