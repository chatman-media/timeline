/**
 * Генерирует случайное число по нормальному (гауссовому) распределению
 * используя преобразование Бокса-Мюллера.
 *
 * @param mean - Среднее значение распределения
 * @param standardDeviation - Стандартное отклонение распределения
 * @returns Случайное число, соответствующее нормальному распределению
 *
 * @example
 * const random = generateGaussianRandom(10, 2)
 */
export function generateGaussianRandom(mean: number, standardDeviation: number): number {
  let u = 0,
    v = 0
  while (u === 0) u = Math.random() // Конвертируем [0,1) в (0,1)
  while (v === 0) v = Math.random()

  const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + standardDeviation * normal
}
