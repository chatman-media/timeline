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
  }) => string
  params?: {
    intensity?: number
    speed?: number
  }
  previewPath: string
}

export const effects: VideoEffect[] = [
  {
    id: "blur",
    name: "Размытие",
    type: "blur",
    duration: 0,
    ffmpegCommand: ({ intensity = 5 }) => `boxblur=${intensity}:${intensity}`,
    params: {
      intensity: 5,
    },
    previewPath: "/effects/blur-preview.mp4",
  },
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
  },
  {
    id: "speed",
    name: "Скорость",
    type: "speed",
    duration: 0,
    ffmpegCommand: ({ speed = 2 }) => `setpts=${1 / speed}*PTS`,
    params: {
      speed: 2,
    },
    previewPath: "/effects/speed-preview.mp4",
  },
]
