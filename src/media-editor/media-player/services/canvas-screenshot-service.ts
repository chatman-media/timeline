/**
 * Сервис для создания высококачественных скриншотов с использованием Canvas API
 */

/**
 * Создает скриншот из видеоэлемента с высоким качеством
 * @param videoElement HTML-элемент видео
 * @returns Promise с dataURL изображения
 */
export async function createVideoScreenshot(videoElement: HTMLVideoElement): Promise<string> {
  try {
    console.log("[createVideoScreenshot] Создаем скриншот из видео")

    // Получаем размеры видео
    const width = videoElement.videoWidth
    const height = videoElement.videoHeight

    console.log(`[createVideoScreenshot] Размеры видео: ${width}x${height}`)

    // Создаем canvas для скриншота
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    // Получаем контекст canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Рисуем видео на canvas с высоким качеством
    ctx.drawImage(videoElement, 0, 0, width, height)

    // Возвращаем dataURL с оптимальным качеством (0.8 - хороший баланс между качеством и размером)
    return canvas.toDataURL("image/jpeg", 0.8)
  } catch (error) {
    console.error("[createVideoScreenshot] Ошибка при создании скриншота видео:", error)
    throw error
  }
}

/**
 * Создает скриншот из DOM-элемента с использованием Canvas API
 * @param element HTML-элемент для скриншота
 * @returns Promise с dataURL изображения
 */
