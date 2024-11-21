import type { VideoStream } from "./video-stream"
import type { VideoFormat } from "./video-format"
export interface FFProbeData {
  streams: VideoStream[]
  format: VideoFormat
}
