import { useEffect, useState } from "react"

/**
 * Хук для отслеживания изменений полноэкранного режима
 * @returns Объект с состоянием полноэкранного режима и функциями для управления им
 */
export function useFullscreenChange() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      setIsFullscreen(!!isCurrentlyFullscreen)
      console.log(
        `[FullscreenChange] Полноэкранный режим ${isCurrentlyFullscreen ? "включен" : "выключен"}`,
      )
    }

    // Добавляем слушатели для разных браузеров
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      // Удаляем слушатели при размонтировании
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  /**
   * Функция для входа в полноэкранный режим
   * @param element Элемент, который нужно отобразить в полноэкранном режиме
   */
  const enterFullscreen = (element: HTMLElement) => {
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if ((element as any).webkitRequestFullscreen) {
      ;(element as any).webkitRequestFullscreen()
    } else if ((element as any).mozRequestFullScreen) {
      ;(element as any).mozRequestFullScreen()
    } else if ((element as any).msRequestFullscreen) {
      ;(element as any).msRequestFullscreen()
    }
  }

  /**
   * Функция для выхода из полноэкранного режима
   */
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      ;(document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      ;(document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      ;(document as any).msExitFullscreen()
    }
  }

  /**
   * Функция для переключения полноэкранного режима
   * @param element Элемент, который нужно отобразить в полноэкранном режиме
   */
  const toggleFullscreen = (element: HTMLElement) => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen(element)
    }
  }

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
