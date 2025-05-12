import { createFilmoraPreset } from "./filmora-preset"
import { createPremierePreset } from "./premiere-preset"
import { createTimelinePreset } from "./timeline-preset"
import { PresetType, ShortcutCategory } from "./types"

// Функция для создания всех предустановок
export const createPresets = (t: any): Record<PresetType, ShortcutCategory[]> => ({
  Timeline: createTimelinePreset(t),
  "Wondershare Filmora": createFilmoraPreset(t),
  "Adobe Premier Pro": createPremierePreset(t),
})

export * from "./types"
