import { useState } from "react"

interface CompilationSettings {
  targetDuration: number
  averageSceneDuration: number
  cameraChangeFrequency: number
  mainCameraPriority: number
  mainCameraId?: string
}

export function useCompilationSettings() {
  const [mainCamera, setMainCamera] = useState(1)
  const [settings, setSettings] = useState<CompilationSettings>({
    targetDuration: 900,
    averageSceneDuration: 0.5,
    cameraChangeFrequency: 0.5,
    mainCameraPriority: 60,
    mainCameraId: undefined,
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
