import { VideoInfo } from "@/types/video"
import { formatBitrate, formatDuration } from "@/lib/utils"

interface TimelineProps {
  videos: VideoInfo[]
  timeRange: { min: number; max: number }
  selectedSegments: Array<{ cameraIndex: number; startTime: number; endTime: number }>
}

export const Timeline: React.FC<TimelineProps> = ({ videos, timeRange, selectedSegments }) => {
  const totalDuration = timeRange.max - timeRange.min

  // Функция для проверки последовательности видео
  const isSequentialVideos = (video1: VideoInfo, video2: VideoInfo) => {
    // Извлекаем числа из имени файла формата VID_YYYYMMDD_HHMMSS_XXX
    const getFileInfo = (path: string) => {
      const match = path.match(/VID_(\d{8})_(\d{6})_(\d+)/)
      if (!match) return null
      return {
        date: match[1],
        time: match[2],
        sequence: parseInt(match[3]),
      }
    }

    const info1 = getFileInfo(video1.path)
    const info2 = getFileInfo(video2.path)

    if (!info1 || !info2) return false

    // Проверяем, что файлы от одной даты
    if (info1.date !== info2.date) return false

    // Проверяем последовательность номеров
    if (info2.sequence !== info1.sequence + 1) return false

    // Используем metadata для проверки временной последовательности
    const video1End = new Date(video1.metadata.creation_time!).getTime() / 1000 +
      video1.metadata.format.duration
    const video2Start = new Date(video2.metadata.creation_time!).getTime() / 1000

    // Увеличиваем допуск до 1 секунды
    return Math.abs(video1End - video2Start) < 1
  }

  // Группируем последовательные видео
  const groupedVideos = videos.reduce((acc: VideoInfo[][], video, index) => {
    const prevVideo = videos[index - 1]

    if (prevVideo && isSequentialVideos(prevVideo, video)) {
      acc[acc.length - 1].push(video)
    } else {
      acc.push([video])
    }
    return acc
  }, [])

  return (
    <div className="w-full">
      {groupedVideos.map((group) => {
        const firstVideo = group[0]
        const lastVideo = group[group.length - 1]

        const videoStartTime = new Date(firstVideo.metadata.creation_time!).getTime() / 1000
        const videoEndTime = new Date(lastVideo.metadata.creation_time!).getTime() / 1000 +
          lastVideo.metadata.format.duration

        const startOffset = ((videoStartTime - timeRange.min) / totalDuration) * 100
        const width = ((videoEndTime - videoStartTime) / totalDuration) * 100

        const cameraSegments = selectedSegments.filter(
          (seg) => seg.cameraIndex === videos.indexOf(firstVideo),
        )

        return (
          <div key={firstVideo.path} className="h-5 w-full relative mb-1 flex items-center">
            <div className="absolute left-0 w-48 text-xs text-muted-foreground">
              <span>V{videos.indexOf(firstVideo) + 1}</span>
            </div>
            <div className="absolute h-4 bg-secondary left-8 right-0 flex items-center justify-between px-2 text-[10px]">
              <div className="flex gap-2 text-[11px] text-muted-foreground z-10">
                <span>{firstVideo.metadata.format?.filename.toUpperCase()}</span>
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
                <span>{formatBitrate(firstVideo.metadata.format.bit_rate)}</span>
                <span>•</span>
                <span>{formatDuration(firstVideo.metadata.format.duration, 0)}</span>
              </div>

              <div
                className="absolute h-full bg-secondary-foreground/20"
                style={{ left: `${startOffset}%`, width: `${width}%` }}
              >
                {cameraSegments.map((segment, idx) => {
                  const segStartOffset = ((segment.startTime - timeRange.min) / totalDuration) * 100
                  const segWidth = ((segment.endTime - segment.startTime) / totalDuration) * 100

                  return (
                    <div
                      key={idx}
                      className="absolute h-full bg-yellow-400"
                      style={{
                        left: `${segStartOffset}%`,
                        width: `${segWidth}%`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
