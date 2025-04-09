import { useRootStore } from "@/hooks/use-root-store"

export function usePanelLayout(id: string): [number[] | null, (sizes: number[]) => void] {
  const { panelLayouts, setPanelLayout } = useRootStore()
  const savedLayout = panelLayouts[id]

  const saveLayout = (sizes: number[]) => {
    setPanelLayout(id, sizes)
  }

  return [savedLayout || null, saveLayout]
}

export const defaultSizes = {
  mainLayout: [50, 50],
  topLayout: [30, 70],
  bottomLayout: [30, 70],
}
