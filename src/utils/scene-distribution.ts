interface Scene {
  cameraIndex: number
  startTime: number
  duration: number
}

/**
 * Создает распределение сцен для мультикамерного монтажа
 * @param totalRecordingDuration - Общая длительность записи в секундах
 * @param targetDuration - Желаемая длительность итогового видео в секундах
 * @param numberOfCameras - Количество активных камер
 * @param numberOfSegments - Желаемое количество сегментов (по умолчанию 300 сегментов на минуту)
 * @returns Массив сцен с указанием камеры, времени начала и длительности
 *
 * @example
 * const scenes = distributeScenes(120, 30, 4)
 * // Вернет массив сцен для 30-секундного видео из 120 секунд записи с 4 камер
 *
 * const scenesWithCustomSegments = distributeScenes(120, 30, 4, 500)
 * // Вернет массив из 500 сцен для более частого переключения
 */
export function distributeScenes(
  totalRecordingDuration: number,
  targetDuration: number,
  numberOfCameras: number,
  numberOfSegments: number = Math.floor(targetDuration * 5), // 300 сегментов на минуту
): Scene[] {
  const minSceneDuration = 0.1 // минимальная длина сцены 0.1 секунды
  const maxSceneDuration = 1 // максимальная длина сцены 1 секунда

  const scenes: Scene[] = []
  let currentTime = 0

  for (let i = 0; i < numberOfSegments; i++) {
    const cameraIndex = Math.floor(Math.random() * numberOfCameras)

    const remainingTime = targetDuration - currentTime
    const maxPossibleDuration = Math.min(maxSceneDuration, remainingTime / (numberOfSegments - i))

    const duration = Math.max(
      minSceneDuration,
      Math.min(
        maxPossibleDuration,
        minSceneDuration + Math.random() * (maxPossibleDuration - minSceneDuration),
      ),
    )

    const segmentLength = totalRecordingDuration / numberOfSegments
    const startTime = i * segmentLength + (Math.random() * (segmentLength - duration))

    scenes.push({
      cameraIndex,
      startTime,
      duration,
    })

    currentTime += duration
  }

  return scenes
}
