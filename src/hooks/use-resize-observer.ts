import { useCallback, useEffect, useState } from "react"

interface Size {
  width?: number
  height?: number
}

export function useResizeObserver<T extends HTMLElement>(): [
  (element: T | null) => void,
  Size,
] {
  const [ref, setRef] = useState<T | null>(null)
  const [size, setSize] = useState<Size>({
    width: undefined,
    height: undefined,
  })

  const handleSize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0]
    const { width, height } = entry.contentRect
    setSize({ width, height })
  }, [])

  useEffect(() => {
    if (!ref) return

    const observer = new ResizeObserver(handleSize)
    observer.observe(ref)

    return () => {
      observer.disconnect()
    }
  }, [ref, handleSize])

  return [setRef, size]
} 