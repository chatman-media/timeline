// components/Waveform.tsx
import { memo, useEffect, useRef } from "react"

interface WaveformProps {
  audioUrl: string
  waveform: {
    data: any
    isLoading: boolean
    error: Error | null
  }
}

const Waveform = memo(function Waveform({ audioUrl, waveform }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !waveform.data) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем waveform
    if (waveform.data) {
      // Здесь будет логика отрисовки waveform
      // Пока просто рисуем тестовую линию
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.strokeStyle = "#fff"
      ctx.stroke()
    }
  }, [waveform.data])

  if (waveform.isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Загрузка...</div>
      </div>
    )
  }

  if (waveform.error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-red-400">Ошибка загрузки</div>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
    />
  )
})

Waveform.displayName = "Waveform"

export { Waveform }
