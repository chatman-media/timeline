/**
 * Функция для создания и сохранения скриншотов
 */
import {
  createCompositeScreenshot,
  createDOMScreenshot,
  createVideoScreenshot,
} from "../services/canvas-screenshot-service"

/**
 * Создает и сохраняет скриншот из шаблона или видео
 * @param options Параметры для создания скриншота
 * @returns Promise<void>
 */
export async function takeScreenshot(options: {
  isTemplate: boolean
  templateContainer?: HTMLElement | null
  videoElement?: HTMLVideoElement | null
  screenshotsPath: string
}): Promise<void> {
  const { isTemplate, templateContainer, videoElement, screenshotsPath } = options

  try {
    let dataUrl: string | null = null

    // Создаем скриншот в зависимости от типа (шаблон или видео)
    if (isTemplate) {
      console.log("[takeScreenshot] Создаем скриншот для шаблона")

      // Для шаблонов пробуем использовать композитный скриншот
      try {
        // Находим все элементы шаблона
        const { videoElement: templateVideo, overlayElements } = findTemplateElements()

        if (templateVideo && overlayElements.length > 0) {
          console.log("[takeScreenshot] Создаем композитный скриншот с видео и наложениями")
          dataUrl = await createCompositeScreenshot(templateVideo, overlayElements)
        } else if (templateContainer) {
          // Если не удалось найти элементы для композитного скриншота, используем обычный подход
          console.log("[takeScreenshot] Создаем обычный скриншот из DOM-элемента")
          dataUrl = await createDOMScreenshot(templateContainer)
        } else {
          throw new Error("Не найден контейнер шаблона")
        }
      } catch (error) {
        console.error("[takeScreenshot] Ошибка при создании композитного скриншота:", error)

        // Если не удалось создать композитный скриншот, используем обычный подход
        if (templateContainer) {
          console.log("[takeScreenshot] Пробуем создать обычный скриншот из DOM-элемента")
          dataUrl = await createDOMScreenshot(templateContainer)
        } else {
          console.error("[takeScreenshot] Не указан элемент для скриншота")
          return
        }
      }
    } else if (!isTemplate && videoElement) {
      console.log("[takeScreenshot] Создаем скриншот для видео")
      dataUrl = await createVideoScreenshot(videoElement)
    } else {
      console.error("[takeScreenshot] Не указан элемент для скриншота")
      return
    }

    if (!dataUrl) {
      console.error("[takeScreenshot] Не удалось создать скриншот")
      return
    }

    console.log("[takeScreenshot] Скриншот создан успешно")

    // Создаем имя файла с текущей датой и временем
    const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "")
    const prefix = isTemplate ? "template" : "video"
    const filename = `screenshot_${prefix}_${timestamp}.jpg`

    // Используем более простой подход - отправляем данные напрямую
    // Удаляем префикс data:image/jpeg;base64, из dataUrl
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "")

    // Создаем объект с данными для отправки
    const requestData = {
      imageData: base64Data,
      fileName: filename,
      screenshotsPath: screenshotsPath,
    }

    // Отправляем скриншот на сервер
    try {
      console.log(
        `[takeScreenshot] Отправляем скриншот на сервер, размер данных: ${base64Data.length} символов`,
      )

      // Используем относительный путь, чтобы работало на любом порту
      const response = await fetch("/api/save-screenshot-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log(`[takeScreenshot] Получен ответ от сервера, статус: ${response.status}`)

      // Проверяем статус ответа
      if (!response.ok) {
        // Пробуем получить текст ошибки
        const errorText = await response.text()
        console.error(`[takeScreenshot] Ошибка сервера (${response.status}):`, errorText)
        return
      }

      // Парсим JSON только если ответ успешный
      const result = await response.json()

      if (result.success) {
        console.log(
          `[takeScreenshot] Скриншот сохранен: ${result.fileName} в папку ${result.fullPath}`,
        )
      } else {
        console.error(`[takeScreenshot] Ошибка при сохранении скриншота:`, result.error)
      }
    } catch (error) {
      console.error(`[takeScreenshot] Ошибка при отправке скриншота на сервер:`, error)
    }
  } catch (error) {
    console.error("[takeScreenshot] Ошибка при создании скриншота:", error)
  }
}

/**
 * Находит контейнер с шаблоном в DOM
 * @returns HTMLElement | null
 */
export function findTemplateContainer(): HTMLElement | null {
  // Пробуем найти контейнер с шаблоном - пробуем разные селекторы
  let templateContainer = document.querySelector(".aspect-ratio") as HTMLElement

  if (!templateContainer) {
    // Пробуем найти контейнер по другим селекторам
    templateContainer = document.querySelector(".relative.h-full.w-full") as HTMLElement
  }

  if (!templateContainer) {
    // Пробуем найти контейнер по другим селекторам
    templateContainer = document.querySelector(".h-full.w-full") as HTMLElement
  }

  if (!templateContainer) {
    console.error("[findTemplateContainer] Не удалось найти контейнер с шаблоном")
    return null
  }

  console.log("[findTemplateContainer] Найден контейнер с шаблоном:", templateContainer)
  return templateContainer
}

/**
 * Находит все элементы шаблона для создания композитного скриншота
 * @returns {Object} Объект с видеоэлементом и массивом элементов наложения
 */
export function findTemplateElements(): {
  videoElement: HTMLVideoElement | null
  overlayElements: HTMLElement[]
  } {
  // Ищем видеоэлемент
  const videoElement = document.querySelector("video") as HTMLVideoElement

  // Ищем элементы наложения
  const overlayElements: HTMLElement[] = []

  // Ищем контейнер с шаблоном
  const templateContainer = findTemplateContainer()

  if (templateContainer) {
    // Ищем все элементы внутри контейнера, которые не являются видео
    const elements = templateContainer.querySelectorAll("*:not(video)") as NodeListOf<HTMLElement>

    elements.forEach((element) => {
      // Проверяем, что элемент видим и имеет размеры
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        overlayElements.push(element)
      }
    })
  }

  console.log("[findTemplateElements] Найдено элементов наложения:", overlayElements.length)

  return {
    videoElement,
    overlayElements,
  }
}
