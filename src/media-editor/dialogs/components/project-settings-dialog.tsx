import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProject } from "@/media-editor/project-settings/project-provider"
import {
  ASPECT_RATIOS,
  type ColorSpace,
  type FrameRate,
  getDefaultResolutionForAspectRatio,
  getResolutionsForAspectRatio,
  type ResolutionOption,
} from "@/types/project"

interface ProjectSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSettingsDialog({ open, onOpenChange }: ProjectSettingsDialogProps) {
  const { t } = useTranslation()
  const { settings, updateSettings } = useProject()
  const [availableResolutions, setAvailableResolutions] = useState<ResolutionOption[]>([])

  // Функция для получения локализованного названия соотношения сторон
  const getAspectRatioLabel = (textLabel: string): string => {
    const labelMap: Record<string, string> = {
      "Широкоэкнранный": t('dialogs.projectSettings.aspectRatioLabels.widescreen'),
      "Портрет": t('dialogs.projectSettings.aspectRatioLabels.portrait'),
      "Социальные сети": t('dialogs.projectSettings.aspectRatioLabels.social'),
      "Стандарт": t('dialogs.projectSettings.aspectRatioLabels.standard'),
      "Вертикальный": t('dialogs.projectSettings.aspectRatioLabels.vertical'),
      "Кинотеатр": t('dialogs.projectSettings.aspectRatioLabels.cinema')
    }

    return labelMap[textLabel] || textLabel
  }

  // Обновляем доступные разрешения при изменении соотношения сторон
  useEffect(() => {
    if (settings.aspectRatio) {
      const resolutions = getResolutionsForAspectRatio(settings.aspectRatio.label)
      setAvailableResolutions(resolutions)
      console.log("[ProjectSettingsDialog] Доступные разрешения обновлены:", resolutions)
    }
  }, [settings.aspectRatio])

