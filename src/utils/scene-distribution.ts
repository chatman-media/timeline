import { generateGaussianSceneDurations } from "./generate-scene-durations"
import { SceneDistributionParams, SceneSegment } from "../types/scene"

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

  // Используем assembledTracks вместо группировки видео
  const videosByCamera = new Map(
    params.assembledTracks.map((track) => [
      track.index,
      track.allVideos,
    ]),
  )

  // Находим диапазоны для каждой камеры
  const cameraRanges = new Map<number, { min: number; max: number }>()
  params.assembledTracks.forEach((track) => {
    const ranges = track.allVideos.map((video) => ({
      start: new Date(video.metadata.creation_time!).getTime() / 1000,
      end: new Date(video.metadata.creation_time!).getTime() / 1000 +
        video.metadata.format.duration,
    }))

    const min = Math.min(...ranges.map((r) => r.start))
    const max = Math.max(...ranges.map((r) => r.end))
    cameraRanges.set(track.index, { min, max })
  })

  console.log("Camera ranges:", Object.fromEntries(cameraRanges))

  // Находим общий диапазон, где есть видео со всех камер
  const effectiveTimeRange = {
    min: Math.max(...Array.from(cameraRanges.values()).map((r) => r.min)),
    max: Math.min(...Array.from(cameraRanges.values()).map((r) => r.max)),
  }

  console.log("Effective time range:", effectiveTimeRange)

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
    Math.min(availableDuration, params.targetDuration),
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
    // Пропускаем сегменты за пределами доступного времени
    if (segment.startTime >= effectiveTimeRange.max) continue

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

      // Если вышли за пределы доступного времени, прекращаем
      if (subSegmentStart >= effectiveTimeRange.max) break

      // Находим доступные камеры для текущего временного отрезка
      const availableCameras = Array.from(videosByCamera.entries())
        .filter(([_, videos]) =>
          videos.some((video) => {
            const videoStart = new Date(video.metadata.creation_time!).getTime() / 1000
            const videoEnd = videoStart + video.metadata.format.duration
            return videoStart <= subSegmentStart && videoEnd >= subSegmentEnd
          })
        )
        .map(([camera]) => camera)
        .filter((camera) => camera !== lastCamera)

      if (availableCameras.length === 0) continue

      let selectedCamera = params.mainCamera
      if (Math.random() < params.cameraChangeFrequency && Math.random() > params.mainCameraProb) {
        selectedCamera = availableCameras[Math.floor(Math.random() * availableCameras.length)]
      }

      const video = findVideoForSegment(selectedCamera, subSegmentStart, subSegmentEnd)
      if (video) {
        scenes.push({
          startTime: subSegmentStart,
          endTime: subSegmentEnd,
          duration: subSegmentEnd - subSegmentStart,
          cameraIndex: selectedCamera,
          videoFile: video.path,
          totalBitrate: video.metadata.format.bit_rate || 0,
        })

        lastCamera = selectedCamera
      }
    }
  }

  return scenes
}

// При выборе видео для сегмента
const findVideoForSegment = (camera: number, startTime: number, endTime: number) => {
  const trackVideos = videosByCamera.get(camera) || []
  return trackVideos.find((video) => {
    const videoStart = new Date(video.metadata.creation_time!).getTime() / 1000
    const videoEnd = videoStart + video.metadata.format.duration
    return videoStart <= startTime && videoEnd >= endTime
  })
}
