import { MediaFile } from "@/types/videos"

import { SceneDistributionParams, SceneSegment } from "../types/scene"
import { generateGaussianSceneDurations } from "./generate-scene-durations"

/**
 * Создает распределение сцен для мультикамерного монтажа.
 * Генерирует последовательность сцен с разной длительностью,
 * распределенных по нормальному закону, и назначает каждой сцене камеру
 * с учетом заданных параметров и ограничений.
 *
 * @param params - Параметры распределения сцен
 * @returns Массив сегментов видео с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes({
 *   targetDuration: 300, // 5 минут
 *   numCameras: 4,
 *   averageSceneDuration: 6,
 *   cameraChangeFrequency: 0.5,
 *   mainCamera: 1,
 *   mainCameraProb: 0.6,
 *   timeRange: { min: 1700000000, max: 1700000300 },
 *   videos: videoArray
 * })
 */
export function distributeScenes(params: SceneDistributionParams): SceneSegment[] {
  const scenes: SceneSegment[] = []
  let lastCamera = params.mainCamera

  // Используем tracks для группировки видео
  const videosByCamera = new Map(
    params.tracks.map((track) => [
      track.index,
      track.videos,
    ]),
  )

  // Вспомогательная функция для поиска видео для сегмента
  const findVideoForSegment = (
    camera: number,
    startTime: number,
    endTime: number,
  ): MediaFile | undefined => {
    const videos = videosByCamera.get(camera) || []
    return videos.find((video: MediaFile) => {
      const videoStart = new Date(video.probeData?.format.tags?.creation_time || 0).getTime() / 1000
      const videoEnd = videoStart + (video.probeData?.format.duration || 0)
      return videoStart <= startTime && videoEnd >= endTime
    })
  }

  // Находим общий временной диапазон всех видео
  const timeRanges = params.tracks.map((track) => {
    const trackRanges = track.videos.map((video: MediaFile) => ({
      start: new Date(video.probeData?.format.tags?.creation_time || 0).getTime() / 1000,
      end: new Date(video.probeData?.format.tags?.creation_time || 0).getTime() / 1000 +
        (video.probeData?.format.duration || 0),
    }))
    return {
      camera: track.index,
      min: Math.min(...trackRanges.map((r) => r.start)),
      max: Math.max(...trackRanges.map((r) => r.end)),
    }
  })

  // Берем самый широкий диапазон
  const effectiveTimeRange = {
    min: Math.min(...timeRanges.map((r) => r.min)),
    max: Math.max(...timeRanges.map((r) => r.max)),
  }

  // Проверяем валидность диапазона
  if (effectiveTimeRange.max <= effectiveTimeRange.min) {
    console.error("No common time range found for all cameras")
    return []
  }

  // Масштабируем длительности
  const availableDuration = effectiveTimeRange.max - effectiveTimeRange.min
  if (availableDuration < params.targetDuration) {
    console.warn("Available duration is less than target duration", {
      available: availableDuration,
      target: params.targetDuration,
    })
  }

  // Генерируем базовые сегменты
  let timeSegments = generateGaussianSceneDurations(
    availableDuration,
    params.averageSceneDuration,
  )

  // Масштабируем длительности
  const currentTotalDuration = timeSegments.reduce((sum, segment) => sum + segment.duration, 0)
  const durationScaleFactor = params.targetDuration / currentTotalDuration

  // Распределяем точки начала равномерно в пределах доступного времени
  const segmentCount = timeSegments.length
  const timeStep = availableDuration / (segmentCount + 1)

  const selectedPoints = Array.from({ length: segmentCount }, (_, i) => {
    const basePoint = effectiveTimeRange.min + (i + 1) * timeStep
    const jitter = (Math.random() - 0.5) * timeStep * 0.5 // 50% случайности
    return Math.min(Math.max(basePoint + jitter, effectiveTimeRange.min), effectiveTimeRange.max)
  }).sort((a, b) => a - b)

  // Масштабируем длительности и назначаем точки начала
  timeSegments = timeSegments.map((segment, index) => ({
    duration: Math.min(
      segment.duration * durationScaleFactor,
      effectiveTimeRange.max - selectedPoints[index],
    ),
    startTime: selectedPoints[index],
  }))

  // Распределение камер внутри сегментов
  for (const segment of timeSegments) {
    const numChanges = Math.floor(
      segment.duration / params.averageSceneDuration * params.cameraChangeFrequency,
    )
    const subSegmentDuration = segment.duration / (numChanges + 1)

    for (let i = 0; i <= numChanges; i++) {
      const subSegmentStart = segment.startTime + (i * subSegmentDuration)
      const subSegmentEnd = Math.min(
        subSegmentStart + subSegmentDuration,
        effectiveTimeRange.max,
      )

      if (subSegmentStart >= effectiveTimeRange.max) break

      // Находим доступные камеры для текущего временного отрезка
      const availableCameras = Array.from(videosByCamera.entries())
        .filter(([, videos]) =>
          videos.some((video: MediaFile) => {
            const videoStart =
              new Date(video.probeData?.format.tags?.creation_time || 0).getTime() /
              1000
            const videoEnd = videoStart + (video.probeData?.format.duration || 0)
            return videoStart <= subSegmentStart && videoEnd >= subSegmentEnd
          })
        )
        .map(([camera]) => camera)

      if (availableCameras.length === 0) continue

      // Выбираем камеру с учетом вероятности
      let selectedCamera = params.mainCamera

      // Всегда выбираем камеру, отличную от предыдущей
      const otherCameras = availableCameras.filter((c) => c !== lastCamera)

      if (otherCameras.length > 0) {
        if (Math.random() <= params.mainCameraProb && !otherCameras.includes(params.mainCamera)) {
          selectedCamera = params.mainCamera
        } else {
          selectedCamera = otherCameras[Math.floor(Math.random() * otherCameras.length)]
        }
      }

      const video = findVideoForSegment(selectedCamera, subSegmentStart, subSegmentEnd)
      if (video) {
        scenes.push({
          startTime: subSegmentStart,
          endTime: subSegmentEnd,
          duration: subSegmentEnd - subSegmentStart,
          cameraIndex: selectedCamera,
          videoFile: video.path,
          totalBitrate: video.probeData?.format.bit_rate || 0,
        })
        lastCamera = selectedCamera
      }
    }
  }

  return scenes
}
