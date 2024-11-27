import { useState } from "react"

interface CompilationSettings {
  targetDuration: number
  minSegmentLength: number
  maxSegmentLength: number
  averageSceneDuration: number
  cameraChangeFrequency: number
  mainCameraPriority: number
}

export function useCompilationSettings() {
  const [mainCamera, setMainCamera] = useState(1)
  const [settings, setSettings] = useState<CompilationSettings>({
    targetDuration: 900,
    minSegmentLength: 0.2,
    maxSegmentLength: 100,
    averageSceneDuration: 5,
    cameraChangeFrequency: 4 / 7,
    mainCameraPriority: 60,
  })

  const updateSettings = (newSettings: Partial<CompilationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return {
    mainCamera,
    setMainCamera,
    settings,
    updateSettings,
  }
}
