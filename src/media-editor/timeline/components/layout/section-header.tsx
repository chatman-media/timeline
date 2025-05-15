import { MoveHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TimelineControls } from "./timeline-controls"

interface SectionHeaderProps {
  /**
   * Дата секции в формате ISO (YYYY-MM-DD)
   */
  date: string

  /**
   * Отформатированная дата секции для отображения
   */
  formattedDate: string

  /**
   * Функция для подгонки секции под ширину экрана
   */
  onFitToScreen: (date: string) => void

  /**
   * Минимальный масштаб
   */
  minScale?: number

  /**
   * Максимальный масштаб
   */
  maxScale?: number
}

/**
 * Компонент заголовка секции таймлайна
 * Отображает дату секции и элементы управления масштабом
 */
export function SectionHeader({
  date,
  formattedDate,
  onFitToScreen,
  minScale = 0.005,
  maxScale = 200,
}: SectionHeaderProps) {
  const { t } = useTranslation()

  // Обработчик клика по заголовку секции
  const handleHeaderClick = () => {
    // Активируем сектор при клике на заголовок
    window.dispatchEvent(
      new CustomEvent("activate-sector", {
        detail: {
          sectorDate: date,
          preserveOtherSectors: true,
        },
      }),
    )

    // Устанавливаем preferredSource в "timeline" при активации сектора
    if (typeof window !== "undefined" && window.playerContext) {
      console.log(
        `[SectionHeader] Устанавливаем preferredSource в "timeline" при активации сектора ${date}`,
      )
      window.playerContext.setPreferredSource("timeline")
    }

    console.log(`[SectionHeader] Активирован сектор ${date}`)
  }

  return (
    <div className="bg-secondary flex h-[30px] items-center justify-between border-b border-gray-200 px-2 dark:border-gray-700">
      <h3
        className="cursor-pointer text-sm font-medium text-gray-900 hover:underline dark:text-white"
        onClick={handleHeaderClick}
      >
        {formattedDate}
      </h3>

      {/* Элементы управления масштабом для сектора */}
      <div className="flex items-center gap-2">
        {/* Двунаправленная стрелка */}
        <button
          onClick={() => onFitToScreen(date)}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm hover:bg-[#dddbdd] dark:hover:bg-[#45444b]"
          title={t("timeline.toolbar.fitToScreen")}
        >
          <MoveHorizontal size={14} />
        </button>

        <TimelineControls minScale={minScale} maxScale={maxScale} sectorDate={date} />
      </div>
    </div>
  )
}
