import { Check, Plus } from "lucide-react"
import { memo } from "react"

import { MediaFile } from "@/types/media"

interface AddMediaButtonProps {
  file: MediaFile
  isAdded?: boolean
  size?: number
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
}

/**
 * Кнопка для добавления медиафайла на таймлайн
 *
 * Функционал:
 * - Отображает кнопку добавления медиафайла на таймлайн
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект медиафайла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер кнопки (по умолчанию 60)
 * @param onAddMedia - Callback для добавления файла
 */
export const AddMediaButton = memo(function AddMediaButton({
  file,
  isAdded,
  size = 60,
  onAddMedia,
}: AddMediaButtonProps) {
  if (!onAddMedia) return null

  const iconSize = size > 100 ? "h-4 w-4" : "h-3 w-3"
  return (
    <div
      className={`absolute ${size > 100 ? "right-[5px] bottom-1" : "right-1 bottom-0.5"} z-10 cursor-pointer rounded-full p-1 text-white dark:hover:text-black ${
        isAdded
          ? "bg-[#38dacac3]/62 dark:bg-[#35d1c1]/62"
          : "bg-[#2f2d38] group-hover:bg-[#35d1c1]/75 hover:bg-[#35d1c1] dark:group-hover:bg-[#35d1c1]/75 dark:hover:bg-[#35d1c1]"
      }`}
      onClick={(e) => {
        e.stopPropagation()
        if (!isAdded) onAddMedia(e, file)
      }}
      title={isAdded ? "Добавлено" : "Добавить"}
    >
      {isAdded ? (
        <Check className={iconSize} strokeWidth={3} />
      ) : (
        <Plus className={iconSize} strokeWidth={3} />
      )}
    </div>
  )
})
