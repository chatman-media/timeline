export interface RecordEntry {
  camera: number /** Индекс камеры, начиная с 1 */
  startTime: number /** Время начала записи в секундах (unix timestamp) */
  endTime?: number /** Время окончания записи в секундах (unix timestamp) */
}