export async function createDOMScreenshot(element: HTMLElement): Promise<string> {
  try {
    console.log("[createDOMScreenshot] Создаем скриншот из DOM-элемента")

    // Получаем размеры элемента
    const rect = element.getBoundingClientRect()
    const width = Math.round(rect.width)
    const height = Math.round(rect.height)

    console.log(`[createDOMScreenshot] Размеры элемента: ${width}x${height}`)

    // Создаем canvas для скриншота
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    // Получаем контекст canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Рисуем фон
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)

    // Находим все дочерние элементы
    const childElements = element.querySelectorAll("*")

    // Обрабатываем каждый элемент
    for (const childElement of childElements) {
      try {
        const childRect = childElement.getBoundingClientRect()
        const x = childRect.left - rect.left
        const y = childRect.top - rect.top
        const childWidth = childRect.width
        const childHeight = childRect.height

        // Пропускаем элементы с нулевыми размерами
        if (childWidth <= 0 || childHeight <= 0) continue

        // Если элемент - видео, рисуем его напрямую
        if (childElement.tagName === "VIDEO") {
          ctx.drawImage(childElement as HTMLVideoElement, x, y, childWidth, childHeight)
        }
        // Если элемент - изображение, рисуем его напрямую
        else if (childElement.tagName === "IMG") {
          ctx.drawImage(childElement as HTMLImageElement, x, y, childWidth, childHeight)
        }
        // Для других элементов рисуем их фон и рамку
        else {
          // Получаем стили элемента
          const computedStyle = window.getComputedStyle(childElement)
          const backgroundColor = computedStyle.backgroundColor

          // Рисуем фон, только если он не прозрачный
          if (
            backgroundColor &&
            backgroundColor !== "transparent" &&
            backgroundColor !== "rgba(0, 0, 0, 0)"
          ) {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(x, y, childWidth, childHeight)
          }

          // Рисуем рамку, если она есть
          const borderWidth = parseInt(computedStyle.borderWidth || "0", 10)
          if (borderWidth > 0) {
            ctx.strokeStyle = computedStyle.borderColor || "#000000"
            ctx.lineWidth = borderWidth
            ctx.strokeRect(x, y, childWidth, childHeight)
          }

          // Если у элемента есть текст и это не контейнер, рисуем его
          if (
            childElement.textContent &&
            !childElement.children.length &&
            childElement.textContent.trim() !== ""
          ) {
            ctx.fillStyle = computedStyle.color || "#000000"
            ctx.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`
            ctx.textBaseline = "top"
            ctx.fillText(
              childElement.textContent,
              x + parseInt(computedStyle.paddingLeft || "0", 10),
              y + parseInt(computedStyle.paddingTop || "0", 10),
            )
          }
        }
      } catch (error) {
        console.error("[createDOMScreenshot] Ошибка при обработке дочернего элемента:", error)
        // Продолжаем с следующим элементом
        continue
      }
    }

    // Возвращаем dataURL с оптимальным качеством (0.8 - хороший баланс между качеством и размером)
    return canvas.toDataURL("image/jpeg", 0.8)
  } catch (error) {
    console.error("[createDOMScreenshot] Ошибка при создании скриншота DOM-элемента:", error)

    // Создаем простой скриншот с сообщением об ошибке
    const canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 600

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, 800, 600)

      ctx.fillStyle = "#FF0000"
      ctx.font = "20px Arial"
      ctx.fillText("Ошибка при создании скриншота", 50, 50)
      ctx.fillText(String(error), 50, 80)
    }

    return canvas.toDataURL("image/jpeg", 0.8)
  }
}

/**
 * Создает скриншот из видео с наложенными элементами (для шаблонов)
 * @param videoElement HTML-элемент видео
 * @param overlayElements Массив элементов для наложения
 * @returns Promise с dataURL изображения
 */
export async function createCompositeScreenshot(
  videoElement: HTMLVideoElement,
  overlayElements: HTMLElement[],
): Promise<string> {
  try {
    console.log("[createCompositeScreenshot] Создаем композитный скриншот")

    // Получаем размеры видео
    const width = videoElement.videoWidth
    const height = videoElement.videoHeight

    console.log(`[createCompositeScreenshot] Размеры видео: ${width}x${height}`)

    // Создаем canvas для скриншота
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    // Получаем контекст canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Рисуем видео на canvas
    ctx.drawImage(videoElement, 0, 0, width, height)

    // Рисуем каждый элемент наложения
    for (const element of overlayElements) {
      try {
        const rect = element.getBoundingClientRect()
        const elementWidth = rect.width
        const elementHeight = rect.height

        // Пропускаем элементы с нулевыми размерами
        if (elementWidth <= 0 || elementHeight <= 0) continue

        // Создаем временный canvas для элемента
        const elementCanvas = document.createElement("canvas")
        elementCanvas.width = elementWidth
        elementCanvas.height = elementHeight

        // Получаем контекст временного canvas
        const elementCtx = elementCanvas.getContext("2d")
        if (!elementCtx) continue

        // Если элемент - видео, рисуем его напрямую
        if (element.tagName === "VIDEO") {
          elementCtx.drawImage(element as HTMLVideoElement, 0, 0, elementWidth, elementHeight)
        }
        // Если элемент - изображение, рисуем его напрямую
        else if (element.tagName === "IMG") {
          elementCtx.drawImage(element as HTMLImageElement, 0, 0, elementWidth, elementHeight)
        }
        // Для других элементов просто рисуем цветной прямоугольник
        else {
          // Получаем цвет фона элемента
          const computedStyle = window.getComputedStyle(element)
          const backgroundColor = computedStyle.backgroundColor || "#FFFFFF"
          const borderColor = computedStyle.borderColor || "#000000"
          const borderWidth = parseInt(computedStyle.borderWidth || "0", 10)

          // Рисуем фон
          elementCtx.fillStyle = backgroundColor
          elementCtx.fillRect(0, 0, elementWidth, elementHeight)

          // Рисуем рамку, если она есть
          if (borderWidth > 0) {
            elementCtx.strokeStyle = borderColor
            elementCtx.lineWidth = borderWidth
            elementCtx.strokeRect(0, 0, elementWidth, elementHeight)
          }

          // Если у элемента есть текст, рисуем его
          if (element.textContent) {
            elementCtx.fillStyle = computedStyle.color || "#000000"
            elementCtx.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`
            elementCtx.textAlign = "center"
            elementCtx.textBaseline = "middle"
            elementCtx.fillText(element.textContent, elementWidth / 2, elementHeight / 2)
          }
        }

        // Рисуем временный canvas на основной canvas
        ctx.drawImage(elementCanvas, rect.left, rect.top, elementWidth, elementHeight)
      } catch (error) {
        console.error("[createCompositeScreenshot] Ошибка при обработке элемента:", error)
        // Продолжаем с следующим элементом
        continue
      }
    }

    // Возвращаем dataURL с оптимальным качеством (0.8 - хороший баланс между качеством и размером)
    return canvas.toDataURL("image/jpeg", 0.8)
  } catch (error) {
    console.error("[createCompositeScreenshot] Ошибка при создании композитного скриншота:", error)
    throw error
  }
}
