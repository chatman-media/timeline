import { MediaFile } from "@/types/videos"
import { formatBitrate, formatDuration } from "@/lib/utils"
import { SceneSegment } from "@/types/scene"

interface TimelineProps {
  videos: MediaFile[]
  timeRange: { min: number; max: number }
  selectedSegments: Array<SceneSegment>
  onPlaySegment: (cameraIndex: number, startTime: number, endTime: number) => void
}

export const Timeline: React.FC<TimelineProps> = (
  { videos, timeRange, selectedSegments, onPlaySegment },
) => {
  // Нормализуем timeRange относительно минимального времени
  const normalizedTimeRange = {
    min: 0,
    max: timeRange.max - timeRange.min,
  }
  const totalDuration = normalizedTimeRange.max - normalizedTimeRange.min

  // Функция для проверки последовательности видео
  const isSequentialVideos = (video1: MediaFile, video2: MediaFile) => {
    if (
      !video1.probeData.format.start_time || !video2.probeData.format.start_time
    ) return false

    // Получаем время окончания первого видео
    const video1End = new Date(video1.probeData.format.start_time).getTime() / 1000 +
      (video1.probeData.format.duration || 0)

    // Получаем время начала второго видео
    const video2Start = new Date(video2.probeData.format.start_time).getTime() / 1000

    // Проверяем метаданные видео на совместимость
    const videoStream1 = video1.probeData.streams.find((s) => s.codec_type === "video")
    const videoStream2 = video2.probeData.streams.find((s) => s.codec_type === "video")

    const isSameFormat = videoStream1 && videoStream2 &&
      videoStream1.codec_name === videoStream2.codec_name &&
      videoStream1.width === videoStream2.width &&
      videoStream1.height === videoStream2.height

    const isTimeSequential = Math.abs(video1End - video2Start) <= 5

    return isSameFormat && isTimeSequential
  }

  // Новая логика группировки
  const groupedVideos = videos.reduce((acc: MediaFile[][], currentVideo) => {
    // Проверяем, можно ли добавить текущее видео в существующую группу
    let addedToExisting = false

    for (let i = 0; i < acc.length; i++) {
      const group = acc[i]
      // Проверяем с каждым видео в группе
      const canJoinGroup = group.some((groupVideo) =>
        isSequentialVideos(groupVideo, currentVideo) ||
        isSequentialVideos(currentVideo, groupVideo)
      )

      if (canJoinGroup) {
        acc[i] = [...group, currentVideo]
        addedToExisting = true
        break
      }
    }

    // Если видео не добавлено в существующие группы, создаем новую
    if (!addedToExisting) {
      acc.push([currentVideo])
    }

    return acc
  }, [])

  return (
    <div className="w-full">
      {/* Трек времени со всеми сегментами */}
      <div className="relative h-8 mb-2">
        <div className="w-12 text-sm">Time</div>
        <div className="absolute inset-0 ml-12">
          {selectedSegments.map((segment, index) => (
            <div
              key={index}
              className="absolute h-full bg-yellow-500/50"
              style={{
                left: `${
                  ((segment.startTime - timeRange.min) / (timeRange.max - timeRange.min)) * 100
                }%`,
                width: `${
                  ((segment.endTime - segment.startTime) / (timeRange.max - timeRange.min)) * 100
                }%`,
              }}
            >
              <span className="absolute left-0 w-8 text-xs text-muted-foreground">
                {/* {index + 1} */}
              </span>
            </div>
          ))}
        </div>
      </div>

      {groupedVideos.map((group) => {
        const firstVideo = group[0]

        // Рассчитываем общую длительность группы как сумму длительностей всех видео
        const groupDuration = group.reduce(
          (total, video) => total + (video.probeData.format.duration || 0),
          0,
        )

        // Получаем время начала видео с делением на 1000
        const videoStartTime = firstVideo.probeData.format.start_time
          ? new Date(firstVideo.probeData.format.start_time).getTime() / 1000
          : timeRange.min
        const videoEndTime = videoStartTime + groupDuration

        // Проверяем и ограничиваем значени
        const clampedStartTime = Math.max(videoStartTime, timeRange.min)
        const clampedEndTime = Math.min(videoEndTime, timeRange.max)

        // Вычисляем проценты с проверкой на корректность значений
        const startOffset = Math.max(
          0,
          Math.min(100, ((clampedStartTime - timeRange.min) / totalDuration) * 100),
        )
        const width = Math.max(
          0,
          Math.min(100, ((clampedEndTime - clampedStartTime) / totalDuration) * 100),
        )

        return (
          <div key={firstVideo.path} className="h-5 w-full relative mb-1 flex items-center">
            <div className="absolute left-0 w-8 text-xs text-muted-foreground">
              <span>V{videos.indexOf(firstVideo) + 1}</span>
            </div>
            <div className="absolute h-4 bg-secondary left-8 right-0">
              <div className="absolute inset-0 flex items-center px-2 justify-between">
                <div className="flex gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {group.length > 1
                      ? `${group.length} FILES`
                      : (firstVideo.probeData.format?.filename || "").toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>
                    {(firstVideo.probeData.streams.find((s) => s.codec_type === "video")
                      ?.codec_name || "").toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>
                    {firstVideo.probeData.streams.find((s) => s.codec_type === "video")
                      ?.width}×{firstVideo.probeData.streams.find((s) => s.codec_type === "video")
                      ?.height}
                  </span>
                  <span>•</span>
                  <span>
                    {firstVideo.probeData.streams.find((s) => s.codec_type === "video")
                      ?.display_aspect_ratio}
                  </span>
                  <span>•</span>
                  <span>
                    {formatBitrate(
                      (group.reduce(
                        (sum, video) => sum + (video.probeData.format.bit_rate || 0),
                        0,
                      ) /
                        group.length) || 0,
                    )}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {formatDuration(groupDuration, 0)}
                </div>
              </div>

              <div
                className="absolute h-full bg-secondary-foreground/20"
                style={{ left: `${startOffset}%`, width: `${width}%` }}
              >
                {selectedSegments.filter((segment) => segment.videoFile === firstVideo.path).map((
                  segment,
                  idx,
                ) => (
                  <div
                    key={idx}
                    className="absolute h-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer"
                    style={{
                      left: `${((segment.startTime - timeRange.min) / totalDuration) * 100}%`,
                      width: `${((segment.endTime - segment.startTime) / totalDuration) * 100}%`,
                    }}
                    onClick={() =>
                      onPlaySegment(segment.cameraIndex, segment.startTime, segment.endTime)}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
