import { usePlayerContext } from "@/providers/player-provider"

export function Player() {
  const { video, isVideoLoading, isVideoReady } = usePlayerContext()

  if (!video) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">Выберите видео для воспроизведения</p>
      </div>
    )
  }

  if (isVideoLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!isVideoReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <p className="text-white">Ошибка загрузки видео</p>
      </div>
    )
  }

  return (
    <video
      className="h-full w-full bg-black"
      src={video.path}
      controls
      autoPlay
    />
  )
} 