import { VideoSegment } from "@/types/video-segment"
import { VideoInfo } from "@/types/video"
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

  // Генерируем сегменты времени с нормальным распределением
  const timeSegments = generateGaussianSceneDurations(
    targetDuration,
    averageSceneDuration,
  )

  // Вычисляем общий доступный диапазон времени
  const totalTimeRange = timeRange.max - timeRange.min
  
  // Вычисляем коэффициент масштабирования для распределения по всему диапазону
  const timeScale = totalTimeRange / targetDuration

  for (const segment of timeSegments) {
    // Масштабируем время начала к полному диапазону
    const currentTime = timeRange.min + (segment.startTime * timeScale)
    
    // Определяем камеру для текущей сцены
    let selectedCamera = mainCamera

    // Если пришло время менять камеру (на основе cameraChangeFrequency)
    if (Math.random() < cameraChangeFrequency) {
      if (Math.random() > mainCameraProb) {
        const availableCameras = Array.from({ length: numCameras }, (_, i) => i)
          .filter((i) => i !== lastCamera)
        selectedCamera = availableCameras[Math.floor(Math.random() * availableCameras.length)]
      }
    }

    // Находим подходящее видео для выбранной камеры
    const cameraVideos = videos.filter((video) => {
      const cameraMatch = video.path.match(/camera[_-]?(\d+)/i)
      const videoCamera = cameraMatch ? parseInt(cameraMatch[1]) - 1 : 0
      return videoCamera === selectedCamera
    })

    // Масштабируем длительность к полному диапазону
    const duration = segment.duration * timeScale

    // Находим подходящее видео для текущего времени
    const videoFile = cameraVideos.find((video) => {
      const videoStartTime = new Date(video.metadata.creation_time!).getTime() / 1000
      const videoEndTime = videoStartTime + video.metadata.format.duration
      return currentTime >= videoStartTime && (currentTime + duration) <= videoEndTime
    })

    if (videoFile) {
      scenes.push({
        startTime: currentTime,
        endTime: currentTime + duration,
        duration: duration,
        cameraIndex: selectedCamera,
        videoFile: videoFile.path,
        totalBitrate: videoFile.metadata.format.bit_rate || 0,
      })
      lastCamera = selectedCamera
    }
  }

  return scenes
}

interface TimeSegment {
  startTime: number
  duration: number
}

function generateGaussianSceneDurations(
  totalDuration: number,
  meanDuration: number,
  standardDeviation: number = meanDuration * 0.2,
): TimeSegment[] {
  const segments: TimeSegment[] = []
  let currentTime = 0

  while (currentTime < totalDuration) {
    // Генерируем случайную длительность по нормальному распределению
    let duration = 0
    do {
      const uniform1 = Math.random()
      const uniform2 = Math.random()
      const normalValue = Math.sqrt(-2.0 * Math.log(uniform1)) * Math.cos(2.0 * Math.PI * uniform2)
      duration = meanDuration + standardDeviation * normalValue
    } while (duration < meanDuration * 0.5 || duration > meanDuration * 1.5)

    // Убеждаемся, что не выходим за пределы общей длительности
    if (currentTime + duration > totalDuration) {
      duration = totalDuration - currentTime
    }

    segments.push({
      startTime: currentTime,
      duration,
    })

    currentTime += duration
  }

  return segments
}