  // Функция для обновления соотношения сторон и автоматического обновления разрешения
  const handleAspectRatioChange = (value: string) => {
    const newAspectRatio = ASPECT_RATIOS.find((item) => item.label === value)
    if (newAspectRatio) {
      // Получаем рекомендуемое разрешение для нового соотношения сторон
      const recommendedResolution = getDefaultResolutionForAspectRatio(value)

      // Обновляем настройки проекта с новым соотношением сторон и разрешением
      const newSettings = {
        ...settings,
        aspectRatio: newAspectRatio,
        resolution: recommendedResolution.value,
      }

      // Обновляем размеры в соответствии с рекомендуемым разрешением
      if (recommendedResolution) {
        newSettings.aspectRatio = {
          ...newSettings.aspectRatio,
          value: {
            ...newSettings.aspectRatio.value,
            width: recommendedResolution.width,
            height: recommendedResolution.height,
          },
        }
      }

      // Применяем новые настройки
      updateSettings(newSettings)

      console.log("[ProjectSettingsDialog] Соотношение сторон изменено:", {
        aspectRatio: newAspectRatio.label,
        recommendedResolution: recommendedResolution.value,
        width: recommendedResolution.width,
        height: recommendedResolution.height,
      })

      // Принудительно обновляем компоненты
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("resize"))
        }
      }, 50)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm dark:bg-[#1b1a1f] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-md text-center">{t('dialogs.projectSettings.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-1">
          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t('dialogs.projectSettings.aspectRatio')}</Label>
            <Select value={settings.aspectRatio.label} onValueChange={handleAspectRatioChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                {ASPECT_RATIOS.map((item) => (
                  <SelectItem key={item.label} value={item.label} className="">
                    {item.label === "custom"
                      ? `${item.label} (${t('dialogs.projectSettings.aspectRatioLabels.custom')})`
                      : `${item.label} ${item.textLabel ? `(${getAspectRatioLabel(item.textLabel)})` : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t('dialogs.projectSettings.resolution')}</Label>
            <Select
              value={settings.resolution}
              onValueChange={(value: string) => {
                // Находим выбранное разрешение в списке доступных
                const selectedResolution = availableResolutions.find((res) => res.value === value)

                if (selectedResolution) {
                  // Создаем новые настройки с обновленным разрешением и размерами
                  const newSettings = {
                    ...settings,
                    resolution: value,
                    aspectRatio: {
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width: selectedResolution.width,
                        height: selectedResolution.height,
                      },
                    },
                  }

                  // Применяем новые настройки
                  updateSettings(newSettings)
                } else {
                  // Если разрешение не найдено, просто обновляем значение
                  updateSettings({
                    ...settings,
                    resolution: value,
                  })
                }
              }}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                {availableResolutions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t('dialogs.projectSettings.frameRate')}</Label>
            <Select
              value={settings.frameRate}
              onValueChange={(value: FrameRate) =>
                updateSettings({
                  ...settings,
                  frameRate: value,
                })
              }
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="23.97" className="">
                  23.97 fps
                </SelectItem>
                <SelectItem value="24" className="">
                  24 fps
                </SelectItem>
                <SelectItem value="25" className="">
                  25 fps
                </SelectItem>
                <SelectItem value="29.97" className="">
                  29.97 fps
                </SelectItem>
                <SelectItem value="30" className="">
                  30 fps
                </SelectItem>
                <SelectItem value="50" className="">
                  50 fps
                </SelectItem>
                <SelectItem value="59.94" className="">
                  59.94 fps
                </SelectItem>
                <SelectItem value="60" className="">
                  60 fps
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t('dialogs.projectSettings.colorSpace')}</Label>
            <Select
              value={settings.colorSpace}
              onValueChange={(value: ColorSpace) =>
                updateSettings({
                  ...settings,
                  colorSpace: value,
                })
              }
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                <SelectItem value="sdr" className="">
                  SDR - Rec.709
                </SelectItem>
                <SelectItem value="dci-p3" className="">
                  DCI-P3
                </SelectItem>
                <SelectItem value="p3-d65" className="">
                  P3-D65
                </SelectItem>
                <SelectItem value="hdr-hlg" className="">
                  HDR - Rec.2100HLG
                </SelectItem>
                <SelectItem value="hdr-pq" className="">
                  HDR - Rec.2100PQ
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between space-x-4">
          <Button
            variant="default"
            className="flex-1 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            {t('dialogs.projectSettings.cancel')}
          </Button>
          <Button
            variant="default"
            className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
            onClick={() => {
              // Force a refresh of the UI by triggering a small update to settings
              // This ensures all components react to the settings changes
              const currentSettings = { ...settings }

              // Обновляем размеры в соответствии с текущим разрешением
              // Это гарантирует, что шаблоны будут правильно отображаться
              if (currentSettings.resolution) {
                const resolutionParts = currentSettings.resolution.split("x")
                if (resolutionParts.length === 2) {
                  const width = Number.parseInt(resolutionParts[0], 10)
                  const height = Number.parseInt(resolutionParts[1], 10)

                  if (!Number.isNaN(width) && !Number.isNaN(height)) {
                    // Обновляем размеры в соответствии с выбранным разрешением
                    currentSettings.aspectRatio = {
                      ...currentSettings.aspectRatio,
                      value: {
                        ...currentSettings.aspectRatio.value,
                        width,
                        height,
                      },
                    }
                  }
                }
              }

              // This will trigger a re-render of all components that depend on settings
              // and ensure the settings are saved to localStorage
              updateSettings(currentSettings)

              console.log("[ProjectSettingsDialog] Applied settings:", currentSettings)

              // Закрываем диалог с небольшой задержкой, чтобы дать время обновиться всем компонентам
              setTimeout(() => {
                onOpenChange(false)

                // Принудительно вызываем событие изменения размера окна,
                // чтобы обновить все компоненты, которые зависят от размеров
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("resize"))
                }
              }, 100)
            }}
          >
            {t('dialogs.projectSettings.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
