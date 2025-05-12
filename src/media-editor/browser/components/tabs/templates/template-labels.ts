import i18n from "@/i18n"

export interface TemplateDescription {
  id: string
}

/**
 * Функция для получения локализованного названия шаблона по id
 * @param id Идентификатор шаблона
 * @returns Локализованное название шаблона
 */
export function getTemplateLabels(id: string): string {
  return i18n.t(`templates.templateLabels.${id}`)
}

/**
 * Функция для получения локализованного описания шаблона по id
 * @param id Идентификатор шаблона
 * @returns Локализованное описание шаблона
 */
export function getTemplateDescription(id: string): string {
  return i18n.t(`templates.templateDescriptions.${id}`)
}

// Список всех доступных шаблонов
export const templateLabels: TemplateDescription[] = [
  // Шаблоны с 2 экранами - Ландшафтный формат
  { id: "split-vertical-landscape" },
  { id: "split-horizontal-landscape" },
  { id: "split-diagonal-landscape" },

  // Шаблоны с 3 экранами - Ландшафтный формат
  { id: "split-vertical-3-landscape" },
  { id: "split-horizontal-3-landscape" },
  { id: "split-mixed-1-landscape" },
  { id: "split-mixed-2-landscape" },

  // Шаблоны с 4 экранами - Ландшафтный формат
  { id: "split-grid-2x2-landscape" },
  { id: "split-vertical-4-landscape" },
  { id: "split-1-3-landscape" },
  { id: "split-3-1-landscape" },
  { id: "split-3-1-right-landscape" },
  { id: "split-1-3-bottom-landscape" },
  { id: "split-diagonal-cross-landscape" },

  // Шаблоны с 5 экранами - Ландшафтный формат
  { id: "split-custom-5-1-landscape" },
  { id: "split-custom-5-2-landscape" },
  { id: "split-custom-5-3-landscape" },

  // Шаблоны с 6 экранами - Ландшафтный формат
  { id: "split-grid-3x2-landscape" },

  // Шаблоны с 8 экранами - Ландшафтный формат
  { id: "split-grid-4x2-landscape" },

  // Шаблоны с 9 экранами - Ландшафтный формат
  { id: "split-grid-3x3-landscape" },

  // Шаблоны с 10 экранами - Ландшафтный формат
  { id: "split-grid-5x2-landscape" },

  // Шаблоны с 12 экранами - Ландшафтный формат
  { id: "split-grid-4x3-landscape" },
  { id: "split-grid-3x4-landscape" },

  // Шаблоны с 16 экранами - Ландшафтный формат
  { id: "split-grid-4x4-landscape" },

  // Шаблоны с 25 экранами - Ландшафтный формат
  { id: "split-grid-5x5-landscape" },

  // Шаблоны с 2 экранами - Портретный формат
  { id: "split-vertical-portrait" },
  { id: "split-horizontal-portrait" },
  { id: "split-diagonal-portrait" },

  // Шаблоны с 3 экранами - Портретный формат
  { id: "split-vertical-3-portrait" },
  { id: "split-horizontal-3-portrait" },
  { id: "split-mixed-1-portrait" },
  { id: "split-mixed-2-portrait" },

  // Шаблоны с 4 экранами - Портретный формат
  { id: "split-grid-2x2-portrait" },
  { id: "split-3-1-right-portrait" },
  { id: "split-vertical-4-portrait" },
  { id: "split-horizontal-4-portrait" },
  { id: "split-diagonal-cross-portrait" },
  { id: "split-1-3-portrait" },
  { id: "split-3-1-portrait" },
  { id: "split-1-3-bottom-portrait" },

  // Шаблоны с 5 экранами - Портретный формат
  { id: "split-custom-5-1-portrait" },
  { id: "split-custom-5-2-portrait" },
  { id: "split-custom-5-3-portrait" },

  // Шаблоны с 6 экранами - Портретный формат
  { id: "split-grid-2x3-portrait" },
  { id: "split-grid-2x3-alt-portrait" },

  // Шаблоны с 8 экранами - Портретный формат
  { id: "split-grid-2x4-portrait" },

  // Шаблоны с 10 экранами - Портретный формат
  { id: "split-grid-2x5-portrait" },

  // Шаблоны с 12 экранами - Портретный формат
  { id: "split-grid-3x4-portrait" },
  { id: "split-grid-4x3-portrait" },

  // Шаблоны с 9 экранами - Портретный формат
  { id: "split-grid-3x3-portrait" },

  // Шаблоны с 16 экранами - Портретный формат
  { id: "split-grid-4x4-portrait" },

  // Шаблоны с 25 экранами - Портретный формат
  { id: "split-grid-5x5-portrait" },

  // Шаблоны с 2 экранами - Квадратный формат
  { id: "split-vertical-square" },
  { id: "split-horizontal-square" },
  { id: "split-diagonal-square" },

  // Шаблоны с 3 экранами - Квадратный формат
  { id: "split-vertical-3-square" },
  { id: "split-horizontal-3-square" },
  { id: "split-mixed-1-square" },
  { id: "split-mixed-2-square" },

  // Шаблоны с 4 экранами - Квадратный формат
  { id: "split-grid-2x2-square" },
  { id: "split-diagonal-4-square" },
  { id: "split-vertical-4-square" },
  { id: "split-horizontal-4-square" },

  // Шаблоны с 8 экранами - Квадратный формат
  { id: "split-grid-2x4-square" },
  { id: "split-grid-4x2-square" },
  { id: "split-diagonal-cross-square" },
  { id: "split-1-3-square" },
  { id: "split-3-1-square" },
  { id: "split-3-1-right-square" },
  { id: "split-1-3-bottom-square" },
  { id: "split-diagonal-vertical-square" },
  { id: "split-quad-square" },

  // Шаблоны с 5 экранами - Квадратный формат
  { id: "split-custom-5-3-square" },
  { id: "split-custom-5-4-square" },

  // Шаблоны с 7 экранами
  { id: "split-custom-7-1-square" },
  { id: "split-custom-7-2-square" },
  { id: "split-custom-7-3-square" },
  { id: "split-custom-7-4-square" },
  { id: "split-grid-2x3-square" },
  { id: "split-grid-3x2-square" },
  { id: "split-grid-3x3-square" },
  { id: "split-grid-5x2-square" },
  { id: "split-grid-2x5-square" },
  { id: "split-grid-4x3-square" },
  { id: "split-grid-3x4-square" },
  { id: "split-grid-4x4-square" },
  { id: "split-grid-5x5-square" },
  { id: "split-custom-7-1-landscape" },
  { id: "split-custom-7-2-landscape" },
  { id: "split-custom-7-3-landscape" },
  { id: "split-custom-7-4-landscape" },
  { id: "split-custom-7-1-portrait" },
  { id: "split-custom-7-2-portrait" },
  { id: "split-custom-7-3-portrait" },
  { id: "split-custom-7-4-portrait" },
]
