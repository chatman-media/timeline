export interface Track {
  id: string
  name: string
  type: "video" | "audio"
  mediaId: string
  startTime: number
  endTime: number
  volume: number
  isMuted: boolean
  isLocked: boolean
  isVisible: boolean
}
