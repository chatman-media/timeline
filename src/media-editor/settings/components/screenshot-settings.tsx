import React, { useEffect,useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

// Интерфейс для настроек скриншотов
interface ScreenshotSettings {
  interval: number // Интервал между скриншотами в секундах
  maxScreenshots: number | null // Максимальное количество скриншотов (null - без ограничений)
  initialCount: number // Количество скриншотов для начальной генерации
  screenshotsPath: string // Путь для сохранения скриншотов
  enableObjectDetection: boolean // Включить распознавание объектов
  confidenceThreshold: number // Порог уверенности для детекций
  width: number // Ширина скриншотов
  height: number // Высота скриншотов
}

// Значения по умолчанию
const defaultSettings: ScreenshotSettings = {
  interval: 1.0,
  maxScreenshots: null,
  initialCount: 10,
  screenshotsPath: "public/screenshots",
  enableObjectDetection: true,
  confidenceThreshold: 0.25,
  width: 640,
  height: 480,
}

// Ключ для хранения настроек в localStorage
const STORAGE_KEY = "timeline-screenshot-settings"

/**
 * Компонент для настройки параметров генерации скриншотов
 */
export function ScreenshotSettings() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<ScreenshotSettings>(defaultSettings)
  const [maxScreenshotsEnabled, setMaxScreenshotsEnabled] = useState<boolean>(false)

  // Загружаем настройки из localStorage при монтировании компонента
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY)
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        setMaxScreenshotsEnabled(parsedSettings.maxScreenshots !== null)
      }
    } catch (error) {
      console.error("[ScreenshotSettings] Ошибка при загрузке настроек:", error)
    }
  }, [])

  // Сохраняем настройки в localStorage при изменении
  const saveSettings = (newSettings: ScreenshotSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      setSettings(newSettings)

      toast.success(t("settings.saved"), {
        description: t("settings.savedDescription"),
        duration: 3000,
      })
    } catch (error) {
      console.error("[ScreenshotSettings] Ошибка при сохранении настроек:", error)

      toast.error(t("settings.error"), {
        description: t("settings.errorDescription"),
        duration: 5000,
      })
    }
  }

  // Обработчики изменения настроек
  const handleIntervalChange = (value: number) => {
    const newSettings = { ...settings, interval: value }
    saveSettings(newSettings)
  }

  const handleMaxScreenshotsChange = (value: string) => {
    const maxScreenshots = value === "" ? null : parseInt(value)
    const newSettings = { ...settings, maxScreenshots }
    saveSettings(newSettings)
  }

  const handleMaxScreenshotsToggle = (enabled: boolean) => {
    setMaxScreenshotsEnabled(enabled)
    const newSettings = {
      ...settings,
      maxScreenshots: enabled ? settings.maxScreenshots || 100 : null,
    }
    saveSettings(newSettings)
  }

  const handleInitialCountChange = (value: string) => {
    const initialCount = parseInt(value)
    if (!isNaN(initialCount) && initialCount >= 0) {
      const newSettings = { ...settings, initialCount }
      saveSettings(newSettings)
    }
  }

  const handleScreenshotsPathChange = (value: string) => {
    const newSettings = { ...settings, screenshotsPath: value }
    saveSettings(newSettings)
  }

  const handleObjectDetectionToggle = (enabled: boolean) => {
    const newSettings = { ...settings, enableObjectDetection: enabled }
    saveSettings(newSettings)
  }

  const handleConfidenceThresholdChange = (value: number[]) => {
    const newSettings = { ...settings, confidenceThreshold: value[0] }
    saveSettings(newSettings)
  }

  const handleResetSettings = () => {
    saveSettings(defaultSettings)
    setMaxScreenshotsEnabled(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("settings.screenshots.title")}</CardTitle>
        <CardDescription>{t("settings.screenshots.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Интервал между скриншотами */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="interval">{t("settings.screenshots.interval")}</Label>
            <span className="text-muted-foreground text-sm">{settings.interval} сек.</span>
          </div>
          <Slider
            id="interval"
            min={0.1}
            max={10}
            step={0.1}
            value={[settings.interval]}
            onValueChange={(value) => handleIntervalChange(value[0])}
          />
          <p className="text-muted-foreground text-xs">
            {t("settings.screenshots.intervalDescription")}
          </p>
        </div>

        {/* Максимальное количество скриншотов */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxScreenshots">{t("settings.screenshots.maxScreenshots")}</Label>
            <Switch checked={maxScreenshotsEnabled} onCheckedChange={handleMaxScreenshotsToggle} />
          </div>
          {maxScreenshotsEnabled && (
            <Input
              id="maxScreenshots"
              type="number"
              min="1"
              value={settings.maxScreenshots === null ? "" : settings.maxScreenshots}
              onChange={(e) => handleMaxScreenshotsChange(e.target.value)}
              className="w-full"
            />
          )}
          <p className="text-muted-foreground text-xs">
            {t("settings.screenshots.maxScreenshotsDescription")}
          </p>
        </div>

        {/* Количество начальных скриншотов */}
        <div className="space-y-2">
          <Label htmlFor="initialCount">{t("settings.screenshots.initialCount")}</Label>
          <Input
            id="initialCount"
            type="number"
            min="0"
            value={settings.initialCount}
            onChange={(e) => handleInitialCountChange(e.target.value)}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">
            {t("settings.screenshots.initialCountDescription")}
          </p>
        </div>

        {/* Путь для сохранения скриншотов */}
        <div className="space-y-2">
          <Label htmlFor="screenshotsPath">{t("settings.screenshots.path")}</Label>
          <Input
            id="screenshotsPath"
            value={settings.screenshotsPath}
            onChange={(e) => handleScreenshotsPathChange(e.target.value)}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">
            {t("settings.screenshots.pathDescription")}
          </p>
        </div>

        {/* Распознавание объектов */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableObjectDetection">
              {t("settings.screenshots.objectDetection")}
            </Label>
            <Switch
              id="enableObjectDetection"
              checked={settings.enableObjectDetection}
              onCheckedChange={handleObjectDetectionToggle}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {t("settings.screenshots.objectDetectionDescription")}
          </p>
        </div>

        {/* Порог уверенности для детекций */}
        {settings.enableObjectDetection && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidenceThreshold">
                {t("settings.screenshots.confidenceThreshold")}
              </Label>
              <span className="text-muted-foreground text-sm">
                {(settings.confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              id="confidenceThreshold"
              min={0.05}
              max={0.95}
              step={0.05}
              value={[settings.confidenceThreshold]}
              onValueChange={handleConfidenceThresholdChange}
            />
            <p className="text-muted-foreground text-xs">
              {t("settings.screenshots.confidenceThresholdDescription")}
            </p>
          </div>
        )}

        {/* Кнопка сброса настроек */}
        <Button variant="outline" onClick={handleResetSettings}>
          {t("settings.reset")}
        </Button>
      </CardContent>
    </Card>
  )
}
