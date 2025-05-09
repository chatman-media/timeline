export interface TemplateLabels {
  ru: string
  en: string
}

export interface TemplateDescription {
  id: string
  labels: TemplateLabels
  description?: {
    ru: string
    en: string
  }
}

export const templateLabels: TemplateDescription[] = [
  // Шаблоны с 2 экранами - Ландшафтный формат
  {
    id: "split-vertical-landscape",
    labels: {
      ru: "2 экрана по вертикали",
      en: "2 screens vertical",
    },
    description: {
      ru: "Два экрана, разделенные вертикальной линией",
      en: "Two screens divided by a vertical line",
    },
  },
  {
    id: "split-horizontal-landscape",
    labels: {
      ru: "2 экрана по горизонтали",
      en: "2 screens horizontal",
    },
    description: {
      ru: "Два экрана, разделенные горизонтальной линией",
      en: "Two screens divided by a horizontal line",
    },
  },
  {
    id: "split-diagonal-landscape",
    labels: {
      ru: "Диагональное разделение",
      en: "Diagonal Split",
    },
    description: {
      ru: "Два экрана, разделенные диагональной линией",
      en: "Two screens divided by a diagonal line",
    },
  },

  // Шаблоны с 3 экранами - Ландшафтный формат
  {
    id: "split-vertical-3-landscape",
    labels: {
      ru: "3 экрана по вертикали",
      en: "3 screens vertical",
    },
    description: {
      ru: "Три экрана, разделенные вертикальными линиями",
      en: "Three screens divided by vertical lines",
    },
  },
  {
    id: "split-horizontal-3-landscape",
    labels: {
      ru: "3 экрана по горизонтали",
      en: "3 screens horizontal",
    },
    description: {
      ru: "Три экрана, разделенные горизонтальными линиями",
      en: "Three screens divided by horizontal lines",
    },
  },
  {
    id: "split-mixed-1-landscape",
    labels: {
      ru: "Смешанное разделение (1+2)",
      en: "Mixed Split (1+2)",
    },
    description: {
      ru: "Один экран сверху, два экрана снизу",
      en: "One screen on top, two screens below",
    },
  },
  {
    id: "split-mixed-2-landscape",
    labels: {
      ru: "Смешанное разделение (2+1)",
      en: "Mixed Split (2+1)",
    },
    description: {
      ru: "Два экрана сверху, один экран снизу",
      en: "Two screens on top, one screen below",
    },
  },

  // Шаблоны с 4 экранами - Ландшафтный формат
  {
    id: "split-grid-2x2-landscape",
    labels: {
      ru: "Сетка 2×2",
      en: "Grid 2×2",
    },
    description: {
      ru: "Четыре экрана в сетке 2×2",
      en: "Four screens in a 2×2 grid",
    },
  },
  {
    id: "split-vertical-4-landscape",
    labels: {
      ru: "4 экрана по вертикали",
      en: "4 screens vertical",
    },
    description: {
      ru: "Четыре экрана, разделенные вертикальными линиями",
      en: "Four screens divided by vertical lines",
    },
  },
  {
    id: "split-1-3-landscape",
    labels: {
      ru: "1 слева + 3 справа",
      en: "1 left + 3 right",
    },
    description: {
      ru: "Один экран слева, три экрана справа",
      en: "One screen on the left, three screens on the right",
    },
  },
  {
    id: "split-3-1-landscape",
    labels: {
      ru: "3 сверху + 1 снизу",
      en: "3 top + 1 bottom",
    },
    description: {
      ru: "Три экрана сверху, один экран снизу",
      en: "Three screens on top, one screen below",
    },
  },
  {
    id: "split-3-1-right-landscape",
    labels: {
      ru: "3 слева + 1 справа",
      en: "3 left + 1 right",
    },
    description: {
      ru: "Три экрана слева, один экран справа",
      en: "Three screens on the left, one screen on the right",
    },
  },
  {
    id: "split-1-3-bottom-landscape",
    labels: {
      ru: "1 сверху + 3 снизу",
      en: "1 top + 3 bottom",
    },
    description: {
      ru: "Один экран сверху, три экрана снизу",
      en: "One screen on top, three screens below",
    },
  },
  {
    id: "split-diagonal-cross-landscape",
    labels: {
      ru: "Диагональный крест",
      en: "Diagonal Cross",
    },
    description: {
      ru: "Четыре экрана, разделенные диагональными линиями в форме креста",
      en: "Four screens divided by diagonal lines in a cross shape",
    },
  },
  {
    id: "split-custom-5-1-landscape",
    labels: {
      ru: "5 экранов: 1 слева + 4 справа",
      en: "5 screens: 1 left + 4 right",
    },
    description: {
      ru: "Один большой экран слева, четыре экрана справа (2 сверху, 2 снизу)",
      en: "One large screen on the left, four screens on the right (2 top, 2 bottom)",
    },
  },
  {
    id: "split-custom-5-2-landscape",
    labels: {
      ru: "5 экранов: 1 справа + 4 слева",
      en: "5 screens: 1 right + 4 left",
    },
    description: {
      ru: "Один большой экран справа, четыре экрана слева (2 сверху, 2 снизу)",
      en: "One large screen on the right, four screens on the left (2 top, 2 bottom)",
    },
  },
  {
    id: "split-custom-5-3-landscape",
    labels: {
      ru: "5 экранов: 1 сверху + 4 снизу",
      en: "5 screens: 1 top + 4 bottom",
    },
    description: {
      ru: "Один большой экран сверху, четыре экрана снизу",
      en: "One large screen on top, four screens below",
    },
  },

  // Шаблоны с 6 экранами - Ландшафтный формат
  {
    id: "split-grid-3x2-landscape",
    labels: {
      ru: "Сетка 3×2",
      en: "Grid 3×2",
    },
    description: {
      ru: "Шесть экранов в сетке 3×2",
      en: "Six screens in a 3×2 grid",
    },
  },

  // Шаблоны с 8 экранами - Ландшафтный формат
  {
    id: "split-grid-4x2-landscape",
    labels: {
      ru: "Сетка 4×2",
      en: "Grid 4×2",
    },
    description: {
      ru: "Восемь экранов в сетке 4×2",
      en: "Eight screens in a 4×2 grid",
    },
  },

  // Шаблоны с 9 экранами - Ландшафтный формат
  {
    id: "split-grid-3x3-landscape",
    labels: {
      ru: "Сетка 3×3",
      en: "Grid 3×3",
    },
    description: {
      ru: "Девять экранов в сетке 3×3",
      en: "Nine screens in a 3×3 grid",
    },
  },

  // Шаблоны с 16 экранами - Ландшафтный формат
  {
    id: "split-grid-4x4-landscape",
    labels: {
      ru: "Сетка 4×4",
      en: "Grid 4×4",
    },
    description: {
      ru: "Шестнадцать экранов в сетке 4×4",
      en: "Sixteen screens in a 4×4 grid",
    },
  },

  // Шаблоны с 2 экранами - Портретный формат
  {
    id: "split-vertical-portrait",
    labels: {
      ru: "Вертикальное разделение",
      en: "Vertical Split",
    },
    description: {
      ru: "Два экрана, разделенные вертикальной линией",
      en: "Two screens divided by a vertical line",
    },
  },
  {
    id: "split-horizontal-portrait",
    labels: {
      ru: "Горизонтальное разделение",
      en: "Horizontal Split",
    },
    description: {
      ru: "Два экрана, разделенные горизонтальной линией",
      en: "Two screens divided by a horizontal line",
    },
  },
  {
    id: "split-diagonal-portrait",
    labels: {
      ru: "Диагональное разделение",
      en: "Diagonal Split",
    },
    description: {
      ru: "Два экрана, разделенные диагональной линией",
      en: "Two screens divided by a diagonal line",
    },
  },

  // Шаблоны с 3 экранами - Портретный формат
  {
    id: "split-vertical-3-portrait",
    labels: {
      ru: "3 экрана по вертикали",
      en: "3 screens vertical",
    },
    description: {
      ru: "Три экрана, разделенные вертикальными линиями",
      en: "Three screens divided by vertical lines",
    },
  },
  {
    id: "split-horizontal-3-portrait",
    labels: {
      ru: "3 экрана по горизонтали",
      en: "3 screens horizontal",
    },
    description: {
      ru: "Три экрана, разделенные горизонтальными линиями",
      en: "Three screens divided by horizontal lines",
    },
  },
  {
    id: "split-mixed-1-portrait",
    labels: {
      ru: "1 сверху + 2 снизу",
      en: "1 top + 2 bottom",
    },
    description: {
      ru: "Один экран сверху, два экрана снизу",
      en: "One screen on top, two screens below",
    },
  },
  {
    id: "split-mixed-2-portrait",
    labels: {
      ru: "1 слева + 2 справа",
      en: "1 left + 2 right",
    },
    description: {
      ru: "Один экран слева, два экрана справа",
      en: "One screen on the left, two screens on the right",
    },
  },

  // Шаблоны с 4 экранами - Портретный формат
  {
    id: "split-grid-2x2-portrait",
    labels: {
      ru: "Сетка 2×2",
      en: "Grid 2×2",
    },
    description: {
      ru: "Четыре экрана в сетке 2×2",
      en: "Four screens in a 2×2 grid",
    },
  },
  {
    id: "split-3-1-right-portrait",
    labels: {
      ru: "1 слева + 3 справа",
      en: "1 left + 3 right",
    },
    description: {
      ru: "Один экран слева, три экрана справа",
      en: "One screen on the left, three screens on the right",
    },
  },
  {
    id: "split-vertical-4-portrait",
    labels: {
      ru: "4 экрана по вертикали",
      en: "4 screens vertical",
    },
    description: {
      ru: "Четыре экрана, разделенные вертикальными линиями",
      en: "Four screens divided by vertical lines",
    },
  },
  {
    id: "split-horizontal-4-portrait",
    labels: {
      ru: "4 экрана по горизонтали",
      en: "4 screens horizontal",
    },
    description: {
      ru: "Четыре экрана, разделенные горизонтальными линиями",
      en: "Four screens divided by horizontal lines",
    },
  },
  {
    id: "split-diagonal-cross-portrait",
    labels: {
      ru: "Диагональный крест",
      en: "Diagonal Cross",
    },
    description: {
      ru: "Четыре экрана, разделенные диагональными линиями в форме креста",
      en: "Four screens divided by diagonal lines in a cross shape",
    },
  },
  {
    id: "split-1-3-portrait",
    labels: {
      ru: "1 сверху + 3 снизу",
      en: "1 top + 3 bottom",
    },
    description: {
      ru: "Один экран сверху, три экрана снизу",
      en: "One screen on top, three screens below",
    },
  },
  {
    id: "split-3-1-portrait",
    labels: {
      ru: "3 слева + 1 справа",
      en: "3 left + 1 right",
    },
    description: {
      ru: "Три экрана слева, один экран справа",
      en: "Three screens on the left, one screen on the right",
    },
  },
  {
    id: "split-1-3-bottom-portrait",
    labels: {
      ru: "3 сверху + 1 снизу",
      en: "3 top + 1 bottom",
    },
    description: {
      ru: "Три экрана сверху, один экран снизу",
      en: "Three screens on top, one screen below",
    },
  },

  // Шаблоны с 5 экранами - Портретный формат
  {
    id: "split-custom-5-1-portrait",
    labels: {
      ru: "1 сверху + 4 снизу",
      en: "1 top + 4 bottom",
    },
    description: {
      ru: "Один большой экран сверху, четыре экрана снизу (2 слева, 2 справа)",
      en: "One large screen on top, four screens below (2 left, 2 right)",
    },
  },
  {
    id: "split-custom-5-2-portrait",
    labels: {
      ru: "1 снизу + 4 сверху",
      en: "1 bottom + 4 top",
    },
    description: {
      ru: "Один большой экран снизу, четыре экрана сверху (2 слева, 2 справа)",
      en: "One large screen on bottom, four screens above (2 left, 2 right)",
    },
  },
  {
    id: "split-custom-5-3-portrait",
    labels: {
      ru: "1 посередине + 4 по краям",
      en: "1 middle + 4 around",
    },
    description: {
      ru: "Один экран посередине, по два экрана сверху и снизу",
      en: "One screen in the middle, two screens on top and two below",
    },
  },

  // Шаблоны с 6 экранами - Портретный формат
  {
    id: "split-grid-2x3-portrait",
    labels: {
      ru: "Сетка 2×3",
      en: "Grid 2×3",
    },
    description: {
      ru: "Шесть экранов в сетке 2×3",
      en: "Six screens in a 2×3 grid",
    },
  },
  {
    id: "split-grid-2x3-alt-portrait",
    labels: {
      ru: "Сетка 3×2",
      en: "Grid 3×2",
    },
    description: {
      ru: "Шесть экранов в сетке 3×2 (три колонки, два ряда)",
      en: "Six screens in a 3×2 grid (three columns, two rows)",
    },
  },

  // Шаблоны с 8 экранами - Портретный формат
  {
    id: "split-grid-2x4-portrait",
    labels: {
      ru: "Сетка 2×4",
      en: "Grid 2×4",
    },
    description: {
      ru: "Восемь экранов в сетке 2×4",
      en: "Eight screens in a 2×4 grid",
    },
  },

  // Шаблоны с 9 экранами - Портретный формат
  {
    id: "split-grid-3x3-portrait",
    labels: {
      ru: "Сетка 3×3",
      en: "Grid 3×3",
    },
    description: {
      ru: "Девять экранов в сетке 3×3",
      en: "Nine screens in a 3×3 grid",
    },
  },

  // Шаблоны с 16 экранами - Портретный формат
  {
    id: "split-grid-4x4-portrait",
    labels: {
      ru: "Сетка 4×4",
      en: "Grid 4×4",
    },
    description: {
      ru: "Шестнадцать экранов в сетке 4×4",
      en: "Sixteen screens in a 4×4 grid",
    },
  },

  // Шаблоны с 2 экранами - Квадратный формат
  {
    id: "split-vertical-square",
    labels: {
      ru: "Вертикальное разделение",
      en: "Vertical Split",
    },
    description: {
      ru: "Два экрана, разделенные вертикальной линией",
      en: "Two screens divided by a vertical line",
    },
  },
  {
    id: "split-horizontal-square",
    labels: {
      ru: "Горизонтальное разделение",
      en: "Horizontal Split",
    },
    description: {
      ru: "Два экрана, разделенные горизонтальной линией",
      en: "Two screens divided by a horizontal line",
    },
  },
  {
    id: "split-diagonal-square",
    labels: {
      ru: "Диагональное разделение",
      en: "Diagonal Split",
    },
    description: {
      ru: "Два экрана, разделенные диагональной линией",
      en: "Two screens divided by a diagonal line",
    },
  },

  // Шаблоны с 3 экранами - Квадратный формат
  {
    id: "split-vertical-3-square",
    labels: {
      ru: "3 экрана по вертикали",
      en: "3 screens vertical",
    },
    description: {
      ru: "Три экрана, разделенные вертикальными линиями",
      en: "Three screens divided by vertical lines",
    },
  },
  {
    id: "split-horizontal-3-square",
    labels: {
      ru: "3 экрана по горизонтали",
      en: "3 screens horizontal",
    },
    description: {
      ru: "Три экрана, разделенные горизонтальными линиями",
      en: "Three screens divided by horizontal lines",
    },
  },
  {
    id: "split-mixed-1-square",
    labels: {
      ru: "1 сверху + 2 снизу",
      en: "1 top + 2 bottom",
    },
    description: {
      ru: "Один экран сверху, два экрана снизу",
      en: "One screen on top, two screens below",
    },
  },
  {
    id: "split-mixed-2-square",
    labels: {
      ru: "1 слева + 2 справа",
      en: "1 left + 2 right",
    },
    description: {
      ru: "Один экран слева, два экрана справа",
      en: "One screen on the left, two screens on the right",
    },
  },

  // Шаблоны с 4 экранами - Квадратный формат
  {
    id: "split-grid-2x2-square",
    labels: {
      ru: "Сетка 2×2",
      en: "Grid 2×2",
    },
    description: {
      ru: "Четыре экрана в сетке 2×2",
      en: "Four screens in a 2×2 grid",
    },
  },
  {
    id: "split-diagonal-4-square",
    labels: {
      ru: "Четыре диагональных экрана",
      en: "Four Diagonal Screens",
    },
    description: {
      ru: "Четыре экрана, разделенные диагональными линиями",
      en: "Four screens divided by diagonal lines",
    },
  },
  {
    id: "split-vertical-4-square",
    labels: {
      ru: "4 экрана по вертикали",
      en: "4 screens vertical",
    },
    description: {
      ru: "Четыре экрана, разделенные вертикальными линиями",
      en: "Four screens divided by vertical lines",
    },
  },
  {
    id: "split-horizontal-4-square",
    labels: {
      ru: "4 экрана по горизонтали",
      en: "4 screens horizontal",
    },
    description: {
      ru: "Четыре экрана, разделенные горизонтальными линиями",
      en: "Four screens divided by horizontal lines",
    },
  },
  {
    id: "split-diagonal-cross-square",
    labels: {
      ru: "Диагональный крест",
      en: "Diagonal Cross",
    },
    description: {
      ru: "Четыре экрана, разделенные диагональными линиями в форме креста",
      en: "Four screens divided by diagonal lines in a cross shape",
    },
  },
  {
    id: "split-1-3-square",
    labels: {
      ru: "1 слева + 3 справа",
      en: "1 left + 3 right",
    },
    description: {
      ru: "Один экран слева, три экрана справа",
      en: "One screen on the left, three screens on the right",
    },
  },
  {
    id: "split-3-1-square",
    labels: {
      ru: "3 сверху + 1 снизу",
      en: "3 top + 1 bottom",
    },
    description: {
      ru: "Три экрана сверху, один экран снизу",
      en: "Three screens on top, one screen below",
    },
  },
  {
    id: "split-3-1-right-square",
    labels: {
      ru: "3 слева + 1 справа",
      en: "3 left + 1 right",
    },
    description: {
      ru: "Три экрана слева, один экран справа",
      en: "Three screens on the left, one screen on the right",
    },
  },
  {
    id: "split-1-3-bottom-square",
    labels: {
      ru: "1 сверху + 3 снизу",
      en: "1 top + 3 bottom",
    },
    description: {
      ru: "Один экран сверху, три экрана снизу",
      en: "One screen on top, three screens below",
    },
  },
  {
    id: "split-diagonal-vertical-square",
    labels: {
      ru: "Диагональное вертикальное разделение",
      en: "Diagonal Vertical Split",
    },
    description: {
      ru: "Экраны, разделенные диагональной и вертикальной линиями",
      en: "Screens divided by diagonal and vertical lines",
    },
  },
  {
    id: "split-quad-square",
    labels: {
      ru: "Четыре равных сектора",
      en: "Four Equal Sectors",
    },
    description: {
      ru: "Четыре экрана, разделенные на равные сектора",
      en: "Four screens divided into equal sectors",
    },
  },
  {
    id: "split-custom-5-3-square",
    labels: {
      ru: "1 посередине + 2×2 по краям",
      en: "1 middle + 2×2 around",
    },
    description: {
      ru: "Один экран посередине на всю ширину, по два экрана сверху и снизу",
      en: "One screen in the middle across full width, two screens on top and two below",
    },
  },
  {
    id: "split-custom-5-4-square",
    labels: {
      ru: "1 посередине + 2×2 по бокам",
      en: "1 middle + 2×2 sides",
    },
    description: {
      ru: "Один экран посередине на всю высоту, по два экрана слева и справа",
      en: "One screen in the middle across full height, two screens on left and two on right",
    },
  },
  {
    id: "split-custom-7-1-square",
    labels: {
      ru: "7 экранов (вариант 1)",
      en: "7 screens (variant 1)",
    },
    description: {
      ru: "Большой экран справа внизу, 6 маленьких экранов слева и сверху",
      en: "Large screen in bottom right, 6 small screens on left and top",
    },
  },
  {
    id: "split-custom-7-2-square",
    labels: {
      ru: "7 экранов (вариант 2)",
      en: "7 screens (variant 2)",
    },
    description: {
      ru: "Большой экран слева внизу, 6 маленьких экранов справа и сверху",
      en: "Large screen in bottom left, 6 small screens on right and top",
    },
  },
  {
    id: "split-custom-7-3-square",
    labels: {
      ru: "7 экранов (вариант 3)",
      en: "7 screens (variant 3)",
    },
    description: {
      ru: "Большой экран слева вверху, 6 маленьких экранов справа и снизу",
      en: "Large screen in top left, 6 small screens on right and bottom",
    },
  },
  {
    id: "split-custom-7-4-square",
    labels: {
      ru: "7 экранов (вариант 4)",
      en: "7 screens (variant 4)",
    },
    description: {
      ru: "Большой экран справа вверху, 6 маленьких экранов слева и снизу",
      en: "Large screen in top right, 6 small screens on left and bottom",
    },
  },
  {
    id: "split-grid-2x3-square",
    labels: {
      ru: "Сетка 2×3",
      en: "Grid 2×3",
    },
    description: {
      ru: "Шесть экранов в сетке 2×3",
      en: "Six screens in a 2×3 grid",
    },
  },

  // Шаблоны с 6 экранами - Квадратный формат
  {
    id: "split-grid-3x2-square",
    labels: {
      ru: "Сетка 3×2",
      en: "Grid 3×2",
    },
    description: {
      ru: "Шесть экранов в сетке 3×2",
      en: "Six screens in a 3×2 grid",
    },
  },

  // Шаблоны с 9 экранами - Квадратный формат
  {
    id: "split-grid-3x3-square",
    labels: {
      ru: "Сетка 3×3",
      en: "Grid 3×3",
    },
    description: {
      ru: "Девять экранов в сетке 3×3",
      en: "Nine screens in a 3×3 grid",
    },
  },

  // Шаблоны с 16 экранами - Квадратный формат
  {
    id: "split-grid-4x4-square",
    labels: {
      ru: "Сетка 4×4",
      en: "Grid 4×4",
    },
    description: {
      ru: "Шестнадцать экранов в сетке 4×4",
      en: "Sixteen screens in a 4×4 grid",
    },
  }
]

// Функция для получения локализованных названий шаблонов по id
export function getTemplateLabels(id: string): TemplateLabels | undefined {
  const template = templateLabels.find(template => template.id === id)
  return template?.labels
}

// Функция для получения локализованного описания шаблона по id
export function getTemplateDescription(id: string): TemplateLabels | undefined {
  const template = templateLabels.find(template => template.id === id)
  return template?.description
}
