import { nanoid } from "nanoid"
import { create } from "zustand"

import { TrackSliceData } from "@/types/timeline"

interface TimelineState {
  slices: TrackSliceData[]
  selectedSliceId: string | null
  addSlice: (trackIndex: number, startTime: number) => void
  updateSlice: (data: Partial<TrackSliceData> & { id: string }) => void
  deleteSlice: (id: string) => void
  selectSlice: (id: string | null) => void
  loadSlices: () => void
}

interface VideoState {
  videoUrl: string
  setVideoUrl: (url: string) => void
}

export const useRootStore = create<TimelineState & VideoState>((set, get) => ({
  slices: [],
  selectedSliceId: null,

  addSlice: (trackIndex: number, startTime: number) => {
    const newSlice: TrackSliceData = {
      id: nanoid(10),
      x: 0,
      y: 0,
      width: "5%",
      height: 50,
      trackIndex,
      startTime,
      duration: 5, // 5 seconds by default
    }

    set((state) => {
      const newSlices = [...state.slices, newSlice]
      localStorage.setItem("timelineSlices", JSON.stringify(newSlices))
      return { slices: newSlices }
    })
  },

  updateSlice: (data) => {
    set((state) => {
      const newSlices = state.slices.map((slice) =>
        slice.id === data.id ? { ...slice, ...data } : slice
      )
      localStorage.setItem("timelineSlices", JSON.stringify(newSlices))
      return { slices: newSlices }
    })
  },

  deleteSlice: (id) => {
    set((state) => {
      const newSlices = state.slices.filter((slice) => slice.id !== id)
      localStorage.setItem("timelineSlices", JSON.stringify(newSlices))
      return { slices: newSlices }
    })
  },

  selectSlice: (id) => {
    set({ selectedSliceId: id })
  },

  loadSlices: () => {
    const savedSlices = localStorage.getItem("timelineSlices")
    if (savedSlices) {
      try {
        set({ slices: JSON.parse(savedSlices) })
      } catch (e) {
        console.error("Failed to parse saved slices:", e)
      }
    }
  },

  videoUrl: "",
  setVideoUrl: (url) => set({ videoUrl: url }),
}))
