import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AssembledTrack } from "@/types/videos"

interface TrackThumbnailsProps {
  track: AssembledTrack
  trackStartTime: number
  trackEndTime: number
  scale?: number
}

// Глобальный кэш для хранения миниатюр между ре-рендерами
const thumbnailCache: Record<string, string> = {}

export function TrackThumbnails({
  track,
  trackStartTime,
  trackEndTime,
  scale = 1,
}: TrackThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string[]>>({})
  const requestsInProgress = useRef<boolean>(false)

  const thumbnailRequests = useMemo(() => {
    const THUMBNAIL_HEIGHT = 90
    const MIN_THUMBNAIL_WIDTH = THUMBNAIL_HEIGHT
    const MAX_THUMBNAILS_PER_VIDEO = 20

    return track.allVideos.map((video) => {
      const duration = video.probeData.format.duration || 0
      const videoDurationPercent = duration / (trackEndTime - trackStartTime)

      const containerWidth = document.querySelector(".timeline")?.clientWidth || 1000
      const videoWidth = containerWidth * videoDurationPercent * scale

      const maxPossibleThumbnails = Math.floor(videoWidth / MIN_THUMBNAIL_WIDTH)
      const optimalThumbnailCount = Math.min(
        maxPossibleThumbnails,
        MAX_THUMBNAILS_PER_VIDEO,
        Math.ceil(duration),
      )

      const thumbnailCount = Math.max(1, optimalThumbnailCount)

      return Array.from({ length: thumbnailCount }, (_, i) => ({
        video: video.name,
        timestamp: (duration / thumbnailCount) * i,
      }))
    }).flat()
  }, [scale]) // Зависим только от scale

  useEffect(() => {
    const generateThumbnails = async () => {
      if (requestsInProgress.current) return
      requestsInProgress.current = true

      const thumbnailMap: Record<string, string[]> = {}

      for (const { video, timestamp } of thumbnailRequests) {
        // Создаем уникальный ключ для кэша
        const cacheKey = `${video}-${timestamp}`

        if (!thumbnailMap[video]) {
          thumbnailMap[video] = []
        }

        // Проверяем кэш перед запросом
        if (thumbnailCache[cacheKey]) {
          thumbnailMap[video].push(thumbnailCache[cacheKey])
          continue
        }

        try {
          const response = await fetch(
            `/api/thumbnail?video=${encodeURIComponent(video)}&timestamp=${timestamp}`,
          )
          if (!response.ok) continue
          const data = await response.json()

          // Сохраняем в кэш
          thumbnailCache[cacheKey] = data.thumbnail
          thumbnailMap[video].push(data.thumbnail)
        } catch (error) {
          console.error("Error generating thumbnail:", error)
        }
      }

      setThumbnails(thumbnailMap)
      requestsInProgress.current = false
    }

    generateThumbnails()
  }, [thumbnailRequests])

  const getVideoPosition = useCallback((video: any) => {
    const videoStartTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() /
      1000
    const videoDuration = video.probeData.format.duration || 0

    // Базовые проценты без масштаба
    const startPercent = ((videoStartTime - trackStartTime) / (trackEndTime - trackStartTime)) * 100
    const widthPercent = (videoDuration / (trackEndTime - trackStartTime)) * 100

    // Применяем масштаб только к ширине
    const scaledWidth = widthPercent * scale

    return {
      left: `${startPercent}%`,
      width: `${scaledWidth}%`,
    }
  }, [trackStartTime, trackEndTime, scale])

  return (
    <div className="flex-1 relative">
      {track.allVideos.map((video) => {
        const videoStartTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() /
          1000
        const videoDuration = video.probeData.format.duration || 0
        const startPercent = ((videoStartTime - trackStartTime) / (trackEndTime - trackStartTime)) *
          100
        const widthPercent = (videoDuration / (trackEndTime - trackStartTime)) * 100

        return (
          <div
            key={video.id}
            className="absolute h-full"
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            }}
          >
            <div className="h-full w-full flex">
              {thumbnails[video.name]?.map((thumbnail, idx) => (
                <div
                  key={idx}
                  className="h-full flex-1"
                  style={{
                    backgroundImage: `url(${thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
