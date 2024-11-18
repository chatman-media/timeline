interface VideoSegment {
  cameraIndex: number
  startTime: number
  duration: number
  bitrate?: number
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
export function distributeScenes(
  targetDuration: number,
  totalDuration: number,
  numCameras: number,
  bitrateData?: Array<{ time: number; bitrate: number }>[],
): Array<{ cameraIndex: number; startTime: number; duration: number }> {
  // Убедимся, что у нас есть положительные значения
  if (targetDuration <= 0 || totalDuration <= 0 || numCameras <= 0) {
    console.error("Invalid input parameters:", { targetDuration, totalDuration, numCameras })
    return []
  }

  // Количество сегментов на камеру (минимум 1)
  const segmentsPerCamera = Math.max(1, Math.floor(targetDuration / numCameras))

  // Длительность каждого сегмента
  const segmentDuration = targetDuration / (numCameras * segmentsPerCamera)

  const segments: Array<{ cameraIndex: number; startTime: number; duration: number }> = []

  // Распределяем сегменты по камерам
  for (let cameraIndex = 0; cameraIndex < numCameras; cameraIndex++) {
    // Равномерно распределяем сегменты по всей длительности
    for (let i = 0; i < segmentsPerCamera; i++) {
      const startTime = (totalDuration / (segmentsPerCamera + 1)) * (i + 1)

      segments.push({
        cameraIndex,
        startTime,
        duration: segmentDuration,
      })
    }
  }

  // Сортируем сегменты по времени
  return segments.sort((a, b) => a.startTime - b.startTime)
}

function findBitratePeaks(
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
