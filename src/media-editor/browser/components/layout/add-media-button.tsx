import { Check, Plus, X } from "lucide-react"
import { memo, useEffect, useRef, useState } from "react"
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

  // Обновляем состояние при изменении isAdded
  useEffect(() => {
    // Обновляем состояние при изменении isAdded
    if (isAdded !== prevIsAddedRef.current) {
      // Отключаем логирование для уменьшения количества сообщений
      // console.log(`Файл ${file.name} ${isAdded ? "добавлен" : "удален"}, обновляем состояние`)

      // Если файл добавлен, устанавливаем флаг isRecentlyAdded
      if (isAdded) {
        setIsRecentlyAdded(true)

        // Очищаем предыдущий таймер, если он есть
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        // Через 3 секунды сбрасываем флаг
        timerRef.current = setTimeout(() => {
          setIsRecentlyAdded(false)
          timerRef.current = null
        }, 1500)
      } else {
        // Если файл удален, сбрасываем флаг isRecentlyAdded
        setIsRecentlyAdded(false)

        // Очищаем таймер
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }

      // Обновляем предыдущее значение isAdded
      prevIsAddedRef.current = isAdded
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isAdded, file.name])

  // Принудительно обновляем состояние при монтировании компонента
  useEffect(() => {
    // Если файл уже добавлен при монтировании компонента
    if (isAdded) {
      // Полностью отключаем логирование
      setIsRecentlyAdded(true)
      prevIsAddedRef.current = true

      // Через 3 секунды сбрасываем флаг
      const timer = setTimeout(() => {
        setIsRecentlyAdded(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!onAddMedia) return null

  // Если функция удаления не передана, используем функцию добавления
  const handleRemove = onRemoveMedia || onAddMedia

  const iconSize = size > 100 ? "h-3.5 w-3.5" : "h-2.5 w-2.5"

  // Определяем, можно ли показывать кнопку удаления
  // Не показываем кнопку удаления в течение 3 секунд после добавления
  const canShowRemoveButton = !isRecentlyAdded

  return (
    <div
      className={cn(
        "absolute z-10 cursor-pointer rounded-full p-1 text-white transition-all duration-150 dark:hover:text-black/50",
        size > 100 ? "right-[5px] bottom-1" : "right-1 bottom-0.5",
        isAdded
          ? isRecentlyAdded
            ? "visible scale-110 bg-[#38dacac3] dark:bg-[#35d1c1]" // Яркий цвет и увеличенный размер для недавно добавленных
            : "visible bg-[#38dacac3] dark:bg-[#35d1c1]" // Добавлен класс visible
          : "invisible bg-[#38dacac3] group-hover:visible group-hover:bg-[#35d1c1]/75 hover:bg-[#35d1c1] dark:group-hover:bg-[#35d1c1] dark:hover:bg-[#35d1c1]", // Скрыта по умолчанию, видима при наведении
      )}
      onClick={(e) => {
        e.stopPropagation()
        // Предотвращаем двойные клики
        e.preventDefault()

        if (isAdded && isHovering && canShowRemoveButton) {
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(`Удаляем файл ${file.name}`)
          handleRemove(e, file)
        } else if (!isAdded) {
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(`Добавляем файл ${file.name}`)
          onAddMedia(e, file)
          // Немедленно обновляем визуальное состояние
          setIsRecentlyAdded(true)
        } else {
          // Отключаем логирование для уменьшения количества сообщений
          // console.log(`Файл ${file.name} уже добавлен, но не в режиме удаления`)
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
          <X className={`${iconSize} text-black/50`} strokeWidth={3} />
        ) : (
          <Check className={`${iconSize} text-white`} strokeWidth={2} />
        )
      ) : (
        <Plus
          className={`${iconSize} fill-white transition-transform duration-150 hover:scale-110`}
          strokeWidth={2}
        />
      )}
    </div>
  )
})
