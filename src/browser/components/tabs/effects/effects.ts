export interface VideoEffect {
  id: string
  name: string
  type:
    | "blur"
    | "brightness"
    | "contrast"
    | "speed"
    | "reverse"
    | "grayscale"
    | "sepia"
    | "saturation"
    | "hue-rotate"
    | "vintage"
    | "duotone"
    | "noir"
    | "cyberpunk"
    | "dreamy"
    | "infrared"
    | "matrix"
    | "arctic"
    | "sunset"
    | "lomo"
    | "twilight"
    | "neon"
    | "invert"
    | "hue-rotate"
    | "sepia"
    | "saturation"
    | "hue-rotate"
    | "vintage"
    | "duotone"
    | "noir"
    | "cyberpunk"
    | "dreamy"
    | "infrared"
    | "matrix"
    | "arctic"
    | "sunset"
    | "lomo"
    | "twilight"
    | "neon"
  duration: number
  ffmpegCommand: (params: {
    intensity?: number
    speed?: number
    width?: number
    height?: number
    angle?: number
  }) => string
  params?: {
    intensity?: number
    speed?: number
    angle?: number
  }
  previewPath: string
  labels: {
    ru: string
    en: string
  }
}

export const effects: VideoEffect[] = [
  {
    id: "brightness",
    name: "Яркость",
    type: "brightness",
    duration: 0,
    ffmpegCommand: ({ intensity = 1.2 }) => `eq=brightness=${intensity}`,
    params: {
      intensity: 1.2,
    },
    previewPath: "/effects/brightness-preview.mp4",
    labels: {
      ru: "Яркость",
      en: "Brightness",
    },
  },
  {
    id: "contrast",
    name: "Контраст",
    type: "contrast",
    duration: 0,
    ffmpegCommand: ({ intensity = 1.5 }) => `eq=contrast=${intensity}`,
    params: {
      intensity: 1.5,
    },
    previewPath: "/effects/contrast-preview.mp4",
    labels: {
      ru: "Контраст",
      en: "Contrast",
    },
  },
  {
    id: "saturation",
    name: "Насыщенность",
    type: "saturation",
    duration: 0,
    ffmpegCommand: ({ intensity = 2 }) => `eq=saturation=${intensity}`,
    params: {
      intensity: 2,
    },
    previewPath: "/effects/saturation-preview.mp4",
    labels: {
      ru: "Насыщенность",
      en: "Saturation",
    },
  },
  {
    id: "sepia",
    name: "Сепия",
    type: "sepia",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.3 }) => `colorize=color=brown:blend=${intensity}`,
    params: {
      intensity: 0.3,
    },
    previewPath: "/effects/sepia-preview.mp4",
    labels: {
      ru: "Сепия",
      en: "Sepia",
    },
  },
  {
    id: "grayscale",
    name: "Черно-белый",
    type: "grayscale",
    duration: 0,
    ffmpegCommand: () => "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3",
    params: {},
    previewPath: "/effects/grayscale-preview.mp4",
    labels: {
      ru: "Черно-белый",
      en: "Grayscale",
    },
  },
  {
    id: "invert",
    name: "Инверсия",
    type: "invert",
    duration: 0,
    ffmpegCommand: () => "negate",
    params: {},
    previewPath: "/effects/invert-preview.mp4",
    labels: {
      ru: "Инверсия",
      en: "Invert",
    },
  },
  {
    id: "hue-rotate",
    name: "Поворот оттенка",
    type: "hue-rotate",
    duration: 0,
    ffmpegCommand: ({ angle = 90 }) => `hue=h=${angle}`,
    params: {
      angle: 90,
    },
    previewPath: "/effects/hue-rotate-preview.mp4",
    labels: {
      ru: "Поворот оттенка",
      en: "Hue Rotate",
    },
  },
  {
    id: "vintage",
    name: "Винтаж",
    type: "vintage",
    duration: 0,
    ffmpegCommand: () => "curves=vintage",
    params: {},
    previewPath: "/effects/vintage-preview.mp4",
    labels: {
      ru: "Винтаж",
      en: "Vintage",
    },
  },
  {
    id: "duotone",
    name: "Дуотон",
    type: "duotone",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.3 }) =>
      `colorbalance=rs=${intensity}:gs=${intensity}:bs=${intensity}:rm=0:gm=0:bm=0:rh=-${intensity}:gh=-${intensity}:bh=-${intensity}`,
    params: {
      intensity: 0.3,
    },
    previewPath: "/effects/duotone-preview.mp4",
    labels: {
      ru: "Дуотон",
      en: "Duotone",
    },
  },
  {
    id: "speed",
    name: "Скорость",
    type: "speed",
    duration: 0.5,
    ffmpegCommand: ({ speed = 2 }) => `setpts=${1 / speed}*PTS`,
    params: {
      speed: 2,
    },
    previewPath: "/effects/speed-preview.mp4",
    labels: {
      ru: "Скорость",
      en: "Speed",
    },
  },
  {
    id: "noir",
    name: "Нуар",
    type: "noir",
    duration: 0,
    ffmpegCommand: () => "curves=noir",
    params: {},
    previewPath: "/effects/noir-preview.mp4",
    labels: {
      ru: "Нуар",
      en: "Noir",
    },
  },
  {
    id: "cyberpunk",
    name: "Киберпанк",
    type: "cyberpunk",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.5 }) =>
      `colorbalance=rs=${intensity}:gs=-${intensity}:bs=${intensity * 1.6}`,
    params: {
      intensity: 0.5,
    },
    previewPath: "/effects/cyberpunk-preview.mp4",
    labels: {
      ru: "Киберпанк",
      en: "Cyberpunk",
    },
  },
  {
    id: "dreamy",
    name: "Мечтательный",
    type: "dreamy",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.1 }) =>
      `gblur=sigma=1.5,colorbalance=rs=${intensity}:gs=${intensity}:bs=${intensity}`,
    params: {
      intensity: 0.1,
    },
    previewPath: "/effects/dreamy-preview.mp4",
    labels: {
      ru: "Мечтательный",
      en: "Dreamy",
    },
  },
  {
    id: "infrared",
    name: "Инфракрасный",
    type: "infrared",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.8 }) =>
      `colorbalance=rs=${intensity}:gs=-${intensity}:bs=-${intensity}`,
    params: {
      intensity: 0.8,
    },
    previewPath: "/effects/infrared-preview.mp4",
    labels: {
      ru: "Инфракрасный",
      en: "Infrared",
    },
  },
  {
    id: "matrix",
    name: "Матрица",
    type: "matrix",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.8 }) =>
      `colorbalance=rs=-${intensity}:gs=${intensity}:bs=-${intensity}`,
    params: {
      intensity: 0.8,
    },
    previewPath: "/effects/matrix-preview.mp4",
    labels: {
      ru: "Матрица",
      en: "Matrix",
    },
  },
  {
    id: "arctic",
    name: "Арктика",
    type: "arctic",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.2 }) =>
      `colorbalance=rs=-${intensity}:gs=${intensity}:bs=${intensity * 2}`,
    params: {
      intensity: 0.2,
    },
    previewPath: "/effects/arctic-preview.mp4",
    labels: {
      ru: "Арктика",
      en: "Arctic",
    },
  },
  {
    id: "sunset",
    name: "Закат",
    type: "sunset",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.4 }) =>
      `colorbalance=rs=${intensity}:gs=${intensity / 4}:bs=-${intensity}`,
    params: {
      intensity: 0.4,
    },
    previewPath: "/effects/sunset-preview.mp4",
    labels: {
      ru: "Закат",
      en: "Sunset",
    },
  },
  {
    id: "lomo",
    name: "Ломо",
    type: "lomo",
    duration: 0,
    ffmpegCommand: () => "curves=lomo",
    params: {},
    previewPath: "/effects/lomo-preview.mp4",
    labels: {
      ru: "Ломо",
      en: "Lomo",
    },
  },
  {
    id: "twilight",
    name: "Сумерки",
    type: "twilight",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.2 }) =>
      `colorbalance=rs=-${intensity}:gs=-${intensity / 2}:bs=${intensity * 1.5}`,
    params: {
      intensity: 0.2,
    },
    previewPath: "/effects/twilight-preview.mp4",
    labels: {
      ru: "Сумерки",
      en: "Twilight",
    },
  },
  {
    id: "neon",
    name: "Неон",
    type: "neon",
    duration: 0,
    ffmpegCommand: ({ intensity = 0.5 }) =>
      `colorbalance=rs=${intensity}:gs=${intensity}:bs=${intensity * 1.6},curves=increase_contrast`,
    params: {
      intensity: 0.5,
    },
    previewPath: "/effects/neon-preview.mp4",
    labels: {
      ru: "Неон",
      en: "Neon",
    },
  },
]
