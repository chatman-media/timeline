import { Check, Plus, X } from "lucide-react"
import { memo, useEffect, useRef,useState } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { MediaFile } from "@/types/media"

interface AddMediaButtonProps {
  file: MediaFile
  isAdded?: boolean
  size?: number
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void
  onRemoveMedia?: (e: React.MouseEvent, file: MediaFile) => void
}

/**
 * Кнопка для добавления/удаления медиафайла на таймлайн
 *
 * Функционал:
 * - Отображает кнопку добавления медиафайла на таймлайн
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - При наведении на добавленный элемент меняется на кнопку удаления
 * - Темная тема для UI элементов
 * - Плавная анимация при добавлении файла
 * - Задержка перед отображением кнопки удаления после добавления файла
 *
 * @param file - Объект медиафайла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер кнопки (по умолчанию 60)
 * @param onAddMedia - Callback для добавления файла
 * @param onRemoveMedia - Callback для удаления файла (если не указан, используется onAddMedia)
 */
export const AddMediaButton = memo(function AddMediaButton({
  file,
  isAdded,
  size = 60,
  onAddMedia,
  onRemoveMedia,
}: AddMediaButtonProps) {
  const { t } = useTranslation()
  const [isHovering, setIsHovering] = useState(false)
  const [isRecentlyAdded, setIsRecentlyAdded] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevIsAddedRef = useRef(isAdded)

  // Отслеживаем изменение состояния isAdded
  useEffect(() => {
    // Если файл только что был добавлен (isAdded изменился с false на true)
    if (isAdded && !prevIsAddedRef.current) {
      setIsRecentlyAdded(true)

      // Очищаем предыдущий таймер, если он есть
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Через 3 секунды сбрасываем флаг
      timerRef.current = setTimeout(() => {
        setIsRecentlyAdded(false)
        timerRef.current = null
      }, 3000)
    } else if (!isAdded && prevIsAddedRef.current) {
      // Файл был удален (isAdded изменился с true на false)
      setIsRecentlyAdded(false)

      // Очищаем таймер
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    // Обновляем предыдущее значение isAdded
    prevIsAddedRef.current = isAdded

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isAdded, file.name])

  if (!onAddMedia) return null

  // Если функция удаления не передана, используем функцию добавления
  const handleRemove = onRemoveMedia || onAddMedia

  const iconSize = size > 100 ? "h-4 w-4" : "h-3 w-3"

  // Определяем, можно ли показывать кнопку удаления
  // Не показываем кнопку удаления в течение 3 секунд после добавления
  const canShowRemoveButton = !isRecentlyAdded

  return (
    <div
      className={cn(
        "absolute z-10 cursor-pointer rounded-full p-1 text-white transition-all duration-300 dark:hover:text-black",
        size > 100 ? "right-[5px] bottom-1" : "right-1 bottom-0.5",
        isAdded
          ? isRecentlyAdded
            ? "scale-110 bg-[#38dacac3] dark:bg-[#35d1c1]" // Яркий цвет и увеличенный размер для недавно добавленных
            : "bg-[#38dacac3] dark:bg-[#35d1c1]"
          : "bg-[#2f2d38] group-hover:bg-[#35d1c1]/75 hover:bg-[#35d1c1] dark:group-hover:bg-[#35d1c1] dark:hover:bg-[#35d1c1]",
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (isAdded && isHovering && canShowRemoveButton) {
          handleRemove(e, file)
        } else {
          onAddMedia(e, file)
        }
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      title={
        isAdded
          ? isHovering && canShowRemoveButton
            ? t("browser.media.remove")
            : t("browser.media.added")
          : t("browser.media.add")
      }
    >
      {isAdded ? (
        isHovering && canShowRemoveButton ? (
          <X
            className={`${iconSize} text-black/50 transition-transform duration-150 hover:scale-110`}
            strokeWidth={3}
          />
        ) : (
          <Check className={`${iconSize} text-white`} strokeWidth={3} />
        )
      ) : (
        <Plus className={iconSize} strokeWidth={3} />
      )}
    </div>
  )
})
