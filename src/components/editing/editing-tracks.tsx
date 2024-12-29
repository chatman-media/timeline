import { useVideoStore } from "@/stores/videoStore"
import { formatDuration, formatFileSize } from "@/lib/utils"

export function EditingTracks() {
  const tracks = useVideoStore((state) => state.tracks)

  return (
    <div className="p-4">
      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left">№</th>
              <th className="text-left">Камера</th>
              <th className="text-left">Файлы</th>
              <th className="text-left">Длительность</th>
              <th className="text-left">Разрешение</th>
              <th className="text-left">Размер</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tracks?.map((track) => {
              // Get first video for resolution info
              const firstVideo = track.videos[0]
              const videoStream = firstVideo?.probeData?.streams?.find(
                (s) => s.codec_type === "video",
              )

              // Calculate total size
              const totalSize = track.videos.reduce(
                (sum, video) => sum + (video.probeData?.format?.size || 0),
                0,
              )

              return (
                <tr key={track.id} className="hover:bg-muted/50">
                  <td className="p-2">{track.index}</td>
                  <td className="p-2">V{track.index}</td>
                  <td className="p-2">{track.videos.length}</td>
                  <td className="p-2">{formatDuration(track.combinedDuration)}</td>
                  <td className="p-2">
                    {videoStream ? `${videoStream.width}x${videoStream.height}` : "-"}
                  </td>
                  <td className="p-2">{formatFileSize(totalSize)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
