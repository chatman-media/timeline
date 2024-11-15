export interface VideoMetadata {
  format: {
    filename: string
    format_name: string
    format_long_name: string
    duration: number
    size: number
    bit_rate: number
    start_time?: number
    nb_streams?: number
    probe_score?: number
  }
  video_stream?: {
    codec_name: string
    codec_long_name: string
    width: number
    height: number
    display_aspect_ratio: string
    fps: number
    bit_rate: number
    pix_fmt?: string
    color_space?: string
    color_range?: string
    level?: number
    is_avc?: boolean
    frame_count?: number
  }
  audio_stream?: {
    codec_name: string
    codec_long_name: string
    sample_rate: string
    channels: number
    bit_rate: number
  }
  creation_time?: string
  tags?: Record<string, string>
}
