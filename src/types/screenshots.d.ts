export interface ScreenshotsConfig {
  count?: number // Количество скриншотов
  folder: string // Папка для сохранения
  filename: string // Шаблон имени файла
  size?: { // Размер миниатюры
    width: number
    height: number
  }
  timestamps?: number[] // Конкретные временные метки (в секундах)
  quality?: number // Качество JPEG (1-31, меньше = лучше)
}
