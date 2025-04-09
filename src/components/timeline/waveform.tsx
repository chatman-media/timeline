// components/Waveform.tsx
import { memo } from "react"

interface WaveformProps {
  audioUrl: string
}

const Waveform = memo(function Waveform({ audioUrl }: WaveformProps) {
  // Просто рендерим пустой контейнер без логики WaveSurfer и DOM-манипуляций
  return <div className="w-full h-[45px] bg-[#012425]" />
})

Waveform.displayName = "Waveform"

export { Waveform }
