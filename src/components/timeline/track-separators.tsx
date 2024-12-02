export function TrackSeparators({
  videos,
  trackStartTime,
  trackEndTime,
}: {
  videos: any[]
  trackStartTime: number
  trackEndTime: number
}) {
  return (
    <>
      {videos.map((video, videoIndex) => {
        if (videoIndex === 0) return null

        const prevVideo = videos[videoIndex - 1]
        const prevEndTime =
          new Date(prevVideo.probeData.format.tags?.creation_time || 0).getTime() / 1000 +
          (prevVideo.probeData.format.duration || 0)
        const separatorPosition =
          ((prevEndTime - trackStartTime) / (trackEndTime - trackStartTime)) * 100

        return (
          <div
            key={`separator-${video.id}`}
            className="absolute h-full w-[1px] bg-white"
            style={{ left: `${separatorPosition}%`, top: 0 }}
          />
        )
      })}
    </>
  )
}
