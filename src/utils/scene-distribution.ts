import { BitrateDataPoint } from "@/types/video"

interface SceneDistributionParams {
  targetDuration: number
  totalDuration: number
  numCameras: number
  averageSceneDuration: number
  cameraChangeFrequency: number
  bitrateData?: Array<BitrateDataPoint[]>
}

/**
 * Создает распределение сцен для мультикамерного монтажа
 * @param targetDuration - Желаемая длительность итогового видео в секундах
 * @param videoDuration - Длительность видео в секундах
 * @param numCameras - Количество активных камер
 * @param bitrateData - Данные о bitrate для каждой камеры
 * @returns Массив сцен с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes(30, 120, 4)
 * // Вернет массив сцен для 30-секундного видео из 120 секунд записи с 4 камер
 *
 * const scenesWithCustomSegments = distributeScenes(30, 120, 4, [{ time: 10, bitrate: 1000 }, { time: 20, bitrate: 1500 }])
 * // Вернет массив из 500 сцен для более частого переключения
 */
export function distributeScenes({
  targetDuration,
  numCameras,
  averageSceneDuration,
  // cameraChangeFrequency,
}: SceneDistributionParams): Array<{ cameraIndex: number; startTime: number; duration: number }> {
  const scenes: Array<{ cameraIndex: number; startTime: number; duration: number }> = []
  let remainingDuration = targetDuration
  let currentTime = 0
  let lastCameraIndex = -1

  while (remainingDuration > 0 && numCameras > 0) {
    // Генерируем длительность сцены с вариацией ±30% от средней
    const variance = averageSceneDuration * 0.3
    const minDuration = Math.max(1, averageSceneDuration - variance)
    const maxDuration = Math.min(remainingDuration, averageSceneDuration + variance)
    const segmentDuration = minDuration + Math.random() * (maxDuration - minDuration)

    // Выбираем новую камеру, исключая предыдущую
    let newCameraIndex
    do {
      newCameraIndex = Math.floor(Math.random() * numCameras)
    } while (newCameraIndex === lastCameraIndex && numCameras > 1)

    scenes.push({
      cameraIndex: newCameraIndex,
      startTime: currentTime,
      duration: segmentDuration,
    })

    lastCameraIndex = newCameraIndex
    currentTime += segmentDuration
    remainingDuration -= segmentDuration
  }

  return scenes
}

export function findBitratePeaks(
  bitrateData: Array<{ time: number; bitrate: number }>,
  numPeaks: number,
): number[] {
  // Сортируем по bitrate по убыванию
  const sortedData = [...bitrateData].sort((a, b) => b.bitrate - a.bitrate)

  // Берем топ N пиков, но следим за минимальным расстоянием между ними
  const minDistance = 5 // минимум 5 секунд между пиками
  const peaks: number[] = []

  for (const data of sortedData) {
    if (peaks.length >= numPeaks) break

    // Проверяем, достаточно ли далеко этот пик от уже выбранных
    const isFarEnough = peaks.every(
      (existingPeak) => Math.abs(data.time - existingPeak) >= minDistance,
    )

    if (isFarEnough) {
      peaks.push(data.time)
    }
  }

  // Сортируем пики по времени
  return peaks.sort((a, b) => a - b)
}
