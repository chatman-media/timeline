import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AssembledTrack, MediaFile } from "@/types/videos"
import { TimeRange } from "@/types/scene"

export function useMedia() {
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasVideos, setHasVideos] = useState(false)
  const [activeCamera, setActiveCamera] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [timeRanges, setTimeRanges] = useState<{ min: number; max: number }[]>([])
  const [assembledTracks, setAssembledTracks] = useState<AssembledTrack[]>([])
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})
  const hasFetchedRef = useRef(false)

  // Вычисляем активные видео на основе текущего времени
  const activeVideos = useMemo(() => {
    if (!videos.length) return []

    return videos.filter((video) => {
      const startTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
      const duration = video.probeData.format.duration || 0
      const endTime = startTime + duration

      return currentTime >= startTime && currentTime <= endTime
    })
  }, [videos, currentTime])

  // Функция для преобразования времени в проценты
  const timeToPercent = useCallback((time: number) => {
    if (timeRanges.length === 0) return 0
    const minTime = Math.min(...timeRanges.map((x) => x.min))
    const maxTime = Math.max(...timeRanges.map((x) => x.max))
    const duration = maxTime - minTime
    return ((time - minTime) / duration) * 100
  }, [timeRanges])

  // Функция для преобразования процентов во время
  const percentToTime = useCallback((percent: number) => {
    if (timeRanges.length === 0) return 0
    const minTime = Math.min(...timeRanges.map((x) => x.min))
    const maxTime = Math.max(...timeRanges.map((x) => x.max))
    const duration = maxTime - minTime
    return minTime + (duration * percent) / 100
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
        creationTime: v.probeData.format.tags?.creation_time,
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
        if (!video.probeData.format.tags?.creation_time) return false
        const videoTime = new Date(video.probeData.format.tags?.creation_time).getTime() / 1000
        const startTime = videos[0]?.probeData.format.tags?.creation_time
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

    setActiveCamera(active.filter((v) => v.isActive)?.[0]?.index || 1)
  }, [videos, currentTime])

  // Функция для обновления собранных дорожек
  const updateAssembledTracks = useCallback(() => {
    if (!videos.length) return
    const videoGroups = new Map<string, MediaFile[]>()

    videos.forEach((video) => {
      const videoStream = video.probeData.streams.find((s) => s.codec_type === "video")
      if (!videoStream) return

      // Create a unique key for each camera type based on resolution and aspect ratio
      const cameraKey =
        `${videoStream.width}x${videoStream.height}_${videoStream.profile}_${videoStream.codec_name}`

      if (!videoGroups.has(cameraKey)) {
        videoGroups.set(cameraKey, [])
      }
      videoGroups.get(cameraKey)?.push(video)
    })

    // Sort videos within each group by creation time
    videoGroups.forEach((groupVideos) => {
      groupVideos.sort((a, b) => {
        const timeA = new Date(a.probeData.format.tags?.creation_time || 0).getTime()
        const timeB = new Date(b.probeData.format.tags?.creation_time || 0).getTime()
        return timeA - timeB
      })
    })

    // Create assembled tracks
    const tracks: AssembledTrack[] = Array.from(videoGroups.entries())
      .map(([cameraKey, groupVideos], index) => {
        // Check for time continuity
        const continuousSegments: MediaFile[][] = []
        let currentSegment: MediaFile[] = []

        if (groupVideos.length === 1) {
          continuousSegments.push([groupVideos[0]])
        } else {
          currentSegment = [groupVideos[0]]

          for (let i = 1; i < groupVideos.length; i++) {
            const currentVideo = groupVideos[i]
            const previousVideo = groupVideos[i - 1]

            const currentStartTime =
              new Date(currentVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000
            const previousEndTime =
              (new Date(previousVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000) +
              (previousVideo.probeData.format.duration || 0)

            // Allow for small gaps (e.g., 1 second) between videos
            const timeGap = currentStartTime - previousEndTime
            console.log("timeGap", timeGap)
            console.log(currentStartTime, previousEndTime)
            if (Math.abs(timeGap) <= 0.5) {
              currentSegment.push(currentVideo)
            } else {
              continuousSegments.push([...currentSegment])
              currentSegment = [currentVideo]
            }
          }
          // Add the last segment
          if (currentSegment.length > 0) {
            continuousSegments.push([...currentSegment])
          }
        }

        return {
          video: groupVideos[0], // First video for metadata
          index: index + 1, // Camera index starting from 1
          isActive: true,
          cameraKey,
          allVideos: groupVideos,
          continuousSegments, // Add this to your AssembledTrack type
          combinedDuration: groupVideos.reduce(
            (acc, video) => acc + (video.probeData.format.duration || 0),
            0,
          ),
        }
      })

    console.log(tracks)
    setAssembledTracks(tracks)
  }, [videos])

  useEffect(() => {
    setHasVideos(videos.length > 0)
  }, [videos])

  // Вызываем updateAssembledTracks при изменении списка видео
  useEffect(() => {
    updateAssembledTracks()
  }, [videos])

  return {
    videos,
    timeRanges,
    currentTime,
    updateTime: setCurrentTime,
    isLoading,
    hasVideos,
    activeVideos,
    videoRefs,
    activeCamera,
    setActiveCamera,
    isPlaying,
    setIsPlaying,
    timeToPercent,
    percentToTime,
    assembledTracks,
    maxDuration: Math.max(...timeRanges.map((x) => x.max)) -
      Math.min(...timeRanges.map((x) => x.min)),
  }
}
