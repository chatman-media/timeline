import { MediaFile, VideoSegment } from "@/types/video"
import { formatBitrate, formatDuration } from "@/lib/utils"

interface TimelineProps {
  videos: MediaFile[]
  timeRange: { min: number; max: number }
  selectedSegments: VideoSegment[]
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
    if (!video1.probeData.format.creation_time || !video2.probeData.format.creation_time) {
      return false
    }

    // Получаем время окончания первого видео
    const video1End = new Date(video1.probeData.format.creation_time).getTime() / 1000 +
      parseFloat(video1.probeData.format?.duration || "0")

    // Получаем время начала второго видео
    const video2Start = new Date(video2.probeData.format.creation_time).getTime() / 1000

    // Проверяем метаданные видео на совместимость
    const isSameFormat = video1.probeData.format.video_stream?.codec_name ===
        video2.probeData.format.video_stream?.codec_name &&
      video1.probeData.format.video_stream?.width === video2.probeData.format.video_stream?.width &&
      video1.probeData.format.video_stream?.height === video2.probeData.format.video_stream?.height

    // Увеличиваем допуск до 5 секунд, так как видим небольшие расхождения в логах
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

  // Находим видео поток в массиве streams
  const getVideoStream = (video: MediaFile) => {
    return video.probeData.streams.find((stream) => stream.codec_type === "video")
  }

  return (
    <div className="space-y-1">
      {/* Видео треки */}
      {groupedVideos
        .filter((group) => group.length > 1)
        .map((group) => {
          const firstVideo = group[0]

          // Рассчитываем общую длительность группы как сумму длительностей всех видео
          const groupDuration = group.reduce(
            (total, video) => total + video.probeData.format?.duration,
            0,
          )

          // Получаем время начала видео с ��елением на 1000
          const videoStartTime = firstVideo.probeData.format.creation_time
            ? new Date(firstVideo.probeData.format.creation_time).getTime() / 1000
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
                      {group.length > 1 ? `${group.length} FILES` : firstVideo.name.toUpperCase()}
                    </span>
                    <span>•</span>
                    {/* Используем найденный видео поток */}
                    {(() => {
                      const videoStream = getVideoStream(firstVideo)
                      return videoStream
                        ? (
                          <>
                            <span>{videoStream.codec_name?.toUpperCase()}</span>
                            <span>•</span>
                            <span>{videoStream.width}×{videoStream.height}</span>
                            <span>•</span>
                            <span>{videoStream.display_aspect_ratio}</span>
                            <span>•</span>
                          </>
                        )
                        : null
                    })()}
                    <span>
                      {formatBitrate(
                        group.reduce(
                          (sum, video) => sum + (video.probeData.format?.bit_rate || 0),
                          0,
                        ) / group.length,
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

      {/* Аудио треки */}
      {groupedVideos
        .filter((group) => group.length === 1)
        .map((group) => {
          const firstVideo = group[0]

          // Рассчитываем общую длительность группы как сумму длительностей всех видео
          const groupDuration = firstVideo.probeData.format?.duration

          // Получаем время начала видео с делением на 1000
          const videoStartTime = firstVideo.probeData.format.creation_time
            ? new Date(firstVideo.probeData.format.creation_time).getTime() / 1000
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
            <div key={firstVideo.path} className="h-4 w-full relative mb-1 flex items-center">
              <div className="absolute left-0 w-8 text-xs text-muted-foreground">
                <span>A{videos.indexOf(firstVideo) + 1}</span>
              </div>
              <div className="absolute h-3 bg-secondary/50 left-8 right-0">
                <div className="absolute inset-0 flex items-center px-2 justify-between">
                  <div className="flex gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {firstVideo.name.toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>
                      {formatBitrate(
                        firstVideo.probeData.format?.bit_rate || 0,
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
