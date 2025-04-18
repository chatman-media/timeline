import { memo } from "react"

import { MediaFile } from "@/types/media"

import { AudioPreview } from "./audio-preview"
import { ImagePreview } from "./image-preview"
import { VideoPreview } from "./video-preview"

interface MediaPreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  hideTime?: boolean
  /** Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9] */
  dimensions?: [number, number]
}

/**
 * Предварительный просмотр медиафайла
 *
 * Функционал:
 * - Отображает превью медиафайла в зависимости от его типа
 * - Поддерживает различные размеры и форматы
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект медиафайла
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param hideTime - Флаг для скрытия времени
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const MediaPreview = memo(function MediaPreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  hideTime = false,
  dimensions = [16, 9],
}: MediaPreviewProps) {
  if (file.isVideo) {
    return (
      <VideoPreview
        file={file}
        onAddMedia={onAddMedia}
        isAdded={isAdded}
        size={size}
        showFileName={showFileName}
        hideTime={hideTime}
        dimensions={dimensions}
      />
    )
  }

  if (file.isAudio) {
    return (
      <AudioPreview
        file={file}
        onAddMedia={onAddMedia}
        isAdded={isAdded}
        size={size}
        showFileName={showFileName}
        hideTime={hideTime}
        dimensions={dimensions}
      />
    )
  }

  return (
    <ImagePreview
      file={file}
      onAddMedia={onAddMedia}
      isAdded={isAdded}
      size={size}
      showFileName={showFileName}
      dimensions={dimensions}
    />
  )
})
