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

export function CompilationSettings() {
  const { videos, activeVideos, maxDuration } = useMedia()
  const { mainCamera, setMainCamera, settings, updateSettings } = useCompilationSettings()

  const getCameraChangeLabel = (value: number): string => {
    if (value <= 1 / 7) return "Очень редко"
    if (value <= 2 / 7) return "Редко"
    if (value <= 3 / 7) return "Умеренно редко"
    if (value <= 4 / 7) return "Средне"
    if (value <= 5 / 7) return "Умеренно часто"
    if (value <= 6 / 7) return "Часто"
    return "Очень часто"
  }

  const getSceneDurationLabel = (value: number): string => {
    if (value <= 1) return "Очень короткие"
    if (value <= 2) return "Короткие"
    if (value <= 3.5) return "Умеренно короткие"
    if (value <= 5) return "Средние"
    if (value <= 6.5) return "Умеренно длинные"
    if (value <= 8) return "Длинные"
    return "Очень длинные"
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-4 text-gray-900 dark:text-gray-100">
        <span className="text-sm min-w-32">Главная камера:</span>
        <Select
          value={mainCamera.toString()}
          onValueChange={(value) => setMainCamera(parseInt(value))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {videos.map((x) => (
              <SelectItem key={x.name} value={x.name}>
                V{x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
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
        <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
          Длина сцены:
        </span>
        <div className="flex items-center gap-4 flex-1">
          <Slider
            value={[settings.averageSceneDuration]}
            onValueChange={([value]) => updateSettings({ averageSceneDuration: value })}
            min={0.5}
            max={10}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm w-32 text-right text-muted-foreground">
            {getSceneDurationLabel(settings.averageSceneDuration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
          Смена камеры:
        </span>
        <div className="flex items-center gap-4 flex-1">
          <Slider
            value={[settings.cameraChangeFrequency]}
            onValueChange={([value]) => updateSettings({ cameraChangeFrequency: value })}
            min={0}
            max={1}
            step={1 / 7}
            className="flex-1"
          />
          <span className="text-sm w-32 text-right text-muted-foreground">
            {getCameraChangeLabel(settings.cameraChangeFrequency)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm min-w-32 text-gray-900 dark:text-gray-100">
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
