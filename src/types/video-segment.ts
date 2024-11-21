export interface VideoSegment {
  cameraIndex: number
  startTime: number
  endTime: number
  duration: number
  totalBitrate?: number
  segments: VideoSegment[]
  is360: boolean // TODO: добавить углы обзора и выбор кадра
  isCombined: boolean // TODO: добавить информацию о том, что этот сегмент состоит из нескольких видео
}
