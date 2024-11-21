import { VideoInfo } from "@/types/video"
import { VideoSegment } from "@/types/video-segment"
import { CompilationSettings } from "@/types/compilation-settings"

export function createVideoSegments(
  videos: VideoInfo[],
  mainCamera: number,
  settings: CompilationSettings,
): VideoSegment[] {
  if (!videos.length || !videos[0]?.metadata?.creation_time) return []

  const baseTime = new Date(videos[0].metadata.creation_time).getTime() / 1000
  const segments: VideoSegment[] = []
  let totalDuration = 0
  let lastUsedCamera: number | undefined

  const allPossibleSegments = getAllPossibleSegments(videos, baseTime, mainCamera)
  allPossibleSegments.sort((a, b) => b.bitrate - a.bitrate)

  while (totalDuration < settings.targetDuration && allPossibleSegments.length > 0) {
    const segment = selectRandomSegment(
      allPossibleSegments,
      settings,
      totalDuration,
      lastUsedCamera,
    )

    segments.push(segment)
    totalDuration += segment.duration
    lastUsedCamera = segment.cameraIndex
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
    if (!video.bitrate_data || !video.metadata?.creation_time) return

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
        cameraIndex: cameraNumber,
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
  lastCamera?: number,
): VideoSegment {
  const availableSegments = segments.filter((seg) =>
    lastCamera === undefined || seg.cameraIndex !== lastCamera
  )

  const topSegmentsCount = Math.max(1, Math.floor(availableSegments.length * 0.2))
  const randomIndex = Math.floor(Math.random() * topSegmentsCount)
  const selectedSegment = availableSegments[randomIndex]

  const maxPossibleDuration = Math.min(
    settings.maxSegmentLength,
    settings.targetDuration - currentDuration,
  )
  const segmentDuration = Math.random() *
      (maxPossibleDuration - settings.minSegmentLength) +
    settings.minSegmentLength

  segments.splice(segments.indexOf(selectedSegment), 1)

  return {
    ...selectedSegment,
    duration: segmentDuration,
  }
}
