import type { VideoStream } from "./video-stream"

export interface FFProbeData {
  streams: VideoStream[]
  format: {
    format_name: string
    format_long_name: string
    duration: string
    size: number
    bit_rate: string
    tags?: Record<string, string>
    start_time?: string
    nb_streams?: number
    probe_score?: number
  }
}
