import BitrateChart from "@/components/bitrate-chart"
import { VideoMetadata } from "./video-metadata"
import { VideoInfo } from "@/types/video"

interface VideoPlayerProps {
  video: VideoInfo & { activeIndex: number }
  cameraNumber: number
  onVideoRef: (el: HTMLVideoElement | null) => void
}

export function VideoPlayer({
  video,
  cameraNumber,
  onVideoRef,
}: VideoPlayerProps) {
  console.log("Video bitrate data:", video.bitrate_data)

  console.log(`VideoPlayer render - Camera ${cameraNumber}`, {
    cameraNumber,
  })

  return (
    <div className="relative rounded-lg overflow-hidden">
      <div
        className={`relative w-full ${
          video.metadata.video_stream?.width === video.metadata.video_stream?.height
            ? "pt-[75%]"
            : "pt-[56.25%]"
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
          <video
            ref={onVideoRef}
            src={`/videos/${video.name}`}
            className={video.metadata.video_stream?.width === video.metadata.video_stream?.height
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
              width={400}
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
        />
      </div>
    </div>
  )
}
