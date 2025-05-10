import { JSX } from "react"

import { landscapeTemplates } from "./landscape-templates"
import { portraitTemplates } from "./portrait-templates"
import { squareTemplates } from "./square-templates"

export interface SplitPoint {
  x: number // Координата X точки разделения (в процентах от 0 до 100)
  y: number // Координата Y точки разделения (в процентах от 0 до 100)
}

// Интерфейс для настройки ячейки шаблона
export interface CellConfig {
  fitMode?: "contain" | "cover" | "fill" // Режим масштабирования видео в ячейке
  alignX?: "left" | "center" | "right" // Горизонтальное выравнивание
  alignY?: "top" | "center" | "bottom" // Вертикальное выравнивание
  initialScale?: number // Начальный масштаб (1.0 = 100%)
  initialPosition?: { x: number, y: number } // Начальная позиция (в процентах от размера ячейки)
}

export interface MediaTemplate {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "custom" | "resizable"
  resizable?: boolean // Флаг, указывающий, что шаблон поддерживает изменение размеров
  screens: number // Количество экранов/секций в шаблоне
  splitPoints?: SplitPoint[] // Координаты точек разделения (для нестандартных разделений)
  splitPosition?: number // Позиция разделения в процентах (от 0 до 100)
  cellConfig?: CellConfig | CellConfig[] // Настройки для ячеек шаблона (общие или для каждой ячейки)
  render: () => JSX.Element
}

export const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: landscapeTemplates,
  portrait: portraitTemplates,
  square: squareTemplates,
}
