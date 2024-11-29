import { memo, useEffect, useRef } from "react"
import { useMedia } from "@/hooks/use-media"

export const ActiveVideo = memo(() => {
  const {
    videoRefs,
    isPlaying,
    activeVideo,
    currentTime,
    play,
    updateTime,
    setIsPlaying,
    assembledTracks,
    setActiveCamera,
  } = useMedia()
  if (!videoRefs.current) {
    videoRefs.current = {}
  }

  const isTimeUpdateFromVideo = useRef(false)

  useEffect(() => {
    const videoElement = videoRefs.current[activeVideo?.id]
    if (videoElement && activeVideo) {
      const videoStartTime =
        new Date(activeVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000

      if (!isTimeUpdateFromVideo.current) {
        const relativeTime = currentTime - videoStartTime
        if (relativeTime >= 0 && relativeTime <= (activeVideo.probeData.format.duration || 0)) {
          videoElement.currentTime = relativeTime
        }
      }
      isTimeUpdateFromVideo.current = false

      const handleTimeUpdate = () => {
        if (!videoElement.seeking) {
          isTimeUpdateFromVideo.current = true
          const newTime = videoStartTime + videoElement.currentTime
          updateTime(newTime)
        }
      }

      const handleVideoEnded = () => {
        const currentTrackIndex = assembledTracks.findIndex((track) =>
          track.allVideos.some((v) => v.id === activeVideo.id)
        )

        if (currentTrackIndex !== -1) {
          const currentTrack = assembledTracks[currentTrackIndex]
          const currentVideoIndex = currentTrack.allVideos.findIndex((v) => v.id === activeVideo.id)

          if (currentVideoIndex < currentTrack.allVideos.length - 1) {
            setActiveCamera(currentTrack.allVideos[currentVideoIndex + 1].id)
          } else {
            const nextTrackIndex = (currentTrackIndex + 1) % assembledTracks.length
            const nextTrack = assembledTracks[nextTrackIndex]
            if (nextTrack && nextTrack.allVideos.length > 0) {
              setActiveCamera(nextTrack.allVideos[0].id)
            }
          }
        }
      }

      videoElement.addEventListener("timeupdate", handleTimeUpdate)
      videoElement.addEventListener("ended", handleVideoEnded)

      if (isPlaying) {
        videoElement.play().catch(console.error)
      } else {
        videoElement.pause()
      }

      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate)
        videoElement.removeEventListener("ended", handleVideoEnded)
      }
    }
  }, [activeVideo, isPlaying, currentTime, assembledTracks, setActiveCamera])

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        {activeVideo
          ? (
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current[activeVideo.id] = el
                } else {
                  delete videoRefs.current[activeVideo.id]
                }
              }}
              src={activeVideo.path}
              className="w-full h-full object-contain"
              playsInline
              muted={false}
              // controls
              onClick={play}
              style={{ cursor: "pointer" }}
            />
          )
          : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No active video</p>
            </div>
          )}
      </div>
    </div>
  )
})

ActiveVideo.displayName = "ActiveVideo"
