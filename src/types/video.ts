import { FfprobeData } from "fluent-ffmpeg"

export interface BitrateDataPoint {
  timestamp: number
  bitrate: number
}

export interface MediaFile {
  name: string
  path: string
  thumbnail: string | null
  probeData: FfprobeData
  isVideo: boolean
}
