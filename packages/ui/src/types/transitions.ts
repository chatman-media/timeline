export interface TransitionEffect {
  id: string
  name: string
  type: "zoom" | "fade" | "slide" | "wipe" | "dissolve"
  duration: number
  // Преобразуем в функцию, которая возвращает команду
  ffmpegCommand: (params: {
    fps: number
    width?: number
    height?: number
    scale?: number
    duration?: number
  }) => string
  params?: {
    scale?: number
    direction?: string
    smoothness?: number
  }
  previewPath: string
}

// Пример базы переходов
export const transitions: TransitionEffect[] = [
  {
    id: "zoom-in",
    name: "Зум",
    type: "zoom",
    duration: 1.5,
    ffmpegCommand: ({ fps, scale = 1.5, width = 1280, height = 720 }) => {
      const zoomSpeed = 0.0015
      return `[0:v]scale=2*iw:-1,zoompan=z='min(zoom+${zoomSpeed},${scale})':d=${
        fps * 1.5
      }:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}[v0];
              [1:v]scale=2*iw:-1,zoompan=z='if(lte(zoom,1.0),${scale},max(1.001,zoom-${zoomSpeed}))':d=${
                fps * 1.5
              }:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}[v1]`
    },
    params: {
      scale: 1.5,
    },
    previewPath: "/transitions/zoom-preview.mp4",
  },
]
