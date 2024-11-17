import { VideoSegment } from "@/lib/compilation"

interface SegmentsTimelineProps {
  segments: VideoSegment[]
  timeRange: { min: number; max: number }
}

export function SegmentsTimeline({ segments, timeRange }: SegmentsTimelineProps) {
  const duration = timeRange.max - timeRange.min
  const cameras = [0, 1, 2, 3]

  console.log("Timeline Debug:", {
    segments,
    timeRange,
    duration,
  })

  return (
    <div className="space-y-2">
      {cameras.map((cameraId) => (
        <div key={cameraId} className="flex items-center gap-2">
          <div className="w-16 text-sm">Cam {cameraId}</div>
          <div className="w-full h-6 bg-gray-100 relative rounded">
            {segments
              .filter((segment) => segment.camera === cameraId)
              .map((segment, idx) => {
                const left = ((segment.startTime - timeRange.min) / duration) * 100
                const width = (segment.duration / duration) * 100

                console.log(`Segment ${cameraId}-${idx}:`, {
                  camera: segment.camera,
                  startTime: segment.startTime,
                  duration: segment.duration,
                  left,
                  width,
                })

                return (
                  <div
                    key={idx}
                    className="absolute h-full rounded"
                    style={{
                      left: `${Math.max(0, left)}%`,
                      width: `${Math.max(0.5, width)}%`,
                      backgroundColor: `hsl(${(cameraId * 60) % 360}, 70%, 60%)`,
                    }}
                    title={`Start: ${segment.startTime.toFixed(1)}s, Duration: ${
                      segment.duration.toFixed(1)
                    }s`}
                  />
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
