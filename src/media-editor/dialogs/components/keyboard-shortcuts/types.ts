// Типы предустановок
export type PresetType = "Timeline" | "Wondershare Filmora" | "Adobe Premier Pro"

// Интерфейс для категории горячих клавиш
export interface ShortcutCategory {
  id: string
  name: string
  shortcuts: Shortcut[]
}

// Интерфейс для горячей клавиши
export interface Shortcut {
  id: string
  name: string
  keys: string
  isEditing?: boolean
}

// Тип для функции создания предустановок
export type CreatePresetsFunction = (t: any) => ShortcutCategory[]
