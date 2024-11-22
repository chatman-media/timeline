import { generateGaussianRandom } from "./gaussian-random"

export interface SceneDuration {
  startTime: number
  duration: number
}

/**
 * Генерирует массив сегментов с длительностями, распределенными по нормальному закону
 *
 * @param targetDuration - Общая целевая длительность всех сегментов в секундах
 * @param averageSceneDuration - Средняя желаемая длительность одной сцены в секундах
 * @returns Массив объектов с временем начала и длительностью каждой сцены
 *
 * @example
 * const segments = generateGaussianSceneDurations(300, 6)
 * // Вернет массив сегментов общей длительностью 5 минут (300 секунд)
 * // со средней длительностью сцены около 6 секунд
 * // и разбросом от 2 до 18 секунд
 */
export function generateGaussianSceneDurations(
  targetDuration: number,
  averageSceneDuration: number,
): SceneDuration[] {
  const segments: SceneDuration[] = []
  let currentTime = 0

  // Используем averageSceneDuration как среднее значение
  // и позволяем разброс в 3 раза больше/меньше среднего
  const standardDeviation = averageSceneDuration * 0.5

  while (currentTime < targetDuration) {
    // Генерируем длительность по нормальному распределению
    let duration = generateGaussianRandom(averageSceneDuration, standardDeviation)

    // Ограничиваем длительность в пределах 1/3 до 3x от средней
    duration = Math.max(averageSceneDuration / 3, Math.min(averageSceneDuration * 3, duration))

    segments.push({
      startTime: currentTime,
      duration,
    })

    currentTime += duration
  }

  return segments
}
