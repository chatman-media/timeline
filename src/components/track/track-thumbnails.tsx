import debounce from "lodash/debounce"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Track } from "@/types/videos"
import { calculateThumbnailRequirements, ThumbnailParams } from "@/utils/thumbnail-utils"
import useThumbnailStore from "@/stores/thumbnailStore"

interface TrackThumbnailsProps {
  track: Track
  trackStartTime: number
  trackEndTime: number
  scale?: number
}

// Глобальный кэш для хранения миниатюр между ре-рендерами
const thumbnailCache: Record<string, string[]> = {}

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
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbnailStore = useThumbnailStore()

  // Генерируем запросы миниатюр только если изменился масштаб
  const thumbnailRequests = useMemo(() => {
    if (prevScaleRef.current === scale) {
      return []
    }
    prevScaleRef.current = scale

    const THUMBNAIL_HEIGHT = 90
    const MIN_THUMBNAIL_WIDTH = THUMBNAIL_HEIGHT
    const MAX_THUMBNAILS_PER_VIDEO = 20
  // Добавляем эффект для инициализации containerRef
  useEffect(() => {
    // Форсируем перерасчет после монтирования компонента
    if (containerRef.current) {
      generateThumbnails()
    }
  }, []) // Пустой массив зависимостей для выполнения только при монтировании

  
  const thumbnailRequests = useMemo(() => {
    if (!containerRef.current) return []

    return track.allVideos.map((video) => {
      const duration = video.probeData?.format.duration || 0
      const containerWidth = containerRef.current?.clientWidth || 0
      
      const segmentWidth = (duration / (trackEndTime - trackStartTime)) * containerWidth * scale

      const params = {
        videoDuration: duration,
        containerWidth,
        scale,
        trackHeight: 52,
        segmentWidth,
      }

      const { count } = calculateThumbnailRequirements(params)

      // Проверяем хранилище
      if (thumbnailStore.hasThumbnails(video.name, scale, count)) {
        return {
          video: video.name,
          cached: true,
          thumbnails: thumbnailStore.getThumbnails(video.name, scale, count)!,
        }
      }

      return {
        video: video.name,
        cached: false,
        params: {
          start: 0,
          end: duration,
          count,
        },
      }
    })
  }, [track.allVideos, scale, trackEndTime, trackStartTime, thumbnailStore])
  const generateThumbnails = useCallback(
    debounce(async () => {
      if (thumbnailRequests.length === 0) return

      if (requestsInProgress.current) {
        abortController.current?.abort()
      }

      abortController.current = new AbortController()
      requestsInProgress.current = true

      const thumbnailMap: Record<string, string[]> = {}

      // Сначала добавляем кэшированные миниатюры
      thumbnailRequests
        .filter((req) => req.cached)
        .forEach((req) => {
          if ("thumbnails" in req) {
            thumbnailMap[req.video] = req.thumbnails
          }
        })

      // Обновляем состояние с кэшированными миниатюрами
      setThumbnails(thumbnailMap)

      // Затем делаем запросы для новых миниатюр
      try {
        await Promise.all(
          thumbnailRequests
            .filter((req) => !req.cached)
            .map(async (req) => {
              if (!("params" in req)) return

              try {
                const response = await fetch(
                  `/api/thumbnails?video=${
                    encodeURIComponent(req.video)
                  }&start=${req.params.start}&end=${req.params.end}&count=${req.params.count}`,
                  { signal: abortController.current?.signal },
                )

                if (!response.ok) return

                const data = await response.json()
                const cacheKey = `${req.video}-${scale}-${req.params.count}`
                thumbnailCache[cacheKey] = data.thumbnails
                thumbnailStore.addThumbnails(
                  req.video,
                  scale,
                  req.params.count,
                  data.thumbnails
                )

                setThumbnails((prev) => ({
                  ...prev,
                  [req.video]: data.thumbnails,
                }))
              } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                  console.log("Thumbnail request aborted")
                } else {
                  console.error("Error generating thumbnails:", error)
                }
              }
            }),
        )
      } finally {
        requestsInProgress.current = false
      }
    }, 300),
    [thumbnailRequests, scale],
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

        // Получаем размеры видео из probeData
        const videoStream = video.probeData.streams.find(
          (stream) => stream.codec_type === "video",
        )
        const aspectRatio = videoStream
          ? Number(videoStream.width) / Number(videoStream.height)
          : 16 / 9 // Значение по умолчанию

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
                  className="h-full"
                  style={{
                    flex: `${aspectRatio}`,
                    minWidth: 0,
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
