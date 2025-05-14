import { useCallback } from "react"

import {
  findTemplateContainer,
  takeScreenshot,
} from "@/media-editor/media-player/components/take-screenshot"
import { AppliedTemplate } from "@/media-editor/media-player/services/template-service"
import { MediaFile } from "@/types/media"

interface UseScreenshotProps {
  video: MediaFile | null
  videoRefs: Record<string, HTMLVideoElement>
  screenshotsPath: string
  appliedTemplate: AppliedTemplate | null
}

/**
 * Хук для создания и сохранения скриншотов
 * @param props Объект с параметрами для создания скриншота
 * @returns Функция для создания скриншота
 */
export function useScreenshot({
  video,
  videoRefs,
  screenshotsPath,
  appliedTemplate,
}: UseScreenshotProps) {
  /**
   * Функция для создания и сохранения скриншота
   */
  const handleTakeSnapshot = useCallback(async () => {
    try {
      console.log("[handleTakeSnapshot] Создаем скриншот")

      // Проверяем, используется ли шаблон
      if (appliedTemplate) {
        console.log("[handleTakeSnapshot] Создаем скриншот для шаблона")

        // Находим контейнер с шаблоном
        const templateContainer = findTemplateContainer()
        if (!templateContainer) return

        // Создаем и сохраняем скриншот шаблона
        await takeScreenshot({
          isTemplate: true,
          templateContainer,
          screenshotsPath,
        })
      } else if (video && videoRefs[video.id]) {
        console.log("[handleTakeSnapshot] Создаем скриншот для видео:", video.id)

        // Получаем видеоэлемент
        const videoElement = videoRefs[video.id]

        // Создаем и сохраняем скриншот видео
        await takeScreenshot({
          isTemplate: false,
          videoElement,
          screenshotsPath,
        })
      } else {
        console.log("[handleTakeSnapshot] Нет активного видео или шаблона для скриншота")
      }
    } catch (error) {
      console.error("[handleTakeSnapshot] Ошибка при создании скриншота:", error)
    }
  }, [video, videoRefs, screenshotsPath, appliedTemplate])

  return {
    takeSnapshot: handleTakeSnapshot,
  }
}
