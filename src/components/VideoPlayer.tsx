import BitrateChart from "@/components/BitrateChart"
import { VideoMetadata } from "./video-metadata"
import { VideoInfo } from "@/pages/api/hello"

interface VideoPlayerProps {
  video: VideoInfo
  activeIndex: number
  cameraNumber: number // добавляем новый проп
  timezone: string
  formatDuration: (seconds: number) => string
  onVideoRef: (el: HTMLVideoElement | null) => void
}

export function VideoPlayer({
  video,
  activeIndex,
  cameraNumber,
  timezone,
  formatDuration,
  onVideoRef,
}: VideoPlayerProps) {
  console.log("Video bitrate data:", video.bitrate_data) // для отладки

  console.log(`VideoPlayer render - Camera ${cameraNumber}, Active: ${activeIndex}`, {
    isActive: activeIndex === cameraNumber,
    activeIndex,
    cameraNumber,
  })

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${
        activeIndex === cameraNumber ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <div
        className={`relative w-full ${
          video.metadata.video_stream?.display_aspect_ratio === "1:1"
            ? "pt-[75%]" // Уменьшаем высоту для квадратных видео до 75% от ширины
            : "pt-[56.25%]" // Оставляем 16:9 для обычных
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
          <video
            ref={onVideoRef}
            src={`/videos/${video.name}`}
            className={video.metadata.video_stream?.display_aspect_ratio === "1:1"
              ? "h-full w-auto"
              : "w-full h-auto"}
            muted
            playsInline
          />
        </div>
      </div>
      <div className="w-full h-24">
        {video.bitrate_data && video.bitrate_data.length > 0
          ? (
            <BitrateChart
              data={video.bitrate_data}
              width="100%"
              height={96}
              tooltipOpen={true}
              showTooltip={() => {}}
              hideTooltip={() => {}}
              updateTooltip={() => {}}
            />
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No bitrate data available
            </div>
          )}
      </div>
      <div className="flex flex-col">
        <VideoMetadata
          video={video}
          activeIndex={activeIndex}
          timezone={timezone}
          formatDuration={formatDuration}
        />
      </div>
    </div>
  )
}
