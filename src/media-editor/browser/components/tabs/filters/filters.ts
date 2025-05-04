export interface VideoFilter {
  id: string
  name: string
  labels: {
    ru: string
    en: string
  }
  params: {
    brightness?: number
    contrast?: number
    saturation?: number
    gamma?: number
    temperature?: number
    tint?: number
  }
}

export const filters: VideoFilter[] = [
  {
    id: "s-log",
    name: "S-Log",
    labels: {
      ru: "S-Log",
      en: "S-Log",
    },
    params: {
      brightness: 0.1,
      contrast: 0.8,
      saturation: 0.9,
      gamma: 1.2,
    },
  },
  {
    id: "d-log",
    name: "D-Log",
    labels: {
      ru: "D-Log",
      en: "D-Log",
    },
    params: {
      brightness: 0.05,
      contrast: 0.85,
      saturation: 0.95,
      gamma: 1.1,
    },
  },
  {
    id: "v-log",
    name: "V-Log",
    labels: {
      ru: "V-Log",
      en: "V-Log",
    },
    params: {
      brightness: 0.15,
      contrast: 0.75,
      saturation: 0.85,
      gamma: 1.3,
    },
  },
  {
    id: "hlg",
    name: "HLG",
    labels: {
      ru: "HLG",
      en: "HLG",
    },
    params: {
      brightness: 0.2,
      contrast: 0.9,
      saturation: 1.1,
      gamma: 1.4,
    },
  },
  {
    id: "rec709",
    name: "Rec.709",
    labels: {
      ru: "Rec.709",
      en: "Rec.709",
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
    },
  },
  {
    id: "rec2020",
    name: "Rec.2020",
    labels: {
      ru: "Rec.2020",
      en: "Rec.2020",
    },
    params: {
      brightness: 0.1,
      contrast: 1.1,
      saturation: 1.2,
      gamma: 1.1,
    },
  },
  {
    id: "cinestyle",
    name: "CineStyle",
    labels: {
      ru: "CineStyle",
      en: "CineStyle",
    },
    params: {
      brightness: 0.05,
      contrast: 0.9,
      saturation: 0.8,
      gamma: 1.15,
    },
  },
  {
    id: "flat",
    name: "Flat",
    labels: {
      ru: "Flat",
      en: "Flat",
    },
    params: {
      brightness: 0,
      contrast: 0.7,
      saturation: 0.7,
      gamma: 1,
    },
  },
  {
    id: "neutral",
    name: "Neutral",
    labels: {
      ru: "Нейтральный",
      en: "Neutral",
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
    },
  },
  {
    id: "portrait",
    name: "Portrait",
    labels: {
      ru: "Портрет",
      en: "Portrait",
    },
    params: {
      brightness: 0.1,
      contrast: 1.1,
      saturation: 0.9,
      gamma: 1.05,
      temperature: 10,
      tint: 5,
    },
  },
  {
    id: "landscape",
    name: "Landscape",
    labels: {
      ru: "Пейзаж",
      en: "Landscape",
    },
    params: {
      brightness: 0.05,
      contrast: 1.2,
      saturation: 1.3,
      gamma: 1.1,
      temperature: -5,
      tint: -2,
    },
  },
]
