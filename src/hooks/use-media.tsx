import { useCallback, useEffect, useRef, useState } from "react"
import type { AssembledTrack, MediaFile } from "@/types/videos"
import { TimeRange } from "@/types/scene"

export function useMedia() {
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [activeVideos, setActiveVideos] = useState<AssembledTrack[]>([])
  const [hasVideos, setHasVideos] = useState(false)
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [assembledTracks, setAssembledTracks] = useState<AssembledTrack[]>([])
  const hasFetchedRef = useRef(false)

  const timeToPercent = useCallback((time: number) => {
    const range = timeRanges.find((r) => time >= r.min && time <= r.max)
    if (!range) return 0
    const duration = range.max - range.min
    return ((time - range.min) / duration) * 100
  }, [timeRanges])

  const percentToTime = useCallback((percent: number) => {
    const range = timeRanges[0]
    if (!range) return 0
    const duration = range.max - range.min
    return range.min + (duration * percent) / 100
  }, [timeRanges])

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    setIsLoading(true)
    console.log("Fetching videos...")
    fetch("/api/videos")
      .then((res) => res.json())
      .then((data) => {
        console.log("Received video data:", data)

        if (!data.media || !Array.isArray(data.media) || data.media.length === 0) {
          console.error("No videos received from API")
          return
        }

        const validVideos = data.media.filter((v: MediaFile) => {
          const isVideo = v.probeData.streams.some((s) => s.codec_type === "video")
          const hasCreationTime = !!v.probeData.format.tags?.creation_time
          return isVideo && hasCreationTime
        })

        if (validVideos.length === 0) {
          setVideos([])
          setIsLoading(false)
          return
        }

        const sortedVideos = validVideos.sort((a: MediaFile, b: MediaFile) => {
          const timeA = new Date(a.probeData.format.tags!.creation_time).getTime()
          const timeB = new Date(b.probeData.format.tags!.creation_time).getTime()
          return timeA - timeB
        })

        const times = sortedVideos.flatMap((v: MediaFile) => {
          const startTime = new Date(v.probeData.format.tags!.creation_time).getTime()
          const duration = v.probeData.format.duration || 0
          const endTime = startTime + duration * 1000
          return [startTime, endTime]
        })

        if (times.length > 0) {
          const sortedTimes = times.sort((a: number, b: number) => a - b)
          const ranges: TimeRange[] = []
          let currentRange = {
            min: Math.floor(sortedTimes[0] / 1000),
            max: Math.floor(sortedTimes[0] / 1000),
            duration: Math.floor(sortedTimes[1] / 1000) - Math.floor(sortedTimes[0] / 1000),
          }

          for (let i = 1; i < sortedTimes.length; i++) {
            const currentTime = Math.floor(sortedTimes[i] / 1000)
            const gap = currentTime - currentRange.max

            if (gap > 3600) {
              ranges.push(currentRange)
              currentRange = {
                min: currentTime,
                max: currentTime,
                duration: 0,
              }
            } else {
              currentRange.max = currentTime
            }
          }
          ranges.push(currentRange)

          setTimeRanges(ranges)
          setCurrentTime(ranges[0].min)
        }

        setVideos(sortedVideos)
      })
      .catch((error) => {
        console.error("Error fetching videos:", error)
        if (error instanceof Response) {
          error.text().then((text) => console.error("Response text:", text))
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Модифицируем updateActiveVideos для определения активных видео
  useEffect(() => {
    console.log("Updating active videos:", {
      videosCount: videos.length,
      currentTime,
      videoGroups: videos.map((v) => ({
        path: v.path,
        creationTime: v.probeData.format.start_time,
      })),
    })

    // Создаем мапу для группировки видео по их номеру камеры
    const videoGroups = new Map<number, MediaFile[]>()

    videos.forEach((video) => {
      // Извлекаем номер камеры из имени файла или другим способом
      // Предполагаем, что номер камеры содержится в имени файла
      const cameraNumber = parseInt(video.path.match(/camera[_-]?(\d+)/i)?.[1] || "1")

      if (!videoGroups.has(cameraNumber)) {
        videoGroups.set(cameraNumber, [])
      }
      videoGroups.get(cameraNumber)?.push(video)
    })

    const active = Array.from(videoGroups.entries()).map(([cameraNumber, groupVideos]) => {
      const isActive = groupVideos.some((video) => {
        if (!video.probeData.format.start_time) return false
        const videoTime = new Date(video.probeData.format.start_time).getTime() / 1000
        const startTime = videos[0]?.probeData.format.start_time
          ? new Date(videos[0].probeData.format.creation_time).getTime() / 1000
          : 0
        const videoSeconds = videoTime - startTime
        const videoEndSeconds = videoSeconds + (video.probeData.format.duration || 0)
        return videoSeconds <= currentTime && currentTime <= videoEndSeconds
      })

      return {
        video: groupVideos[0],
        index: cameraNumber,
        isActive,
        allVideos: groupVideos,
      }
    })

    setActiveVideos(active.filter((v) => v.isActive))
  }, [videos, currentTime])

  // Функция для обновления собранных дорожек
  const updateAssembledTracks = useCallback(() => {
    const videoGroups = new Map<number, MediaFile[]>()

    videos.forEach((video) => {
      // Используем индекс из массива + 1 как номер камеры
      const cameraNumber = videos.indexOf(video) + 1
      if (!videoGroups.has(cameraNumber)) {
        videoGroups.set(cameraNumber, [])
      }
      videoGroups.get(cameraNumber)?.push(video)
    })

    const tracks: AssembledTrack[] = Array.from(videoGroups.entries())
      .map(([cameraNumber, groupVideos]) => ({
        video: groupVideos[0],
        index: cameraNumber,
        isActive: true,
        allVideos: groupVideos,
      }))

    setAssembledTracks(tracks)
  }, [videos])

  useEffect(() => {
    setHasVideos(videos.length > 0)
  }, [videos])

  // Вызываем updateAssembledTracks при изменении списка видео
  useEffect(() => {
    hasVideos && updateAssembledTracks()
  }, [videos])

  return {
    videos,
    timeRanges,
    currentTime,
    updateTime: setCurrentTime,
    isLoading,
    timeToPercent,
    percentToTime,
    activeVideos,
    assembledTracks,
    hasVideos,
    maxDuration: Math.max(...timeRanges.map((x) => x.max)) - Math.min(...timeRanges.map((x) => x.min)),
  }
}
