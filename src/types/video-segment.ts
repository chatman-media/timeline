export interface VideoSegment {
  cameraIndex: number
  startTime: number
  endTime: number
  duration: number
  videoFile: string
  totalBitrate?: number
  is360?: boolean
  isCombined?: boolean
}
