import { useCallback, useEffect, useRef, useState } from "react"

interface UseTimelineZoomProps {
  minScale?: number
  maxScale?: number
  initialScale?: number
}

export function useTimelineZoom({
  minScale = 0.1,
  maxScale = 2.0,
  initialScale = 0.6,
}: UseTimelineZoomProps = {}) {
  const [scale, setScale] = useState(initialScale)
  const [isPanning, setIsPanning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMousePosition = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return

      event.preventDefault()

      const delta = -event.deltaY
      const scaleChange = delta > 0 ? 1.2 : 0.8
      
      setScale((currentScale) => {
        const newScale = currentScale * scaleChange
        return Math.min(Math.max(newScale, minScale), maxScale)
      })
    },
    [minScale, maxScale],
  )

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === "Space") {
      event.preventDefault()
      setIsPanning(true)
      if (containerRef.current) {
        containerRef.current.style.cursor = "grab"
      }
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.code === "Space") {
      setIsPanning(false)
      if (containerRef.current) {
        containerRef.current.style.cursor = "default"
      }
    }
  }, [])

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!isPanning) return

      event.preventDefault()
      lastMousePosition.current = { x: event.clientX, y: event.clientY }
      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing"
      }
    },
    [isPanning],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isPanning || !containerRef.current) return

      const dx = event.clientX - lastMousePosition.current.x
      containerRef.current.scrollLeft -= dx

      lastMousePosition.current = { x: event.clientX, y: event.clientY }
    },
    [isPanning],
  )

  const handleMouseUp = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = isPanning ? "grab" : "default"
    }
  }, [isPanning])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    container.addEventListener("mousedown", handleMouseDown)
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseup", handleMouseUp)
    container.addEventListener("mouseleave", handleMouseUp)

    return () => {
      container.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      container.removeEventListener("mousedown", handleMouseDown)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseup", handleMouseUp)
      container.removeEventListener("mouseleave", handleMouseUp)
    }
  }, [handleWheel, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseMove, handleMouseUp])

  return {
    scale,
    setScale,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
  }
} 