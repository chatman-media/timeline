import { formatDuration, formatFileSize } from "@/lib/utils"
import { useVideoStore } from "@/hooks/useVideoStore"
import { Track } from "@/types/videos"

export function EditingTracks() {
  const { tracks } = useVideoStore()

  const getTrackPrefix = (track: Track) => {
    // Check if track contains any video files
    const hasVideo = track.videos.some((file) => {
      const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")
      return !!videoStream
    })

    return hasVideo ? "V" : "A"
  }

  return (
    <div className="p-1">
      <div className="border">
        <table className="w-full text-[12px] font-normal text-gray-500 dark:text-gray-400">
          <thead className="bg-muted/50">
            <tr className="border-b border-borde font-normal">
              <th className="text-left font-normal">№</th>
              <th className="text-left">Тип</th>
              <th className="text-left">Файлы</th>
              <th className="text-left">Длительность</th>
              <th className="text-left">Формат</th>
              <th className="text-left">Размер</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tracks?.map((track: Track) => {
              const firstFile = track.videos[0]
              const videoStream = firstFile?.probeData?.streams?.find(
                (s: any) => s.codec_type === "video",
              )
              const audioStream = firstFile?.probeData?.streams?.find(
                (s: any) => s.codec_type === "audio",
              )

              // Calculate total size
              const totalSize = track.videos.reduce(
                (sum: number, video: any) => sum + (video.probeData?.format?.size || 0),
                0,
              )

              const prefix = getTrackPrefix(track)
              const trackNumber = `${prefix}${track.index}`

              // Format info based on track type
              const formatInfo = videoStream
                ? `${videoStream.width}x${videoStream.height}`
                : audioStream
                ? `${audioStream.codec_name?.toUpperCase()} ${audioStream.channels}ch ${
                  Math.round(audioStream.sample_rate || 0 / 1000)
                }kHz`
                : "-"

              return (
                <tr key={track.id} className="hover:bg-muted/50">
                  <td className="p-1">{track.index}</td>
                  <td className="p-1">{trackNumber}</td>
                  <td className="p-1">{track.videos.length}</td>
                  <td className="p-1">{formatDuration(track.combinedDuration)}</td>
                  <td className="p-1">{formatInfo}</td>
                  <td className="p-1">{formatFileSize(totalSize)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
