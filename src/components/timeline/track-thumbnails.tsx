import debounce from "lodash/debounce"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AssembledTrack } from "@/types/videos"

interface TrackThumbnailsProps {
  track: AssembledTrack
  trackStartTime: number
  trackEndTime: number
  scale?: number
}

// Глобальный кэш для хранения миниатюр между ре-рендерами
const thumbnailCache: Record<string, string> = {}

export const TrackThumbnails = memo(function TrackThumbnails({
  track,
  trackStartTime,
  trackEndTime,
  scale = 1,
}: TrackThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<Record<string, string[]>>({})
  const requestsInProgress = useRef<boolean>(false)
  const abortController = useRef<AbortController | null>(null)

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
        cacheKey: `${video.name}-${(duration / thumbnailCount) * i}`,
      }))
    }).flat()
  }, [track.allVideos, scale])

  const generateThumbnails = useCallback(
    debounce(async () => {
      if (requestsInProgress.current) {
        // Отменяем предыдущие запросы
        abortController.current?.abort()
      }

      abortController.current = new AbortController()
      requestsInProgress.current = true

      const thumbnailMap: Record<string, string[]> = {}
      const newRequests: Array<{ video: string; timestamp: number; cacheKey: string }> = []

      // Сначала используем кэшированные миниатюры
      thumbnailRequests.forEach(({ video, timestamp, cacheKey }) => {
        if (!thumbnailMap[video]) {
          thumbnailMap[video] = []
        }

        if (thumbnailCache[cacheKey]) {
          thumbnailMap[video].push(thumbnailCache[cacheKey])
        } else {
          newRequests.push({ video, timestamp, cacheKey })
        }
      })

      // Обновляем состояние с кэшированными миниатюрами
      setThumbnails(thumbnailMap)

      // Затем делаем запросы для новых миниатюр
      try {
        await Promise.all(
          newRequests.map(async ({ video, timestamp, cacheKey }) => {
            try {
              const response = await fetch(
                `/api/thumbnail?video=${encodeURIComponent(video)}&timestamp=${timestamp}`,
                { signal: abortController.current?.signal },
              )
              if (!response.ok) return

              const data = await response.json()
              thumbnailCache[cacheKey] = data.thumbnail

              setThumbnails((prev) => ({
                ...prev,
                [video]: [...(prev[video] || []), data.thumbnail],
              }))
            } catch (error) {
              if (error instanceof Error && error.name === "AbortError") {
                console.log("Thumbnail request aborted")
              } else {
                console.error("Error generating thumbnail:", error)
              }
            }
          }),
        )
      } finally {
        requestsInProgress.current = false
      }
    }, 300),
    [],
  )

  useEffect(() => {
    generateThumbnails()

    return () => {
      generateThumbnails.cancel()
      abortController.current?.abort()
    }
  }, [])

  console.log(track.allVideos, scale)

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
}, (prevProps, nextProps) => {
  // Сравниваем только те пропсы, которые влияют на отображение миниатюр
  return (
    prevProps.scale === nextProps.scale &&
    prevProps.trackStartTime === nextProps.trackStartTime &&
    prevProps.trackEndTime === nextProps.trackEndTime &&
    prevProps.track.cameraKey === nextProps.track.cameraKey &&
    prevProps.track.index === nextProps.track.index
  )
})
