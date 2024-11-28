import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/utils"
import { useMedia } from "@/hooks/use-media"
import { useCompilationSettings } from "@/hooks/use-compilation-settings"
import { useEffect } from "react"

export function CompilationSettings() {
  const { videos, activeVideos, maxDuration } = useMedia()
  const { mainCamera, setMainCamera, settings, updateSettings } = useCompilationSettings()

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
    if (videos.length > 0) {
      setMainCamera(videos[0].name)
    }
  }, [videos])

  console.log(mainCamera, videos[0].name)

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-4 text-gray-900 dark:text-gray-100">
        <span className="text-sm min-w-54">Главная камера:</span>
        <Select
          value={mainCamera || ""}
          onValueChange={setMainCamera}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите камеру" />
          </SelectTrigger>
          <SelectContent>
            {videos.map((video) => (
              <SelectItem key={video.name} value={video.name}>
                {video.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm  min-w-54 text-gray-900 dark:text-gray-100">
          Длительность: {formatDuration(settings.targetDuration, 0)}
        </span>
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
        <Button
          disabled={activeVideos.length === 0}
          className="flex-1"
        >
          Авто-монтаж
        </Button>
        <Button
          onClick={() => {}}
          variant="default"
          className="flex-1"
        >
          Сохранить
        </Button>
      </div>
    </div>
  )
}
