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

  // Получаем общий доступный диапазон времени
  const totalTimeRange = params.timeRange.max - params.timeRange.min

  // Генерируем базовые сегменты с нормальным распределением
  let timeSegments = generateGaussianSceneDurations(
    params.targetDuration,
    params.averageSceneDuration,
  )

  // Масштабируем длительности, сохраняя пропорции между сегментами
  const currentTotalDuration = timeSegments.reduce((sum, segment) => sum + segment.duration, 0)
  const durationScaleFactor = params.targetDuration / currentTotalDuration

  /**
   * Генерируем точки начала сцен в пределах доступного временного диапазона
   * Каждая точка соответствует количеству секунд от начала диапазона
   */
  const availablePoints = Array.from(
    { length: Math.floor(totalTimeRange) },
    (_, i) => params.timeRange.min + i,
  )

  // Случайное распределение точек начала сцен
  const shuffledPoints = availablePoints.sort(() => Math.random() - 0.5)
  const selectedPoints = shuffledPoints
    .slice(0, timeSegments.length)
    .sort((a, b) => a - b)

  // Масштабируем длительности и назначаем точки начала
  timeSegments = timeSegments.map((segment, index) => {
    const scaledDuration = segment.duration * durationScaleFactor
    return {
      duration: scaledDuration,
      startTime: selectedPoints[index],
    }
  })

  // Сортируем и корректируем перекрытия
  timeSegments.sort((a, b) => a.startTime - b.startTime)
  for (let i = 1; i < timeSegments.length; i++) {
    const prevSegment = timeSegments[i - 1]
    const currentSegment = timeSegments[i]

    if (prevSegment.startTime + prevSegment.duration > currentSegment.startTime) {
      currentSegment.startTime = prevSegment.startTime + prevSegment.duration
    }
  }

  // Создаем сцены на основе сегментов
  for (const segment of timeSegments) {
    let selectedCamera = params.mainCamera

    // Определяем, нужно ли менять камеру для текущей сцены
    if (Math.random() < params.cameraChangeFrequency) {
      if (Math.random() > params.mainCameraProb) {
        const availableCameras = Array.from(
          { length: params.numCameras },
          (_, i) => i + 1,
        ).filter((i) => i !== lastCamera)
        selectedCamera = availableCameras[Math.floor(Math.random() * availableCameras.length)]
      }
    }

    // Находим подходящие видео для выбранной камеры
    const cameraVideos = params.videos.filter((video) => {
      const cameraMatch = video.path.match(/camera[_-]?(\d+)/i)
      const videoCamera = cameraMatch ? parseInt(cameraMatch[1]) : 1
      return videoCamera === selectedCamera
    })

    // Ищем видео, которое содержит текущий временной сегмент
    const videoFile = cameraVideos.find((video) => {
      const videoStartTime = new Date(video.metadata.creation_time!).getTime() / 1000
      const videoEndTime = videoStartTime + video.metadata.format.duration
      return segment.startTime >= videoStartTime &&
        (segment.startTime + segment.duration) <= videoEndTime
    })

    /**
     * Добавляем новую сцену в массив, если нашли подходящее видео
     * Сцена должна:
     * 1. Находиться в пределах длительности исходного видео
     * 2. Иметь корректную длительность
     * 3. Соответствовать выбранной камере
     */
    if (videoFile) {
      scenes.push(
        {
          startTime: segment.startTime,
          endTime: segment.startTime + segment.duration,
          duration: segment.duration,
          cameraIndex: selectedCamera,
          videoFile: videoFile.path,
          totalBitrate: videoFile.metadata.format.bit_rate || 0,
        } satisfies SceneSegment,
      )
      lastCamera = selectedCamera
    }
  }

  return scenes
}
