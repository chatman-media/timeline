import { MediaTemplate } from "@/media-editor/browser/components/tabs/templates/templates"
import { MediaFile } from "@/types/media"

// Интерфейс для хранения информации о применяемом шаблоне
export interface AppliedTemplate {
  template: MediaTemplate | null
  videos: MediaFile[] // Видео, к которым применен шаблон
}

// Интерфейс для хранения стилей видео в шаблоне
export interface VideoTemplateStyle {
  position: "absolute" | "relative" | "fixed" | "sticky"
  top?: string
  left?: string
  right?: string
  bottom?: string
  width?: string
  height?: string
  clipPath?: string
  zIndex?: number
  transform?: string
  display?: "block" | "none"
}

/**
 * Получает стили для видео в зависимости от шаблона и индекса видео
 * @param template Шаблон
 * @param videoIndex Индекс видео в массиве
 * @param totalVideos Общее количество видео
 * @returns Объект со стилями для видео
 */
export function getVideoStyleForTemplate(
  template: MediaTemplate,
  videoIndex: number,
  totalVideos: number,
): VideoTemplateStyle {
  // Базовый стиль для всех видео
  const baseStyle: VideoTemplateStyle = {
    position: "absolute",
  }

  // Если шаблон не указан, возвращаем базовый стиль
  if (!template) {
    return {
      ...baseStyle,
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    }
  }

  // Если индекс видео больше, чем количество экранов в шаблоне,
  // скрываем видео
  if (videoIndex >= template.screens) {
    return {
      ...baseStyle,
      width: "0",
      height: "0",
      top: "0",
      left: "0",
      display: "none",
    }
  }

  // Если количество видео меньше, чем количество экранов в шаблоне,
  // адаптируем шаблон к доступным видео
  if (totalVideos < template.screens) {
    // Для шаблонов с сеткой, адаптируем размеры ячеек
    if (
      template.split === "custom" &&
      (template.screens === 4 || template.screens === 9 || template.screens === 16)
    ) {
      // Для сетки 2x2 (4 экрана) с 2 видео - размещаем их сверху
      if (template.screens === 4 && totalVideos === 2) {
        const col = videoIndex % 2
        return {
          ...baseStyle,
          top: "0",
          left: `${col * 50}%`,
          width: "50%",
          height: "100%",
        }
      }

      // Для сетки 3x3 (9 экранов) с 2-3 видео - размещаем их сверху
      if (template.screens === 9 && (totalVideos === 2 || totalVideos === 3)) {
        const col = videoIndex % 3
        return {
          ...baseStyle,
          top: "0",
          left: `${col * 33.33}%`,
          width: "33.33%",
          height: "100%",
        }
      }
    }
  }

  // Проверяем наличие настраиваемых пропорций
  const hasProportions =
    template.proportions &&
    Array.isArray(template.proportions) &&
    template.proportions.length >= Math.min(template.screens, totalVideos)

  // В зависимости от типа разделения шаблона, возвращаем соответствующие стили
  if (template.split === "vertical") {
    // Вертикальное разделение (колонки)
    if (hasProportions && !Array.isArray(template.proportions![0])) {
      // Используем настраиваемые пропорции
      const proportions = template.proportions as number[]

      // Вычисляем позицию на основе пропорций
      let leftPosition = 0
      for (let i = 0; i < videoIndex; i++) {
        leftPosition += proportions[i]
      }

      return {
        ...baseStyle,
        top: "0",
        left: `${leftPosition}%`,
        width: `${proportions[videoIndex]}%`,
        height: "100%",
      }
    } else {
      // Используем равномерное разделение
      const widthPercent = 100 / Math.min(template.screens, totalVideos)
      return {
        ...baseStyle,
        top: "0",
        left: `${videoIndex * widthPercent}%`,
        width: `${widthPercent}%`,
        height: "100%",
      }
    }
  } else if (template.split === "horizontal") {
    // Горизонтальное разделение (строки)
    if (hasProportions && !Array.isArray(template.proportions![0])) {
      // Используем настраиваемые пропорции
      const proportions = template.proportions as number[]

      // Вычисляем позицию на основе пропорций
      let topPosition = 0
      for (let i = 0; i < videoIndex; i++) {
        topPosition += proportions[i]
      }

      return {
        ...baseStyle,
        top: `${topPosition}%`,
        left: "0",
        width: "100%",
        height: `${proportions[videoIndex]}%`,
      }
    } else {
      // Используем равномерное разделение
      const heightPercent = 100 / Math.min(template.screens, totalVideos)
      return {
        ...baseStyle,
        top: `${videoIndex * heightPercent}%`,
        left: "0",
        width: "100%",
        height: `${heightPercent}%`,
      }
    }
  } else if (template.split === "diagonal") {
    // Диагональное разделение
    if (template.screens === 2) {
      // Для 2 экранов
      const splitPosition = template.splitPosition || 50
      if (videoIndex === 0) {
        // Первое видео (левая или верхняя часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition - 10}% 100%, 0 100%)`,
          zIndex: 1,
        }
      } else {
        // Второе видео (правая или нижняя часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition - 10}% 100%)`,
          zIndex: 2,
        }
      }
    } else if (template.screens === 3) {
      // Для 3 экранов (треугольное разделение)
      if (videoIndex === 0) {
        // Первое видео (верхняя часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 100% 0, 50% 50%)",
          zIndex: 1,
        }
      } else if (videoIndex === 1) {
        // Второе видео (нижняя левая часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 50% 50%, 0 100%)",
          zIndex: 2,
        }
      } else {
        // Третье видео (нижняя правая часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(50% 50%, 100% 0, 100% 100%)",
          zIndex: 3,
        }
      }
    }
  } else if (template.split === "custom") {
    // Для сетки 2x2 (4 экрана)
    if (template.screens === 4) {
      // Проверяем наличие настраиваемых пропорций для сетки
      if (hasProportions && Array.isArray(template.proportions![0])) {
        // Используем настраиваемые пропорции для сетки
        const rowProportions = template.proportions![0] as number[]
        const colProportions = template.proportions![1] as number[]

        const row = Math.floor(videoIndex / 2)
        const col = videoIndex % 2

        // Вычисляем позиции на основе пропорций
        let topPosition = 0
        for (let i = 0; i < row; i++) {
          topPosition += rowProportions[i]
        }

        let leftPosition = 0
        for (let i = 0; i < col; i++) {
          leftPosition += colProportions[i]
        }

        return {
          ...baseStyle,
          top: `${topPosition}%`,
          left: `${leftPosition}%`,
          width: `${colProportions[col]}%`,
          height: `${rowProportions[row]}%`,
        }
      } else {
        // Используем равномерное разделение
        const row = Math.floor(videoIndex / 2)
        const col = videoIndex % 2
        return {
          ...baseStyle,
          top: `${row * 50}%`,
          left: `${col * 50}%`,
          width: "50%",
          height: "50%",
        }
      }
    }
    // Для сетки 3x3 (9 экранов)
    else if (template.screens === 9) {
      const row = Math.floor(videoIndex / 3)
      const col = videoIndex % 3
      return {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "33.33%",
      }
    }
    // Для сетки 4x4 (16 экранов)
    else if (template.screens === 16) {
      const row = Math.floor(videoIndex / 4)
      const col = videoIndex % 4
      return {
        ...baseStyle,
        top: `${row * 25}%`,
        left: `${col * 25}%`,
        width: "25%",
        height: "25%",
      }
    }
  } else if (template.split === "resizable") {
    // Для настраиваемых шаблонов с возможностью изменения размеров
    // Здесь мы не задаем стили, так как они будут определены компонентом ResizableTemplate
    return {
      ...baseStyle,
      position: "relative", // Для ResizableTemplate используем relative
      width: "100%",
      height: "100%",
    }
  }

  // Если не удалось определить стиль, возвращаем базовый стиль
  return {
    ...baseStyle,
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
  }
}
