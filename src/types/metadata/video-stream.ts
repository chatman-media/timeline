export interface VideoStream {
  codec_type: string
  codec_name: string
  codec_long_name: string
  width?: number
  height?: number
  display_aspect_ratio?: string
  r_frame_rate?: string
  bit_rate?: string
  sample_rate?: string
  channels?: number
  color_space?: string
  color_range?: string
  level?: number
  is_avc?: boolean
  pix_fmt?: string
  nb_frames?: string
}
