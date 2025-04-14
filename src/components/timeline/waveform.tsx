// components/Waveform.tsx
import { memo, useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"

interface WaveformProps {
  audioUrl: string
}

function Waveform({ audioUrl }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!audioUrl) return

    async function fetchAudio() {
      try {
        // Отменяем предыдущий запрос, если он существует
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Создаем новый контроллер для этого запроса
        abortControllerRef.current = new AbortController()
        const { signal } = abortControllerRef.current

        const response = await fetch(audioUrl, { signal })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()
        if (blob.size === 0) {
          throw new Error("Received empty audio blob")
        }

        setAudioBlob(blob)
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Fetch aborted")
          return
        }
        console.error("Error fetching audio:", error)
      }
    }

    fetchAudio()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [audioUrl])

  useEffect(() => {
    if (!containerRef.current || !audioBlob || wavesurferRef.current) return

    const audioUrl = URL.createObjectURL(audioBlob)

    try {
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#4F4A85",
        progressColor: "#383351",
        url: audioUrl,
        normalize: true,
        height: 40,
        barWidth: 1,
        barGap: 0,
        cursorWidth: 0,
        hideScrollbar: true,
        backend: "MediaElement",
      })

      wavesurferRef.current.on("ready", () => {
        console.log("WaveSurfer is ready")
      })

      wavesurferRef.current.on("error", (err) => {
        console.error("WaveSurfer error:", err)
      })

      wavesurferRef.current.on("loading", (percent) => {
        console.log("Loading:", percent)
      })
    } catch (error: unknown) {
      console.error("Error creating WaveSurfer:", error)
    }

    return () => {
      wavesurferRef.current?.destroy()
      wavesurferRef.current = null
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioBlob])

  return <div ref={containerRef} className="z-11 h-full" />
}

Waveform.displayName = "Waveform"

export default memo(Waveform)
