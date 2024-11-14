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
  const width = 600 // или можно передавать через пропсы

  console.log("Video bitrate data:", video.bitrate_data) // для отладки

  console.log(`VideoPlayer render - Camera ${cameraNumber}, Active: ${activeIndex}`, {
    isActive: activeIndex === cameraNumber,
    activeIndex,
    cameraNumber,
  })

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`relative overflow-hidden border ${
          activeIndex === cameraNumber ? "border-red-500 border-2" : "border-gray-200"
        }`}
      >
        <video
          ref={onVideoRef}
          src={`/videos/${video.name}`}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
      </div>
      <div className="w-full h-24">
        {video.bitrate_data && video.bitrate_data.length > 0
          ? (
            <BitrateChart
              data={video.bitrate_data}
              width={width}
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
