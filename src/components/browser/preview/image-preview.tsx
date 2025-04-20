import { Image } from "lucide-react"
import { memo } from "react"

import { MediaFile } from "@/types/media"

import { AddMediaButton } from "./add-media-button"

interface ImagePreviewProps {
  file: MediaFile
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  isAdded?: boolean
  size?: number
  showFileName?: boolean
  dimensions?: [number, number]
}

/**
 * Предварительный просмотр изображения
 *
 * Функционал:
 * - Отображает превью изображения с поддержкой ленивой загрузки
 * - Автоматически определяет и показывает разрешение изображения после загрузки
 * - Настраиваемое соотношение сторон контейнера (по умолчанию 16:9)
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const ImagePreview = memo(function ImagePreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  dimensions = [16, 9],
}: ImagePreviewProps) {
  const calculateWidth = (): number => {
    const [width, height] = dimensions
    return (size * width) / height
  }

  return (
    <div
      className={`h-full flex-shrink-0 relative`}
      style={{ height: `${size}px`, width: `${calculateWidth().toFixed(0)}px` }}
    >
      {showFileName && (
        <div
          className={`absolute font-medium top-0.5 left-0.5 ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} text-xs bg-black/50 text-white rounded-xs leading-[16px] line-clamp-1 max-w-[calc(60%)]`}
          style={{
            fontSize: size > 100 ? "13px" : "11px",
          }}
        >
          {file.name}
        </div>
      )}

      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <img src={file.path} alt={file.name} className="w-full h-full object-contain" />
      </div>

      <div
        className={`absolute ${size > 100 ? "left-1 bottom-1" : "left-0.5 bottom-0.5"} text-white cursor-pointer bg-black/50 rounded p-0.5`}
      >
        <Image size={size > 100 ? 16 : 12} />
      </div>

      {onAddMedia && (
        <AddMediaButton file={file} onAddMedia={onAddMedia} isAdded={isAdded} size={size} />
      )}
    </div>
  )
})
