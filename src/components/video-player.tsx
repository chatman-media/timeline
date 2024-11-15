import BitrateChart from "@/components/bitrate-chart"
import { VideoInfo } from "@/types/video"
import { useEffect, useRef, useState } from "react"

interface VideoPlayerProps {
  video: VideoInfo & { activeIndex: number }
  cameraNumber: number
  onVideoRef: (el: HTMLVideoElement | null) => void
  currentTime: number
}

export function VideoPlayer({
  video,
  cameraNumber,
  onVideoRef,
  currentTime,
}: VideoPlayerProps) {
  const [chartWidth, setChartWidth] = useState(0)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  useEffect(() => {
    if (!videoContainerRef.current) return

    const updateWidth = () => {
      if (videoContainerRef.current) {
        setChartWidth(videoContainerRef.current.offsetWidth)
      }
    }

    updateWidth()

    globalThis.addEventListener("resize", updateWidth)
    return () => globalThis.removeEventListener("resize", updateWidth)
  }, [])

  const formatBitrate = (bitrate: number) => {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`
  }

  console.log("Video bitrate data:", video.bitrate_data)

  console.log(`VideoPlayer render - Camera ${cameraNumber}`, {
    cameraNumber,
  })

  return (
    <div className="space-y-2">
      <div
        ref={videoContainerRef}
        className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        <video
          ref={onVideoRef}
          src={video.path}
          className={`video-${cameraNumber} w-full h-full object-contain`}
          playsInline
          muted
        />
        <div className="absolute top-2 left-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-xl font-bold text-white">
            {cameraNumber}
          </span>
        </div>
      </div>
      <div className="w-full">
        {video.bitrate_data && video.bitrate_data.length > 0
          ? (
            <BitrateChart
              data={video.bitrate_data}
              width={chartWidth}
              height={50}
              tooltipOpen={isTooltipOpen}
              showTooltip={() => setIsTooltipOpen(true)}
              hideTooltip={() => setIsTooltipOpen(false)}
              currentTime={currentTime}
            />
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 hidden">
              No bitrate data available
            </div>
          )}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <div className="grid grid-cols-2 gap-x-4">
          <p className="font-medium">{video.name}</p>
          <p className="text-right">{video.metadata.video_stream?.codec_name.toUpperCase()}</p>
          <span className="w-full flex justify-between">
            <span className="">
              {video.metadata.video_stream?.width} × {video.metadata.video_stream?.height}
            </span>
            <span className="text-right">{video.metadata.video_stream?.display_aspect_ratio}</span>
          </span>
          <p className="text-right">{formatBitrate(video.metadata.format.bit_rate)}</p>
          {/* <p>{formatDuration(video.metadata.format.duration)}</p> */}
        </div>
      </div>
    </div>
  )
}
