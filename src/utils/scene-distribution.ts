import { BitrateDataPoint } from "@/types/video"

export interface SceneDistributionParams {
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
 * @param numCameras - Количество активных камер
 * @param averageSceneDuration - Средняя длительность сцены в секундах
 * @param cameraChangeFrequency - Частота смены камеры (от 0 до 1)
 * @param bitrateData - Данные о bitrate для каждой камеры
 * @returns Массив сцен с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes(30, 4, 10, 0.5)
 * // Вернет массив сцен для 30-секундного видео из 120 секунд записи с 4 камер
 *
 * const scenesWithCustomSegments = distributeScenes(30, 120, 4, [{ time: 10, bitrate: 1000 }, { time: 20, bitrate: 1500 }])
 * // Вернет массив из 500 сцен для более частого переключения
 */
export function distributeScenes({
  targetDuration,
  numCameras,
  averageSceneDuration,
  cameraChangeFrequency,
  bitrateData,
}: SceneDistributionParams) {
  const scenes: Array<{
    cameraIndex: number
    startTime: number
    duration: number
  }> = []

  let currentTime = 0
  let lastCameraIndex = 0

  while (currentTime < targetDuration) {
    // Вычисляем длительность следующей сцены
    const remainingTime = targetDuration - currentTime
    const maxSceneDuration = Math.min(averageSceneDuration * 1.5, remainingTime)
    const minSceneDuration = Math.min(averageSceneDuration * 0.5, remainingTime)
    const sceneDuration = minSceneDuration + Math.random() * (maxSceneDuration - minSceneDuration)

    // Выбираем следующую камеру
    let nextCameraIndex
    if (Math.random() < cameraChangeFrequency) {
      // Выбираем новую камеру, исключая текущую
      do {
        nextCameraIndex = Math.floor(Math.random() * numCameras)
      } while (nextCameraIndex === lastCameraIndex && numCameras > 1)
    } else {
      nextCameraIndex = lastCameraIndex
    }

    // Добавляем сцену
    scenes.push({
      cameraIndex: nextCameraIndex,
      startTime: currentTime,
      duration: sceneDuration,
    })

    lastCameraIndex = nextCameraIndex
    currentTime += sceneDuration
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
