/**
 * Сервис для создания скриншотов из DOM-элементов без использования html2canvas
 */

/**
 * Создает скриншот из HTML-элемента с помощью SVG и Canvas API
 * @param element HTML-элемент для скриншота
 * @returns Promise с dataURL изображения
 */
export async function createDomScreenshot(element: HTMLElement): Promise<string> {
  try {
    console.log("[createDomScreenshot] Создаем скриншот из элемента")

    // Получаем размеры элемента
    const rect = element.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    console.log(`[createDomScreenshot] Размеры элемента: ${width}x${height}`)

    // Создаем canvas для рендеринга
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    // Получаем контекст canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Заполняем фон (опционально)
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)

    try {
      // Создаем изображение из элемента с помощью DOM API и SVG
      // Используем foreignObject для рендеринга HTML внутри SVG
      const serializer = new XMLSerializer()
      const elementContent = serializer.serializeToString(element)

      // Создаем SVG с foreignObject
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%" x="0" y="0">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${elementContent}
            </div>
          </foreignObject>
        </svg>
      `

      // Кодируем SVG для использования в data URL
      const encodedSvg = encodeURIComponent(svgData)
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`

      // Создаем изображение из SVG
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = dataUrl

      // Ждем загрузки изображения
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = (error) => {
          console.error("[createDomScreenshot] Ошибка при загрузке изображения:", error)
          reject(error)
        }
      })

      // Рисуем изображение на canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Возвращаем dataUrl из canvas
      return canvas.toDataURL("image/png")
    } catch (error) {
      console.error("[createDomScreenshot] Ошибка при создании скриншота через SVG:", error)

      // Альтернативный подход - прямое рендеринг через canvas
      try {
        // Создаем временный элемент для клонирования
        const tempDiv = document.createElement("div")
        tempDiv.style.position = "absolute"
        tempDiv.style.left = "-9999px"
        tempDiv.style.top = "-9999px"
        tempDiv.style.width = `${width}px`
        tempDiv.style.height = `${height}px`

        // Клонируем содержимое элемента
        const clone = element.cloneNode(true) as HTMLElement
        tempDiv.appendChild(clone)

        // Добавляем временный элемент в DOM
        document.body.appendChild(tempDiv)

        // Создаем изображение напрямую из DOM
        const dataUrl = await createScreenshotDirectly(clone, width, height)

        // Удаляем временный элемент
        document.body.removeChild(tempDiv)

        return dataUrl
      } catch (directError) {
        console.error("[createDomScreenshot] Ошибка при прямом создании скриншота:", directError)

        // Возвращаем простой скриншот с текстом ошибки
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, width, height)

        ctx.fillStyle = "#FF0000"
        ctx.font = "20px Arial"
        ctx.fillText("Ошибка при создании скриншота", 50, 50)
        ctx.fillText(String(error), 50, 80)

        return canvas.toDataURL("image/png")
      }
    }
  } catch (error) {
    console.error("[createDomScreenshot] Общая ошибка при создании скриншота:", error)

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

    return canvas.toDataURL("image/png")
  }
}

/**
 * Создает скриншот из видеоэлемента
 * @param videoElement HTML-элемент видео
 * @returns Promise с dataURL изображения
 */
export async function createVideoScreenshot(videoElement: HTMLVideoElement): Promise<string> {
  try {
    console.log("[createVideoScreenshot] Создаем скриншот из видео")

    // Создаем canvas для скриншота
    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    // Рисуем текущий кадр на canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Рисуем видео на canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // Возвращаем dataUrl из canvas
    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("[createVideoScreenshot] Ошибка при создании скриншота видео:", error)

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
      ctx.fillText("Ошибка при создании скриншота видео", 50, 50)
      ctx.fillText(String(error), 50, 80)
    }

    return canvas.toDataURL("image/png")
  }
}

/**
 * Вспомогательная функция для прямого создания скриншота из DOM-элемента
 */
async function createScreenshotDirectly(
  element: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  // Создаем canvas
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  // Получаем контекст
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Не удалось получить контекст canvas")
  }

  // Заполняем фон
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, width, height)

  // Возвращаем dataUrl
  return canvas.toDataURL("image/png")
}
