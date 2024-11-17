import { VideoInfo } from "@/types/video"

export interface VideoSegment {
  camera: number
  startTime: number
  duration: number
  bitrate: number
}

export interface RecordEntry {
  camera: number
  startTime: number
  endTime?: number
}

export interface CompilationSettings {
  targetDuration: number
  minSegmentLength: number
  maxSegmentLength: number
}

export function createVideoSegments(
  videos: VideoInfo[],
  mainCamera: number,
  settings: CompilationSettings,
): VideoSegment[] {
  if (!videos.length || !videos[0]?.metadata?.creation_time) return []

  const baseTime = new Date(videos[0].metadata.creation_time).getTime() / 1000
  const segments: VideoSegment[] = []
  let totalDuration = 0

  const allPossibleSegments = getAllPossibleSegments(videos, baseTime, mainCamera)

  // Сортируем сегменты по битрейту
  allPossibleSegments.sort((a, b) => b.bitrate - a.bitrate)

  while (totalDuration < settings.targetDuration && allPossibleSegments.length > 0) {
    const segment = selectRandomSegment(
      allPossibleSegments,
      settings,
      totalDuration,
    )

    segments.push(segment)
    totalDuration += segment.duration
  }

  return segments.sort((a, b) => a.startTime - b.startTime)
}

function getAllPossibleSegments(
  videos: VideoInfo[],
  baseTime: number,
  mainCamera: number,
): VideoSegment[] {
  const segments: VideoSegment[] = []

  videos.forEach((video, videoIndex) => {
    if (!video.bitrate_data || !video.metadata.creation_time) return

    const cameraNumber = videoIndex + 1
    const isCameraMain = cameraNumber === mainCamera

    const videoTime = new Date(video.metadata.creation_time).getTime() / 1000
    const relativeStartTime = videoTime - baseTime

    video.bitrate_data.forEach((point, index) => {
      if (index === 0) return

      const prevPoint = video.bitrate_data[index - 1]
      const duration = point.timestamp - prevPoint.timestamp
      const avgBitrate = (point.bitrate + prevPoint.bitrate) / 2

      segments.push({
        camera: cameraNumber,
        startTime: relativeStartTime + prevPoint.timestamp,
        duration,
        bitrate: isCameraMain ? avgBitrate * 1.2 : avgBitrate,
      })
    })
  })

  return segments
}

function selectRandomSegment(
  segments: VideoSegment[],
  settings: CompilationSettings,
  currentDuration: number,
): VideoSegment {
  const topSegmentsCount = Math.max(1, Math.floor(segments.length * 0.2))
  const randomIndex = Math.floor(Math.random() * topSegmentsCount)
  const selectedSegment = segments[randomIndex]

  const maxPossibleDuration = Math.min(
    settings.maxSegmentLength,
    settings.targetDuration - currentDuration,
  )
  const segmentDuration = Math.random() *
      (maxPossibleDuration - settings.minSegmentLength) +
    settings.minSegmentLength

  segments.splice(randomIndex, 1)

  return {
    ...selectedSegment,
    duration: segmentDuration,
  }
}
