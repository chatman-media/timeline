/**
 * Сервис для создания скриншотов с использованием API захвата экрана
 */

/**
 * Создает скриншот с использованием navigator.mediaDevices.getDisplayMedia()
 * @returns Promise с dataURL изображения
 */
export async function captureScreenshot(): Promise<string> {
  try {
    console.log("[captureScreenshot] Запрашиваем доступ к экрану")

    // Проверяем поддержку API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("API захвата экрана не поддерживается в этом браузере")
    }

    // Запрашиваем доступ к экрану
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        displaySurface: "window",
      },
      audio: false,
    })

    console.log("[captureScreenshot] Доступ к экрану получен")

    // Создаем видеоэлемент для захвата кадра
    const videoElement = document.createElement("video")
    videoElement.srcObject = mediaStream

    // Ждем, пока видео будет готово к воспроизведению
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
        resolve()
      }
    })

    // Даем немного времени для отображения видео
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Создаем canvas для скриншота
    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    // Получаем контекст canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Рисуем видео на canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // Останавливаем все треки медиапотока
    mediaStream.getTracks().forEach((track) => track.stop())

    console.log("[captureScreenshot] Скриншот создан успешно")

    // Возвращаем dataURL с максимальным качеством
    return canvas.toDataURL("image/png", 1.0)
  } catch (error) {
    console.error("[captureScreenshot] Ошибка при создании скриншота:", error)
    throw error
  }
}

/**
 * Создает скриншот определенного элемента с использованием navigator.mediaDevices.getDisplayMedia()
 * @param element HTML-элемент для скриншота
 * @returns Promise с dataURL изображения
 */
export async function captureElementScreenshot(element: HTMLElement): Promise<string> {
  try {
    console.log("[captureElementScreenshot] Подготовка к захвату элемента")

    // Проверяем поддержку API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("API захвата экрана не поддерживается в этом браузере")
    }

    // Добавляем временный класс для выделения элемента
    const tempClass = `capture-highlight-${Date.now()}`
    element.classList.add(tempClass)

    // Добавляем стиль для выделения элемента
    const style = document.createElement("style")
    style.textContent = `.${tempClass} { outline: 3px solid #00CCC0 !important; }`
    document.head.appendChild(style)

    // Прокручиваем к элементу, если он не виден
    element.scrollIntoView({ behavior: "smooth", block: "center" })

    // Даем пользователю инструкции
    alert(
      "Пожалуйста, выберите область с выделенным элементом (с синей рамкой) для создания скриншота",
    )

    // Запрашиваем доступ к экрану
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        displaySurface: "window",
      },
      audio: false,
    })

    console.log("[captureElementScreenshot] Доступ к экрану получен")

    // Удаляем временный класс и стиль
    element.classList.remove(tempClass)
    document.head.removeChild(style)

    // Создаем видеоэлемент для захвата кадра
    const videoElement = document.createElement("video")
    videoElement.srcObject = mediaStream

    // Ждем, пока видео будет готово к воспроизведению
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
        resolve()
      }
    })

    // Даем немного времени для отображения видео
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Создаем canvas для скриншота
    const canvas = document.createElement("canvas")
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    // Получаем контекст canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Не удалось получить контекст canvas")
    }

    // Рисуем видео на canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // Останавливаем все треки медиапотока
    mediaStream.getTracks().forEach((track) => track.stop())

    console.log("[captureElementScreenshot] Скриншот создан успешно")

    // Возвращаем dataURL с максимальным качеством
    return canvas.toDataURL("image/png", 1.0)
  } catch (error) {
    console.error("[captureElementScreenshot] Ошибка при создании скриншота:", error)
    throw error
  }
}
