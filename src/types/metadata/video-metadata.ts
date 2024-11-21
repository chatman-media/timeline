import { VideoStream } from "./video-stream"
import { VideoFormat } from "./video-format"
import { AudioStream } from "./audio-stream"

export interface VideoMetadata {
  format: VideoFormat
  video_stream?: VideoStream
  audio_stream?: AudioStream
  creation_time?: string
  tags?: Record<string, string>
}
