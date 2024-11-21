export interface VideoFormat {
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
