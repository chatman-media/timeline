import { Music, Package, Palette, Scissors, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useTimeline } from "@/media-editor/timeline/services"
import { TimelineResource } from "@/types/resources"

/**
 * Компонент для отображения ресурсов таймлайна в левой панели
 */
export function TimelineResources() {
  const { t, i18n } = useTranslation()

  // Проверяем текущий язык и доступные переводы
  console.log("Current language:", i18n.language)
  console.log("Templates translation:", t("timeline.resources.templates", "Шаблоны (fallback)"))
  const {
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    musicResources,
  } = useTimeline()

  // Выводим все ключи переводов для отладки
  console.log("All translations:", {
    effects: t("timeline.resources.effects"),
    filters: t("timeline.resources.filters"),
    transitions: t("timeline.resources.transitions"),
    templates: t("timeline.resources.templates"),
    music: t("timeline.resources.music"),
  })

  // Категории ресурсов с их данными
  const categories = [
    {
      id: "effects",
      name: t("timeline.resources.effects", "Эффекты"),
      icon: <Package className="h-3.5 w-3.5 text-gray-400" />,
      resources: effectResources,
    },
    {
      id: "filters",
      name: t("timeline.resources.filters", "Фильтры"),
      icon: <Palette className="h-3.5 w-3.5 text-gray-400" />,
      resources: filterResources,
    },
    {
      id: "transitions",
      name: t("timeline.resources.transitions", "Переходы"),
      icon: <Scissors className="h-3.5 w-3.5 text-gray-400" />,
      resources: transitionResources,
    },
    {
      id: "templates",
      // Явно указываем ключ перевода и запасное значение
      name: i18n.exists("timeline.resources.templates")
        ? t("timeline.resources.templates")
        : "Шаблоны",
      icon: <Video className="h-3.5 w-3.5 text-gray-400" />,
      resources: templateResources,
    },
    {
      id: "music",
      name: t("timeline.resources.music", "Музыка"),
      icon: <Music className="h-3.5 w-3.5 text-gray-400" />,
      resources: musicResources,
    },
  ]

  // Функция для отображения списка ресурсов
  const renderResourceList = (resources: TimelineResource[]) => {
    if (resources.length === 0) {
      return null // Если ресурсов нет, не показываем ничего
    }

    return (
      <div>
        <div className="flex flex-wrap gap-1 px-1 py-1">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="relative mb-1 flex h-[26px] w-[110px] flex-shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-[#333] bg-[#2a2a2a] px-2 hover:bg-[#333]"
            >
              {/* Иконка ресурса (слева) */}
              <div className="flex-shrink-0">
                {resource.type === "effect" && <Package className="h-4 w-4 text-gray-400" />}
                {resource.type === "filter" && <Palette className="h-4 w-4 text-gray-400" />}
                {resource.type === "transition" && <Scissors className="h-4 w-4 text-gray-400" />}
                {resource.type === "template" && <Video className="h-4 w-4 text-gray-400" />}
                {resource.type === "music" && <Music className="h-4 w-4 text-gray-400" />}
              </div>

              {/* Название ресурса (справа) */}
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-[10px] text-gray-300">
                  {resource.type === "template" &&
                    (i18n.exists(`templates.templateLabels.${resource.name}`)
                      ? t(`templates.templateLabels.${resource.name}`, resource.name)
                      : resource.name)}
                  {resource.type !== "template" && resource.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#1a1a1a] text-white">
      <div className="border-b border-[#333] p-1.5">
        <h3 className="text-xs font-medium">
          {i18n.exists("timeline.resources.title") ? t("timeline.resources.title") : "Ресурсы"}
        </h3>
      </div>

      {/* Прокручиваемый контейнер для всех категорий */}
      <div className="scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent flex-1 overflow-y-auto">
        <div className="space-y-2 p-1.5">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Заголовок категории */}
              <div className="flex items-center gap-1.5 border-b border-[#333] pb-1 text-[11px] font-medium text-gray-300">
                {category.icon}
                {category.name}
                {category.resources.length > 0 && (
                  <span className="ml-1 text-[9px] text-gray-500">
                    ({category.resources.length})
                  </span>
                )}
              </div>

              {/* Список ресурсов категории */}
              {renderResourceList(category.resources)}

              {/* Сообщение, если нет ресурсов */}
              {category.resources.length === 0 && (
                <div className="pl-1 text-[10px] text-gray-500">
                  {i18n.exists("timeline.resources.noResources")
                    ? t("timeline.resources.noResources")
                    : "Нет добавленных ресурсов"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
