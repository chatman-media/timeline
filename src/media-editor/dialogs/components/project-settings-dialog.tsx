import { Lock, Unlock } from "lucide-react"
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
import { Input } from "@/components/ui/input"
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
  const { settings, updateSettings, setDirty } = useProject()
  const [availableResolutions, setAvailableResolutions] = useState<ResolutionOption[]>([])
  const [customWidth, setCustomWidth] = useState<number>(1920)
  const [customHeight, setCustomHeight] = useState<number>(1080)
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true)

  // Функция для получения локализованного названия соотношения сторон
  const getAspectRatioLabel = (textLabel: string): string => {
    const labelMap: Record<string, string> = {
      Широкоэкнранный: t("dialogs.projectSettings.aspectRatioLabels.widescreen"),
      Портрет: t("dialogs.projectSettings.aspectRatioLabels.portrait"),
      "Социальные сети": t("dialogs.projectSettings.aspectRatioLabels.social"),
      Стандарт: t("dialogs.projectSettings.aspectRatioLabels.standard"),
      Вертикальный: t("dialogs.projectSettings.aspectRatioLabels.vertical"),
      Кинотеатр: t("dialogs.projectSettings.aspectRatioLabels.cinema"),
    }

    return labelMap[textLabel] || textLabel
  }

  // Функция для преобразования ширины и высоты в строку формата X:Y
  const getAspectRatioString = (width: number, height: number): string => {
    // Стандартные соотношения сторон
    if (Math.abs(width / height - 16 / 9) < 0.01) return "16:9"
    if (Math.abs(width / height - 9 / 16) < 0.01) return "9:16"
    if (Math.abs(width / height - 1) < 0.01) return "1:1"
    if (Math.abs(width / height - 4 / 3) < 0.01) return "4:3"
    if (Math.abs(width / height - 3 / 4) < 0.01) return "3:4"
    if (Math.abs(width / height - 4 / 5) < 0.01) return "4:5"
    if (Math.abs(width / height - 5 / 4) < 0.01) return "5:4"
    if (Math.abs(width / height - 21 / 9) < 0.01) return "21:9"

    // Находим наибольший общий делитель
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b)
    }

    const divisor = gcd(width, height)
    const x = width / divisor
    const y = height / divisor

    // Если соотношение получается слишком сложным, возвращаем десятичную дробь с 2 знаками после запятой
    if (x > 30 || y > 30) {
      return (width / height).toFixed(2).replace(".", ":")
    }

    return `${Math.round(x)}:${Math.round(y)}`
  }

  // Обновляем доступные разрешения при изменении соотношения сторон
  useEffect(() => {
    if (settings.aspectRatio) {
      const resolutions = getResolutionsForAspectRatio(settings.aspectRatio.label)
      setAvailableResolutions(resolutions)

      // Обновляем значения пользовательской ширины и высоты
      setCustomWidth(settings.aspectRatio.value.width)
      setCustomHeight(settings.aspectRatio.value.height)

      console.log("[ProjectSettingsDialog] Доступные разрешения обновлены:", resolutions)
    }
  }, [settings.aspectRatio])

  // Функция для обновления соотношения сторон и автоматического обновления разрешения
  const handleAspectRatioChange = (value: string) => {
    const newAspectRatio = ASPECT_RATIOS.find((item) => item.label === value)
    if (newAspectRatio) {
      // Если выбрано пользовательское соотношение сторон, отключаем блокировку
      if (value === "custom" && aspectRatioLocked) {
        setAspectRatioLocked(false)
      }

      // Получаем рекомендуемое разрешение для нового соотношения сторон
      const recommendedResolution = getDefaultResolutionForAspectRatio(value)

      // Обновляем настройки проекта с новым соотношением сторон и разрешением
      const newSettings = {
        ...settings,
        aspectRatio: newAspectRatio,
        resolution: value === "custom" ? "custom" : recommendedResolution.value,
      }

      // Обновляем размеры в соответствии с рекомендуемым разрешением или пользовательскими значениями
      if (value === "custom") {
        // Для пользовательского соотношения используем текущие значения ширины и высоты
        newSettings.aspectRatio = {
          ...newSettings.aspectRatio,
          value: {
            ...newSettings.aspectRatio.value,
            width: customWidth,
            height: customHeight,
          },
        }
      } else if (recommendedResolution) {
        // Для стандартных соотношений используем рекомендуемое разрешение
        newSettings.aspectRatio = {
          ...newSettings.aspectRatio,
          value: {
            ...newSettings.aspectRatio.value,
            width: recommendedResolution.width,
            height: recommendedResolution.height,
          },
        }

        // Обновляем значения пользовательской ширины и высоты
        setCustomWidth(recommendedResolution.width)
        setCustomHeight(recommendedResolution.height)
      }

      // Применяем новые настройки
      updateSettings(newSettings)

      console.log("[ProjectSettingsDialog] Соотношение сторон изменено:", {
        aspectRatio: newAspectRatio.label,
        resolution: newSettings.resolution,
        width: newSettings.aspectRatio.value.width,
        height: newSettings.aspectRatio.value.height,
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
      <DialogContent className="z-[400] rounded-sm dark:bg-[#1b1a1f] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-md text-center">
            {t("dialogs.projectSettings.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-1">
          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t("dialogs.projectSettings.aspectRatio")}</Label>
            <Select value={settings.aspectRatio.label} onValueChange={handleAspectRatioChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="">
                {ASPECT_RATIOS.map((item) => (
                  <SelectItem key={item.label} value={item.label} className="">
                    {item.label === "custom"
                      ? t("dialogs.projectSettings.aspectRatioLabels.custom")
                      : `${item.label} ${item.textLabel ? `(${getAspectRatioLabel(item.textLabel)})` : ""}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t("dialogs.projectSettings.resolution")}</Label>
            <Select
              value={settings.aspectRatio.label === "custom" ? "custom" : settings.resolution}
              onValueChange={(value: string) => {
                if (settings.aspectRatio.label === "custom") {
                  // Для пользовательского соотношения сторон всегда используем пользовательское разрешение
                  return
                }

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

                  // Обновляем значения пользовательской ширины и высоты
                  setCustomWidth(selectedResolution.width)
                  setCustomHeight(selectedResolution.height)
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
                {settings.aspectRatio.label === "custom" ? (
                  <SelectItem value="custom" className="">
                    {t("dialogs.projectSettings.aspectRatioLabels.custom")}
                  </SelectItem>
                ) : (
                  availableResolutions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="">
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Поля для ввода ширины и высоты (всегда видимы) */}
          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t("dialogs.projectSettings.customSize")}</Label>
            <div className="flex items-center">
              <Input
                type="number"
                value={customWidth}
                onChange={(e) => {
                  const width = parseInt(e.target.value, 10)
                  if (!isNaN(width) && width > 0) {
                    setCustomWidth(width)

                    // Если соотношение сторон заблокировано, обновляем высоту пропорционально
                    if (aspectRatioLocked && settings.aspectRatio.label !== "custom") {
                      const aspectRatio =
                        settings.aspectRatio.value.width / settings.aspectRatio.value.height
                      const newHeight = Math.round(width / aspectRatio)
                      setCustomHeight(newHeight)

                      // Обновляем настройки проекта с новыми размерами
                      const newSettings = {
                        ...settings,
                        aspectRatio: {
                          ...settings.aspectRatio,
                          value: {
                            ...settings.aspectRatio.value,
                            width,
                            height: newHeight,
                          },
                        },
                        resolution: `${width}x${newHeight}`,
                      }
                      updateSettings(newSettings)
                    } else {
                      // Если соотношение сторон не заблокировано или пользовательское, просто обновляем ширину
                      const newSettings = {
                        ...settings,
                        aspectRatio: {
                          ...settings.aspectRatio,
                          value: {
                            ...settings.aspectRatio.value,
                            width,
                          },
                        },
                        resolution: `${width}x${customHeight}`,
                      }
                      updateSettings(newSettings)
                    }
                  }
                }}
                className="w-20 text-center"
                min={320}
                max={7680}
              />
              <span className="mx-2 text-sm">x</span>
              <Input
                type="number"
                value={customHeight}
                onChange={(e) => {
                  const height = parseInt(e.target.value, 10)
                  if (!isNaN(height) && height > 0) {
                    setCustomHeight(height)

                    // Если соотношение сторон заблокировано, обновляем ширину пропорционально
                    if (aspectRatioLocked && settings.aspectRatio.label !== "custom") {
                      const aspectRatio =
                        settings.aspectRatio.value.width / settings.aspectRatio.value.height
                      const newWidth = Math.round(height * aspectRatio)
                      setCustomWidth(newWidth)

                      // Обновляем настройки проекта с новыми размерами
                      const newSettings = {
                        ...settings,
                        aspectRatio: {
                          ...settings.aspectRatio,
                          value: {
                            ...settings.aspectRatio.value,
                            width: newWidth,
                            height,
                          },
                        },
                        resolution: `${newWidth}x${height}`,
                      }
                      updateSettings(newSettings)
                    } else {
                      // Если соотношение сторон не заблокировано или пользовательское, просто обновляем высоту
                      const newSettings = {
                        ...settings,
                        aspectRatio: {
                          ...settings.aspectRatio,
                          value: {
                            ...settings.aspectRatio.value,
                            height,
                          },
                        },
                        resolution: `${customWidth}x${height}`,
                      }
                      updateSettings(newSettings)
                    }
                  }
                }}
                className="w-20 text-center"
                min={240}
                max={4320}
              />
              {settings.aspectRatio.label !== "custom" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`ml-2 h-7 w-7 cursor-pointer p-0 ${aspectRatioLocked ? "text-[#00CCC0]" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                  title={
                    aspectRatioLocked
                      ? t("dialogs.projectSettings.unlockAspectRatio")
                      : t("dialogs.projectSettings.lockAspectRatio")
                  }
                >
                  {aspectRatioLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center text-xs text-gray-400">
              {settings.aspectRatio.label !== "custom" ? (
                aspectRatioLocked ? (
                  <>
                    <Lock className="mr-1 h-3 w-3 text-[#00CCC0]" />
                    <span className="text-[#00CCC0]">
                      {t("dialogs.projectSettings.aspectRatioLocked", {
                        ratio: settings.aspectRatio.label,
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="mr-1 h-3 w-3" />
                    {t("dialogs.projectSettings.aspectRatioUnlocked", {
                      ratio: settings.aspectRatio.label,
                    })}
                  </>
                )
              ) : (
                <>
                  {t("dialogs.projectSettings.aspectRatioValue", {
                    ratio: getAspectRatioString(customWidth, customHeight),
                  })}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Label className="mr-2 text-xs">{t("dialogs.projectSettings.frameRate")}</Label>
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
            <Label className="mr-2 text-xs">{t("dialogs.projectSettings.colorSpace")}</Label>
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
            {t("dialogs.projectSettings.cancel")}
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
              if (currentSettings.resolution === "custom") {
                // Для пользовательского разрешения используем текущие значения ширины и высоты
                currentSettings.aspectRatio = {
                  ...currentSettings.aspectRatio,
                  value: {
                    ...currentSettings.aspectRatio.value,
                    width: customWidth,
                    height: customHeight,
                  },
                }
                // Устанавливаем разрешение в формате "ширинаxвысота"
                currentSettings.resolution = `${customWidth}x${customHeight}`
              } else if (currentSettings.resolution) {
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

              // Устанавливаем флаг "грязного" состояния проекта
              setDirty(true)

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
            {t("dialogs.projectSettings.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
