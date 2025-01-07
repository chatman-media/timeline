import { formatDuration } from "@/lib/utils"
import { FfprobeData } from "@/types/ffprobe"

interface VideoMetadataProps {
  probeData?: FfprobeData
}

export function VideoMetadata({ probeData }: VideoMetadataProps) {
  if (!probeData) return null

  const videoStream = probeData.streams.find((s) => s.codec_type === "video")
  const audioStream = probeData.streams.find((s) => s.codec_type === "audio")

  return (
    <div className="bg-gray-900 text-gray-200 p-4 rounded-md space-y-6 text-xs">
      {/* Верхняя секция с основными параметрами */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-gray-400 mb-1">Начальный тайм-код</div>
          <div>00:00:00:00</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Конечный тайм-код</div>
          <div>{formatDuration(probeData.format.duration || 0)}</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Кадры</div>
          <div>{videoStream?.nb_frames}</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Shot Frame Rate</div>
          <div>{videoStream?.r_frame_rate?.split("/")[0]}</div>
        </div>
      </div>

      {/* Сведения о клипе */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium border-b border-gray-700 pb-2">Сведения о клипе</h3>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="py-1.5 text-gray-400">H.264 Main L5.2</td>
              <td className="py-1.5">{videoStream?.width} × {videoStream?.height}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">AAC</td>
              <td className="py-1.5">{audioStream?.sample_rate}Гц</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Битовая глубина</td>
              <td className="py-1.5">{videoStream?.bits_per_raw_sample || 8}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Порядок полукадров</td>
              <td className="py-1.5">Progressive</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Уровень данных</td>
              <td className="py-1.5">Auto</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Аудиоканалы</td>
              <td className="py-1.5">{audioStream?.channels}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Битовая глубина звука</td>
              <td className="py-1.5">{audioStream?.bits_per_sample || 32}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Футаж</td>
              <td className="py-1.5">{probeData.format.filename?.split("/").pop()}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-400">Имя клипа в EDL</td>
              <td className="py-1.5">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
