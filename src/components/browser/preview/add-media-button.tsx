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

  return (
    <div
      className={`absolute right-1 bottom-1 text-white rounded-full p-1 cursor-pointer z-10 ${
        isAdded ? "bg-[#38dacac3] dark:bg-[#38dac9]" : "bg-[#38dac9]/50 hover:bg-[#38dac9]"
      }`}
      onClick={(e) => {
        e.stopPropagation()
        if (!isAdded) onAddMedia(e, file)
      }}
      title={isAdded ? "Добавлено" : "Добавить"}
    >
      {isAdded ? (
        <Check className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
      ) : (
        <Plus className={size > 100 ? "w-4 h-4" : "w-3 h-3"} strokeWidth={3} />
      )}
    </div>
  )
})
