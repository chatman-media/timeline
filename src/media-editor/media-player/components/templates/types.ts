import React from "react"

import { MediaFile } from "@/types/media"

// Общие типы для всех шаблонов
export interface TemplateProps {
  videos: MediaFile[]
  activeVideoId: string | null
  videoRefs?: Record<string, HTMLVideoElement>
  isResizable?: boolean
}

// Тип для точек разделения в диагональных шаблонах
export interface SplitPoint {
  x: number
  y: number
}

// Базовый интерфейс для рендер-функций шаблонов
export interface TemplateRenderFunction {
  (props: TemplateProps): React.ReactNode
}

// Экспорт типов из основного файла шаблонов
export interface VideoStyle {
  top?: string
  left?: string
  width?: string
  height?: string
  clipPath?: string
}

// Тип для обработчиков перетаскивания в диагональных шаблонах
export interface DragHandlers {
  handleMouseDown: (e: React.MouseEvent, pointIndex: number) => void
  splitPoints: SplitPoint[]
}
