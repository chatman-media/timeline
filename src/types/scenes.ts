import { BitrateDataPoint } from "./video"

export interface SceneDistributionParams {
  targetDuration: number
  totalDuration: number
  numCameras: number
  averageSceneDuration: number
  cameraChangeFrequency: number
  bitrateData?: Array<BitrateDataPoint[]>
}

export interface SceneSegment {
  startTime: number
  endTime: number
  cameraIndex: number
  totalBitrate?: number
}
