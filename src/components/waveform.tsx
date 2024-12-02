// components/Waveform.tsx
import { useEffect, useRef } from "react"
import WaveSurfer from "wavesurfer.js"

interface WaveformProps {
  audioUrl: string
  onReady?: () => void
}

export const Waveform: React.FC<WaveformProps> = ({ audioUrl, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)

  useEffect(() => {
    if (containerRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#4a9eff",
        progressColor: "#2176ff",
        cursorColor: "#ffffff",
        height: 40,
        normalize: true,
      })

      wavesurfer.current.load(audioUrl)
      wavesurfer.current.on("ready", () => {
        onReady?.()
      })
    }

    return () => {
      wavesurfer.current?.destroy()
    }
  }, [audioUrl])

  return <div ref={containerRef} />
}
