export type Resolution = "1280x720" | "1920x1080" | "3840x2160" | "4096x2160" | "custom"
export type FrameRate = "23.97" | "24" | "25" | "29.97" | "30" | "50" | "59.94" | "60"
export type ColorSpace = "sdr" | "dci-p3" | "p3-d65" | "hdr-hlg" | "hdr-pq"

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    label: "16:9",
    textLabel: "Широкоэкнранный",
    description: "YouTube",
    value: {
      width: 1920,
      height: 1080,
      name: "16:9",
    },
  },
  {
    label: "9:16",
    textLabel: "Портрет",
    description: "TikTok, YouTube Shorts",
    value: {
      width: 1080,
      height: 1920,
      name: "9:16",
    },
  },
  {
    label: "1:1",
    textLabel: "Социальные сети",
    description: "Instagram, Social media posts",
    value: {
      width: 1080,
      height: 1080,
      name: "1:1",
    },
  },
  {
    label: "4:3",
    textLabel: "Стандарт",
    description: "TV",
    value: {
      width: 1440,
      height: 1080,
      name: "4:3",
    },
  },
  {
    label: "4:5",
    textLabel: "Вертикальный",
    description: "Vertical post",
    value: {
      width: 1024,
      height: 1280,
      name: "4:5",
    },
  },
  {
    label: "21:9",
    textLabel: "Кинотеатр",
    description: "Movie",
    value: {
      width: 2560,
      height: 1080,
      name: "21:9",
    },
  },
  {
    label: "Пользовательское",
    textLabel: "",
    description: "User",
    value: {
      width: 1920,
      height: 1080,
      name: "custom",
    },
  },
];


export interface ProjectSettings {
  aspectRatio: AspectRatio
  resolution: Resolution
  frameRate: FrameRate
  colorSpace: ColorSpace
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  aspectRatio: ASPECT_RATIOS[0],
  resolution: "1920x1080",
  frameRate: "30",
  colorSpace: "sdr",
}


// "16:9" | "9:16" | "1:1" | "4:3" | "4:5" | "21:9" | "custom"

export interface AspectRatio {
  label: string;
  textLabel: string;
  value: AspectRatioValue;
  description: string;
}

interface AspectRatioValue {
  width: number;
  height: number;
  name: string;
}

