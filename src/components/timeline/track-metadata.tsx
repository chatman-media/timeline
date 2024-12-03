import { FfprobeStream } from "fluent-ffmpeg"

import { formatBitrate, formatDuration } from "@/lib/utils"
import { AssembledTrack, MediaFile } from "@/types/videos"

export function TrackMetadata({ track, videoStream }: { track: AssembledTrack; videoStream: FfprobeStream }) {
  return (
    <div className="w-full inset-0 flex left-0 px-1 mb-1 justify-between text-xs text-gray-100">
      <div className="flex flex-row video-metadata truncate mr-2">
        <span>V{track.index}</span>
        {track.allVideos.map((v: MediaFile) => <span key={v.id}>{v.path.split("/").pop()}</span>)}
        <span>{videoStream?.codec_name?.toUpperCase()}</span>
        <span>{videoStream?.width}×{videoStream?.height}</span>
        <span>{videoStream?.display_aspect_ratio}</span>
        <span>
          {formatBitrate(
            Math.round(
              track.allVideos.reduce(
                (sum: number, video: MediaFile) => sum + (video.probeData.format.bit_rate || 0),
                0,
              ) / track.allVideos.length,
            ),
          )}
        </span>
      </div>
      <div className="flex flex-col items-end time">
        <span>{formatDuration(track.combinedDuration, 2)}</span>
      </div>
    </div>
  )
}
