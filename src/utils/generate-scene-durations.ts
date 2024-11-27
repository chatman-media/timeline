import { SceneDuration } from "@/types/scene"
import { generateGaussianRandom } from "./gaussian-random"

/**
 * Генерирует массив сегментов с длительностями, распределенными по нормальному закону
 *
 * @param targetDuration - Общая целевая длительность всех сегментов в секундах
 * @param averageSceneDuration - Средняя желаемая длительность одной сцены в секундах
 * @returns Массив объектов с временем начала и длительностью каждой сцены
 *
 * @example
 * const segments = generateGaussianSceneDurations(300, 6)
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

    // Проверяем, не выйдем ли за пределы
    if (currentTime + duration > targetDuration) {
      duration = targetDuration - currentTime
    }

    if (duration <= 0) break

    segments.push({
      startTime: currentTime,
      duration,
    })

    currentTime += duration
  }

  return segments
}
