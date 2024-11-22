import { VideoInfo } from "@/types/video"
import { formatBitrate, formatDuration } from "@/lib/utils"

interface TimelineProps {
  videos: VideoInfo[]
  timeRange: { min: number; max: number }
  selectedSegments: Array<{ cameraIndex: number; startTime: number; endTime: number }>
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
  const isSequentialVideos = (video1: VideoInfo, video2: VideoInfo) => {
    if (!video1.metadata.creation_time || !video2.metadata.creation_time) return false

    // Получаем время окончания первого видео
    const video1End = new Date(video1.metadata.creation_time).getTime() / 1000 +
      video1.metadata.format.duration

    // Получаем время начала второго видео
    const video2Start = new Date(video2.metadata.creation_time).getTime() / 1000

    // Проверяем метаданные видео на совместимость
    const isSameFormat =
      video1.metadata.video_stream?.codec_name === video2.metadata.video_stream?.codec_name &&
      video1.metadata.video_stream?.width === video2.metadata.video_stream?.width &&
      video1.metadata.video_stream?.height === video2.metadata.video_stream?.height

    // Увеличиваем допуск до 5 секунд, так как видим небольшие расхождения в логах
    const isTimeSequential = Math.abs(video1End - video2Start) <= 5

    console.log("Checking sequence:", {
      video1Path: video1.path,
      video2Path: video2.path,
      video1End,
      video2Start,
      timeDiff: Math.abs(video1End - video2Start),
      isTimeSequential,
      isSameFormat,
    })

    return isSameFormat && isTimeSequential
  }

  // Новая логика группировки
  const groupedVideos = videos.reduce((acc: VideoInfo[][], currentVideo) => {
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
      {groupedVideos.map((group) => {
        const firstVideo = group[0]

        // Рассчитываем общую длительность группы как сумму длительностей всех видео
        const groupDuration = group.reduce(
          (total, video) => total + video.metadata.format.duration,
          0,
        )

        // Получаем время начала видео с делением на 1000
        const videoStartTime = firstVideo.metadata.creation_time
          ? new Date(firstVideo.metadata.creation_time).getTime() / 1000
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

        console.log("Timeline calculations:", {
          videoStartTime,
          videoEndTime,
          timeRange,
          totalDuration,
          startOffset,
          width,
        })

        const cameraSegments = selectedSegments.filter(
          (seg) => seg.cameraIndex === videos.indexOf(firstVideo),
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
                      : firstVideo.metadata.format?.filename.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{firstVideo.metadata.video_stream?.codec_name.toUpperCase()}</span>
                  <span>•</span>
                  <span>
                    {firstVideo.metadata.video_stream?.width}×{firstVideo.metadata.video_stream
                      ?.height}
                  </span>
                  <span>•</span>
                  <span>{firstVideo.metadata.video_stream?.display_aspect_ratio}</span>
                  <span>•</span>
                  <span>
                    {formatBitrate(
                      group.reduce((sum, video) => sum + video.metadata.format.bit_rate, 0) /
                        group.length,
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
                {cameraSegments.map((segment, idx) => (
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
