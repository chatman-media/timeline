import { create } from "zustand"

interface AudioPoint {
  timestamp: number
  amplitude: number // от -1 до 1
}

interface AudioData {
  data: AudioPoint[]
  status: "idle" | "loading" | "success" | "error"
  error?: string
}

interface AudioStore {
  audioData: Record<string, AudioData>
  analyzeAudio: (trackId: string, filePath: string) => Promise<void>
  resetAudio: (trackId: string) => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  audioData: {},

  analyzeAudio: async (trackId: string, filePath: string) => {
    // Проверяем, не анализируется ли уже этот трек
    const currentData = get().audioData[trackId]
    if (currentData?.status === "loading") return

    // Устанавливаем статус загрузки
    set((state) => ({
      audioData: {
        ...state.audioData,
        [trackId]: { data: [], status: "loading" },
      },
    }))

    try {
      const response = await fetch("/api/analyze-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze audio")
      }

      const data = await response.json()

      set((state) => ({
        audioData: {
          ...state.audioData,
          [trackId]: { data, status: "success" },
        },
      }))
    } catch (error) {
      set((state) => ({
        audioData: {
          ...state.audioData,
          [trackId]: {
            data: [],
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      }))
    }
  },

  resetAudio: (trackId: string) => {
    set((state) => {
      const { [trackId]: _, ...rest } = state.audioData
      return { audioData: rest }
    })
  },
}))
