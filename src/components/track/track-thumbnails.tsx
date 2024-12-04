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

const TrackThumbnails = memo(function TrackThumbnails({
  track,
  trackStartTime,
  trackEndTime,
  scale: initialScale = 1,
}: TrackThumbnailsProps) {
  const prevScaleRef = useRef(initialScale)
  const [scale] = useState(() => {
    const savedScale = localStorage.getItem("timeline_scale")
    return savedScale ? parseFloat(savedScale) : initialScale
  })

  const [thumbnails, setThumbnails] = useState<Record<string, string[]>>({})
  const requestsInProgress = useRef<boolean>(false)
  const abortController = useRef<AbortController | null>(null)

  // Генерируем запросы миниатюр только если изменился масштаб
  const thumbnailRequests = useMemo(() => {
    if (prevScaleRef.current === scale) {
      return []
    }
    prevScaleRef.current = scale

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
      if (thumbnailRequests.length === 0) return

      if (requestsInProgress.current) {
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
              if (!response.ok) {
                console.error("Thumbnail fetch failed:", response.status, response.statusText)
                return
              }

              const data = await response.json()
              if (!data.thumbnail) {
                console.error("No thumbnail data received")
                return
              }

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
    [thumbnailRequests],
  )

  useEffect(() => {
    if (thumbnailRequests.length > 0) {
      generateThumbnails()
    }

    return () => {
      generateThumbnails.cancel()
      abortController.current?.abort()
    }
  }, [thumbnailRequests])

  // In TrackThumbnails component
  useEffect(() => {
    console.log("Thumbnails state:", {
      thumbnailRequests: thumbnailRequests.length,
      currentThumbnails: thumbnails,
      scale,
      trackStartTime,
      trackEndTime,
    })
  }, [thumbnailRequests, thumbnails, scale, trackStartTime, trackEndTime])

  return (
    <div className="flex-1 relative" style={{ minHeight: "90px" }}>
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
              left: `${Math.max(0, startPercent)}%`,
              width: `${Math.min(100, widthPercent)}%`,
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
                    backgroundRepeat: "no-repeat",
                    minHeight: "90px",
                    border: "1px solid rgba(1, 77, 82, 0.2)",
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
  // Строгое сравнение пропсов
  return (
    prevProps.scale === nextProps.scale &&
    prevProps.track.allVideos.length === nextProps.track.allVideos.length &&
    prevProps.track.allVideos.every((video, index) =>
      video.id === nextProps.track.allVideos[index].id
    )
  )
})

export { TrackThumbnails }
