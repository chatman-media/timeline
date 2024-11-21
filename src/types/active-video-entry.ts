import { VideoInfo } from "./video"

export interface ActiveVideoEntry {
  video: VideoInfo
  index: number
  isActive: boolean
  allVideos?: VideoInfo[]
}
