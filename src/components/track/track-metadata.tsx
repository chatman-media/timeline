import { formatDuration } from "@/lib/utils"
import { FfprobeStream } from "@/types/ffprobe"
import { MediaFile, Track } from "@/types/videos"

export function TrackMetadata(
  { track, videoStream }: { track: Track; videoStream?: FfprobeStream },
) {
  return (
    <div className="w-full inset-0 flex left-0 px-1 mb-1 justify-between text-xs text-gray-100">
      <div className="flex flex-row video-metadata truncate mr-2">
        <span>V{track.index}</span>
        {track.videos.map((v: MediaFile) => (
          <span key={v.id || v.name}>{v.path.split("/").pop()}</span>
        ))}
        <span>{videoStream?.codec_name?.toUpperCase()}</span>
        <span>{videoStream?.width}×{videoStream?.height}</span>
        <span>{videoStream?.display_aspect_ratio}</span>
      </div>
      <div className="flex flex-col items-end time">
        <span>{formatDuration(track.combinedDuration, 2)}</span>
      </div>
    </div>
  )
}
