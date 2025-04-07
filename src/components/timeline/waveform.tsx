// components/Waveform.tsx
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"

interface WaveformProps {
  audioUrl: string
  onReady?: () => void
}

export const Waveform: React.FC<WaveformProps> = ({ audioUrl, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isDestroyed = false

    if (!containerRef.current) return

    const initWaveSurfer = async () => {
      try {
        if (wavesurfer.current) {
          wavesurfer.current.destroy()
          wavesurfer.current = null
          setIsReady(false)
        }

        wavesurfer.current = WaveSurfer.create({
          container: containerRef.current!,
          waveColor: "rgba(74, 158, 255, 0.4)",
          progressColor: "rgba(33, 118, 255, 0.4)",
          cursorColor: "#ffffff",
          height: 40,
          normalize: true,
          backend: 'MediaElement',
          autoplay: false,
          interact: false,
          hideScrollbar: true,
          barWidth: 1,
          barGap: 1,
          barRadius: 2
        })

        wavesurfer.current.on("ready", () => {
          if (!isDestroyed) {
            setIsReady(true)
            onReady?.()
          }
        })

        wavesurfer.current.on("error", (error) => {
          console.error("WaveSurfer error:", error)
        })

        await wavesurfer.current.load(audioUrl)
      } catch (error) {
        console.error("Error initializing WaveSurfer:", error)
      }
    }

    initWaveSurfer()

    return () => {
      isDestroyed = true
      if (wavesurfer.current && isReady) {
        try {
          wavesurfer.current.destroy()
        } catch (error) {
          console.error("Error destroying WaveSurfer:", error)
        }
      }
      wavesurfer.current = null
      setIsReady(false)
    }
  }, [audioUrl, onReady])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full absolute bottom-[40px] left-0 z-0" 
      style={{
        clipPath: 'inset(0 0 50% 0)', // Обрезаем нижнюю половину
        transform: 'scaleY(2)', // Растягиваем верхнюю половину на всю высоту
        transformOrigin: 'top' // Трансформируем от верхнего края
      }}
    />
  )
}
