import { VideoSegment } from "@/types/video-segment"
import { VideoInfo } from "@/types/video"
import { generateGaussianSceneDurations } from "./generate-scene-durations"

export interface SceneDistributionParams {
  targetDuration: number
  mainCamera: number
  mainCameraProb: number
  numCameras: number
  averageSceneDuration: number
  cameraChangeFrequency: number
  timeRange: { min: number; max: number }
  videos: VideoInfo[]
}

/**
 * Создает распределение сцен для мультикамерного монтажа
 * @param targetDuration - Желаемая длительность итогового видео в секундах
 * @param numCameras - Количество активных камер
 * @param averageSceneDuration - Средняя длительность сцены в секундах
 * @param cameraChangeFrequency - Частота смены камеры (от 0 до 1)
 * @param mainCamera - Индекс главной камеры
 * @param mainCameraProb - Вероятность показа главной камеры (от 0 до 1)
 * @returns Массив сцен с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes(30, 4, 10, 0.5, 0)
 * // Вернет массив сцен для 30-секундного видео из 120 секунд записи с 4 камер
 *
 * const scenesWithCustomSegments = distributeScenes(30, 120, 4, 0.5, 0, 0.6)
 * // Вернет массив из 500 сцен для более частого переключения
 */
export function distributeScenes({
  targetDuration,
  numCameras,
  averageSceneDuration,
  cameraChangeFrequency,
  mainCamera,
  mainCameraProb,
  timeRange,
  videos,
}: SceneDistributionParams): VideoSegment[] {
  const scenes: VideoSegment[] = []
  let lastCamera = mainCamera

  // Получаем общий доступный диапазон времени
  const totalTimeRange = timeRange.max - timeRange.min

  // Генерируем базовые сегменты с нормальным распределением
  let timeSegments = generateGaussianSceneDurations(
    targetDuration,
    averageSceneDuration,
  )

  // Масштабируем длительности, сохраняя пропорции между сегментами
  const currentTotalDuration = timeSegments.reduce((sum, segment) => sum + segment.duration, 0)
  const durationScaleFactor = targetDuration / currentTotalDuration

  // Генерируем случайные точки для распределения сегментов
  const availablePoints = Array.from(
    { length: Math.floor(totalTimeRange) },
    (_, i) => timeRange.min + i,
  )

  // Перемешиваем точки случайным образом
  const shuffledPoints = availablePoints.sort(() => Math.random() - 0.5)

  // Выбираем начальные точки для каждого сегмента
  const selectedPoints = shuffledPoints
    .slice(0, timeSegments.length)
    .sort((a, b) => a - b)

  timeSegments = timeSegments.map((segment, index) => {
    const scaledDuration = segment.duration * durationScaleFactor
    return {
      duration: scaledDuration,
      startTime: selectedPoints[index],
    }
  })

  // Сортируем сегменты по времени начала
  timeSegments.sort((a, b) => a.startTime - b.startTime)

  // Проверяем и корректируем перекрытия
  for (let i = 1; i < timeSegments.length; i++) {
    const prevSegment = timeSegments[i - 1]
    const currentSegment = timeSegments[i]

    if (prevSegment.startTime + prevSegment.duration > currentSegment.startTime) {
      // Если есть перекрытие, сдвигаем текущий сегмент
      currentSegment.startTime = prevSegment.startTime + prevSegment.duration
    }
  }

  // Создаем сцены на основе скорректированных сегментов
  for (const segment of timeSegments) {
    let selectedCamera = mainCamera

    if (Math.random() < cameraChangeFrequency) {
      if (Math.random() > mainCameraProb) {
        const availableCameras = Array.from(
          { length: numCameras },
          (_, i) => i + 1,
        ).filter((i) => i !== lastCamera)
        selectedCamera = availableCameras[Math.floor(Math.random() * availableCameras.length)]
      }
    }

    const cameraVideos = videos.filter((video) => {
      const cameraMatch = video.path.match(/camera[_-]?(\d+)/i)
      const videoCamera = cameraMatch ? parseInt(cameraMatch[1]) : 1
      return videoCamera === selectedCamera
    })

    const videoFile = cameraVideos.find((video) => {
      const videoStartTime = new Date(video.metadata.creation_time!).getTime() / 1000
      const videoEndTime = videoStartTime + video.metadata.format.duration
      return segment.startTime >= videoStartTime &&
        (segment.startTime + segment.duration) <= videoEndTime
    })

    if (videoFile) {
      scenes.push({
        startTime: segment.startTime,
        endTime: segment.startTime + segment.duration,
        duration: segment.duration,
        cameraIndex: selectedCamera,
        videoFile: videoFile.path,
        totalBitrate: videoFile.metadata.format.bit_rate || 0,
      })
      lastCamera = selectedCamera
    }
  }

  return scenes
}
