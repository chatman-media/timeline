export function getSavedLayout(id: string): number[] | null {
  if (typeof window === "undefined") return null

  try {
    const savedLayout = localStorage.getItem(`rpl-panel-group:${id}`)
    return savedLayout ? JSON.parse(savedLayout) : null
  } catch (e) {
    console.error("Ошибка при чтении сохраненных размеров:", e)
    return null
  }
}

export const defaultSizes = {
  mainLayout: [50, 50],
  topLayout: [30, 70],
  bottomLayout: [30, 70],
} 