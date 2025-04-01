import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useCompilationSettings } from "@/hooks/use-compilation-settings"
import { useMedia } from "@/hooks/use-media"
import { formatDuration } from "@/lib/utils"
import { distributeScenes } from "@/utils/scene-distribution"

export function CompilationSettings() {
  const { videos, hasMedia, maxDuration, tracks, updateTime, play, setScenes } = useMedia()
  const { settings, updateSettings } = useCompilationSettings()

  const getCameraChangeLabel = (value: number): string => {
    const percent = value * 100
    if (percent <= 20) return "Очень редко"
    if (percent <= 40) return "Редко"
    if (percent <= 60) return "Средне"
    if (percent <= 80) return "Часто"
    return "Очень часто"
  }

  const getSceneDurationLabel = (value: number): string => {
    const percent = value * 100
    if (percent <= 20) return "Очень короткие"
    if (percent <= 40) return "Короткие"
    if (percent <= 60) return "Средние"
    if (percent <= 80) return "Длинные"
    return "Очень длинные"
  }

  useEffect(() => {
    if (videos.length > 0 && !settings.mainCamera) {
      updateSettings({ mainCamera: videos[0].id })
    }
  }, [videos])

  const handleAutoEdit = () => {
    if (!tracks.length) return

    const scenes = distributeScenes({
      targetDuration: settings.targetDuration,
      numCameras: tracks.length,
      averageSceneDuration: settings.averageSceneDuration * 10, // конвертируем в секунды
      cameraChangeFrequency: settings.cameraChangeFrequency,
      mainCamera: parseInt(settings.mainCamera || "1"),
      mainCameraProb: settings.mainCameraPriority / 100, // конвертируем в вероятность
      timeRange: {
        start: Math.min(
          ...tracks.flatMap((track) =>
            track.videos.map(
              (v) => new Date(v.probeData.format.tags?.creation_time || 0).getTime() / 1000,
            ),
          ),
        ),
        end: Math.max(
          ...tracks.flatMap((track) =>
            track.videos.map((v) => {
              const start = new Date(v.probeData.format.tags?.creation_time || 0).getTime() / 1000
              return start + (v.probeData.format.duration || 0)
            }),
          ),
        ),
      },
      tracks,
    })

    if (scenes.length > 0) {
      setScenes(scenes)
      updateTime(scenes[0].startTime)
      // setActiveCamera(scenes[0].cameraIndex)
      play()
    }
  }

  return (
    <div className="flex flex-col gap-6 w-[25%]">
      <div className="flex items-center gap-4 text-gray-900 dark:text-gray-100">
        <span className="text-sm min-w-54">Главная камера:</span>
        <Select
          value={settings.mainCamera || ""}
          onValueChange={(value) => updateSettings({ mainCamera: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите камеру" />
          </SelectTrigger>
          <SelectContent>
            {videos.map((video) => (
              <SelectItem key={video.id} value={video.id}>
                {video.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm  min-w-54 text-gray-900 dark:text-gray-100">Длительность:</span>
        <div className="flex items-center gap-4 flex-1">
          <Slider
            value={[settings.targetDuration]}
            onValueChange={([value]) => updateSettings({ targetDuration: value })}
            min={1}
            max={maxDuration}
            step={1}
            className="flex-1"
          />
          <span className="text-sm w-32 text-right text-muted-foreground">
            {formatDuration(settings.targetDuration, 0)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm  min-w-54 text-gray-900 dark:text-gray-100">
          Средняя длительность сцены:
        </span>
        <div className="flex items-center gap-4 flex-1">
          <Slider
            value={[settings.averageSceneDuration]}
            onValueChange={([value]) => updateSettings({ averageSceneDuration: value })}
            min={0}
            max={1}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm w-32 text-right text-muted-foreground">
            {getSceneDurationLabel(settings.averageSceneDuration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm  min-w-54 text-gray-900 dark:text-gray-100">
          Частота смены камеры:
        </span>
        <div className="flex items-center gap-4 flex-1">
          <Slider
            value={[settings.cameraChangeFrequency]}
            onValueChange={([value]) => updateSettings({ cameraChangeFrequency: value })}
            min={0}
            max={1}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm w-32 text-right text-muted-foreground">
            {getCameraChangeLabel(settings.cameraChangeFrequency)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm  min-w-54 text-gray-900 dark:text-gray-100">
          Приоритет главной:
        </span>
        <div className="flex items-center gap-4 flex-1">
          <Slider
            value={[settings.mainCameraPriority]}
            min={0}
            max={100}
            step={5}
            className="flex-1"
            onValueChange={(value) => updateSettings({ mainCameraPriority: value[0] })}
          />
          <span className="text-sm w-32 text-right text-muted-foreground">
            {settings.mainCameraPriority}%
          </span>
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <Button disabled={!hasMedia} onClick={handleAutoEdit} className="flex-1">
          Авто-монтаж
        </Button>
        <Button onClick={() => {}} variant="default" disabled={!hasMedia} className="flex-1">
          Сохранить
        </Button>
      </div>
    </div>
  )
}
