export interface CompilationSettings {
  targetDuration: number /** Желаемая длительность итогового видео в секундах */
  minSegmentLength: number /** Минимальная длительность сегмента в секундах */
  maxSegmentLength: number /** Максимальная длительность сегмента в секундах */
  averageSceneDuration: number /** Средняя длительность одной сцены в секундах */
  cameraChangeFrequency: number /** Частота смены камеры (от 0 до 1) */
}
