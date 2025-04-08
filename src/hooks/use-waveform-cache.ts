import { useCallback,useState } from "react"

interface WaveformCache {
  [key: string]: {
    data: any
    isLoading: boolean
    error: Error | null
  }
}

export function useWaveformCache() {
  const [cache, setCache] = useState<WaveformCache>({})

  const getWaveform = useCallback(
    (audioUrl: string) => {
      if (!cache[audioUrl]) {
        setCache((prev) => ({
          ...prev,
          [audioUrl]: {
            data: null,
            isLoading: true,
            error: null,
          },
        }))

        // Здесь будет логика загрузки waveform
        // Пока просто эмулируем загрузку
        setTimeout(() => {
          setCache((prev) => ({
            ...prev,
            [audioUrl]: {
              data: null,
              isLoading: false,
              error: null,
            },
          }))
        }, 1000)
      }

      return cache[audioUrl]
    },
    [cache],
  )

  return { getWaveform }
}
