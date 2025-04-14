export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "4:5" | "21:9" | "3:4" | "custom"
export type Resolution = "1280x720" | "1920x1080" | "3840x2160" | "4096x2160" | "custom"
export type FrameRate = "23.97" | "24" | "25" | "29.97" | "30" | "50" | "59.94" | "60"
export type ColorSpace = "sdr" | "dci-p3" | "p3-d65" | "hdr-hlg" | "hdr-pq"

export interface ProjectSettings {
  aspectRatio: AspectRatio
  resolution: Resolution
  frameRate: FrameRate
  colorSpace: ColorSpace
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  aspectRatio: "16:9",
  resolution: "1920x1080",
  frameRate: "30",
  colorSpace: "sdr",
}
