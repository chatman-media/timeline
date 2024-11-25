// Создадим общий интерфейс в отдельном файле
export interface TimelineSliceType {
  id: string // Используем только string для id
  x: number // Позиция по горизонтали
  y: number // Позиция по вертикали
  width: string | number // Ширина (может быть в процентах или пикселях)
  height: number // Высота в пикселях
}

/**
 * Состояние полосы прокрутки
 */
export interface SeekbarState {
  width: number // Ширина полосы в пикселях
  height: number // Высота полосы в пикселях
  y: number // Вертикальное положение полосы
  x: number // Горизонтальное положение полосы
}
