import { useCallback, useState } from "react"

interface WaveformCache {
  [key: string]: {
    data: null // WaveSurfer генерирует визуализацию самостоятельно
    isLoading: boolean
    error: Error | null
  }
}

export function useWaveformCache() {
  const [cache, setCache] = useState<WaveformCache>({})

  const getWaveform = useCallback(
    (audioUrl: string) => {
      if (!cache[audioUrl]) {
        // Если путь еще не в кеше, инициализируем состояние
        setCache((prev) => ({
          ...prev,
          [audioUrl]: {
            data: null,
            isLoading: false, // Теперь WaveSurfer сам отвечает за загрузку
            error: null,
          },
        }))
      }

      return cache[audioUrl] || { data: null, isLoading: false, error: null }
    },
    [cache],
  )

  return { getWaveform }
}
