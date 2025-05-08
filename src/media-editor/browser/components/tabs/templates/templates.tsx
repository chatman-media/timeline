import { JSX } from "react"
import { landscapeTemplates } from "./landscape-templates"
import { portraitTemplates } from "./portrait-templates"
import { squareTemplates } from "./square-templates"

export interface SplitPoint {
  x: number // Координата X точки разделения (в процентах от 0 до 100)
  y: number // Координата Y точки разделения (в процентах от 0 до 100)
}

export interface MediaTemplate {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "custom"
  screens: number // Количество экранов/секций в шаблоне
  splitPoints?: SplitPoint[] // Координаты точек разделения (для нестандартных разделений)
  splitPosition?: number // Позиция разделения в процентах (от 0 до 100)
  render: () => JSX.Element
}

export const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: landscapeTemplates,
  portrait:  portraitTemplates,
  square: squareTemplates,
}
