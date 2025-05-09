import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CaptureDevice {
  deviceId: string
  label: string
}

interface Resolution {
  width: number
  height: number
  label: string
}

interface CameraCaptureDialogProps {
  isOpen: boolean
  onClose: () => void
  onVideoRecorded: (blob: Blob, fileName: string) => void
}

const COMMON_RESOLUTIONS: Resolution[] = [
  { width: 1920, height: 1080, label: "1920x1080" }, // Full HD
  { width: 1280, height: 720, label: "1280x720" }, // HD
  { width: 640, height: 480, label: "640x480" }, // VGA
]

const COMMON_FRAMERATES = [30, 60, 24, 25]

export function CameraCaptureDialog({
  isOpen,
  onClose,
  onVideoRecorded,
}: CameraCaptureDialogProps) {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<CaptureDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [audioDevices, setAudioDevices] = useState<CaptureDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("")
  const [availableResolutions, setAvailableResolutions] = useState<Resolution[]>([])
  const [supportedResolutions, setSupportedResolutions] = useState<Resolution[]>([])
  // Начальное значение будет переопределено при получении возможностей устройства
  const [selectedResolution, setSelectedResolution] = useState<string>("")
  const [frameRate, setFrameRate] = useState<number>(30)
  const [supportedFrameRates, setSupportedFrameRates] = useState<number[]>([])
  const [countdown, setCountdown] = useState<number>(0)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [showCountdown, setShowCountdown] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isDeviceReady, setIsDeviceReady] = useState<boolean>(false)
  const [permissionStatus, setPermissionStatus] = useState<
    "pending" | "granted" | "denied" | "error"
  >("pending")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  // Форматирование времени записи
  const formatRecordingTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Запрашиваем разрешения на доступ к медиа-устройствам
  const requestPermissions = useCallback(async () => {
    try {
      setPermissionStatus("pending")
      setErrorMessage("")

      // Запрашиваем доступ к камере и микрофону, чтобы получить метки устройств
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // После получения доступа останавливаем временный поток
      tempStream.getTracks().forEach((track) => track.stop())

      // Теперь можем получить полный список устройств с названиями
      setPermissionStatus("granted")
      await getDevices()
    } catch (error) {
      console.error("Ошибка при запросе разрешений:", error)
      setPermissionStatus("error")

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          setErrorMessage(
            "Доступ к камере и микрофону запрещен. Пожалуйста, разрешите доступ в настройках браузера.",
          )
          setPermissionStatus("denied")
        } else if (error.name === "NotFoundError") {
          setErrorMessage(
            "Камера или микрофон не найдены. Пожалуйста, подключите устройства и попробуйте снова.",
          )
        } else {
          setErrorMessage(`Ошибка доступа к устройствам: ${error.message}`)
        }
      } else {
        setErrorMessage("Неизвестная ошибка при запросе доступа к устройствам")
      }
    }
  }, [])

  // Получаем поддерживаемые разрешения и частоты кадров
  const getDeviceCapabilities = useCallback(async (deviceId: string) => {
    setIsLoadingCapabilities(true)
    try {
      // Временно запрашиваем поток для определения возможностей
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
        },
      })

      // Получаем трек
      const videoTrack = stream.getVideoTracks()[0]

      if (videoTrack && "getCapabilities" in videoTrack) {
        // Современный подход через getCapabilities
        const capabilities = videoTrack.getCapabilities()
        console.log("Возможности камеры:", capabilities)

        // Получаем разрешения
        const resolutions: Resolution[] = []

        if (capabilities.width && capabilities.height) {
          // Не используем step, вместо этого создаем массив стандартных разрешений
          // и проверяем, какие из них поддерживаются камерой

          // Получаем максимальное разрешение устройства
          const deviceWidthMax = capabilities.width?.max || 1920
          const deviceHeightMax = capabilities.height?.max || 1080

          console.log(`Максимальное разрешение устройства: ${deviceWidthMax}x${deviceHeightMax}`)

          // Проверяем соотношение сторон максимального разрешения
          // Добавляем только если оно близко к стандартному (16:9, 4:3)
          const aspectRatio = deviceWidthMax / deviceHeightMax

          // Проверяем, близко ли соотношение к 16:9 (1.77) или 4:3 (1.33)
          const isStandardRatio =
            Math.abs(aspectRatio - 16 / 9) < 0.1 || // Близко к 16:9
            Math.abs(aspectRatio - 4 / 3) < 0.1 // Близко к 4:3

          if (isStandardRatio) {
            // Добавляем только если соотношение сторон стандартное
            resolutions.push({
              width: deviceWidthMax,
              height: deviceHeightMax,
              label: `${deviceWidthMax}x${deviceHeightMax}`,
            })
          } else {
            console.log(`Пропускаем нестандартное соотношение сторон: ${aspectRatio.toFixed(2)}`)
          }

          // Добавляем стандартные разрешения
          resolutions.push({
            width: 1920,
            height: 1080,
            label: "1920x1080", // Full HD
          })

          resolutions.push({
            width: 1280,
            height: 720,
            label: "1280x720", // HD
          })

          resolutions.push({
            width: 640,
            height: 480,
            label: "640x480", // VGA
          })

          // Максимальное разрешение уже добавлено выше

          // Сортируем разрешения от большего к меньшему
          resolutions.sort((a, b) => b.width * b.height - a.width * a.height)

          // Получаем частоты кадров
          let frameRates: number[] = []
          if (capabilities.frameRate) {
            const frMin = capabilities.frameRate.min
            const frMax = capabilities.frameRate.max

            if (frMin !== undefined && frMax !== undefined) {
              const standard = [24, 25, 30, 50, 60]
              frameRates = standard.filter((fps) => fps >= frMin && fps <= frMax)

              // Добавляем максимальную частоту, если она не стандартная
              const maxFps = Math.floor(frMax)
              if (!frameRates.includes(maxFps)) {
                frameRates.push(maxFps)
              }

              // Сортируем
              frameRates.sort((a, b) => b - a)
            }
          }

          // Сортируем разрешения от большего к меньшему
          const sortedResolutions = [...resolutions].sort((a, b) => {
            // Сравниваем по общему количеству пикселей
            const pixelsA = a.width * a.height
            const pixelsB = b.width * b.height
            return pixelsB - pixelsA
          })

          console.log(
            "Доступные разрешения:",
            sortedResolutions.map((r) => r.label),
          )

          // Устанавливаем отсортированные разрешения
          setSupportedResolutions(sortedResolutions)
          setAvailableResolutions(sortedResolutions)

          // Всегда выбираем максимальное разрешение по умолчанию
          if (sortedResolutions.length > 0) {
            const maxResolution = sortedResolutions[0]
            console.log("Выбрано максимальное разрешение:", maxResolution.label)
            setSelectedResolution(maxResolution.label)
          } else {
            // Если по какой-то причине нет разрешений, используем стандартные
            setAvailableResolutions(COMMON_RESOLUTIONS)
            setSupportedResolutions(COMMON_RESOLUTIONS)
            setSelectedResolution(COMMON_RESOLUTIONS[0].label)
          }

          if (frameRates.length > 0) {
            setSupportedFrameRates(frameRates)

            // Устанавливаем частоту по умолчанию (30 fps или лучшее доступное)
            const defaultFps = frameRates.find((fps) => fps === 30) || frameRates[0]
            setFrameRate(defaultFps)
          } else {
            setSupportedFrameRates(COMMON_FRAMERATES)
          }
        }
      } else {
        // Для старых браузеров используем предопределенные разрешения
        setAvailableResolutions(COMMON_RESOLUTIONS)
        setSupportedFrameRates(COMMON_FRAMERATES)
      }

      // Завершаем поток
      stream.getTracks().forEach((track) => track.stop())
    } catch (error) {
      console.error("Ошибка при получении возможностей устройства:", error)
      // Используем стандартные значения в случае ошибки
      setAvailableResolutions(COMMON_RESOLUTIONS)
      setSupportedFrameRates(COMMON_FRAMERATES)
    } finally {
      setIsLoadingCapabilities(false)
    }
  }, [])

  // Обновляем getDevices, чтобы после получения списка устройств запросить их возможности
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => {
          // Очищаем названия устройств от текста в скобках
          let label =
            device.label ||
            t("timeline.tracks.cameraWithNumber", {
              number: devices.indexOf(device) + 1,
              defaultValue: `Камера ${devices.indexOf(device) + 1}`,
            })
          // Удаляем текст в скобках, если он присутствует
          label = label.replace(/\s*\([^)]*\)\s*$/, "")

          return {
            deviceId: device.deviceId || `camera-${devices.indexOf(device)}`,
            label: label,
          }
        })

      const audioDevices = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => {
          // Очищаем названия устройств от текста в скобках
          let label =
            device.label ||
            t("timeline.tracks.audioWithNumber", {
              number: devices.indexOf(device) + 1,
              defaultValue: `Микрофон ${devices.indexOf(device) + 1}`,
            })
          // Удаляем текст в скобках, если он присутствует
          label = label.replace(/\s*\([^)]*\)\s*$/, "")

          return {
            deviceId: device.deviceId || `mic-${devices.indexOf(device)}`,
            label: label,
          }
        })

      setDevices(videoDevices)
      setAudioDevices(audioDevices)

      console.log("Найдены видео устройства:", videoDevices)
      console.log("Найдены аудио устройства:", audioDevices)

      // Выбираем первое устройство, если еще не выбрано
      let deviceIdToUse = selectedDevice
      if (videoDevices.length > 0 && !selectedDevice) {
        deviceIdToUse = videoDevices[0].deviceId
        setSelectedDevice(deviceIdToUse)
      }

      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId)
      }

      // Запрашиваем возможности выбранного устройства
      if (deviceIdToUse) {
        await getDeviceCapabilities(deviceIdToUse)
      } else {
        // Если нет устройства, используем предопределенные значения
        setAvailableResolutions(COMMON_RESOLUTIONS)
        setSupportedFrameRates(COMMON_FRAMERATES)
      }

      return true
    } catch (error) {
      console.error("Ошибка при получении устройств:", error)
      setErrorMessage("Не удалось получить список устройств")
      return false
    }
  }, [selectedDevice, selectedAudioDevice, getDeviceCapabilities])

  // Инициализация потока с камеры
  const initCamera = useCallback(async () => {
    if (!selectedDevice) {
      console.log("Устройство не выбрано")
      return
    }

    try {
      console.log("Инициализация камеры с устройством:", selectedDevice)

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Извлекаем выбранное разрешение
      let width = 1920
      let height = 1080

      if (selectedResolution) {
        // Извлекаем числа из строки разрешения (например, "1920x1080")
        console.log("Выбранное разрешение для обработки:", selectedResolution)

        const resolutionMatch = selectedResolution.match(/(\d+)x(\d+)/)
        if (resolutionMatch && resolutionMatch.length >= 3) {
          width = parseInt(resolutionMatch[1], 10)
          height = parseInt(resolutionMatch[2], 10)

          // Проверяем соотношение сторон
          const aspectRatio = width / height
          const isStandardRatio =
            Math.abs(aspectRatio - 16 / 9) < 0.1 || // Близко к 16:9
            Math.abs(aspectRatio - 4 / 3) < 0.1 // Близко к 4:3

          if (!isStandardRatio) {
            console.warn(
              `Нестандартное соотношение сторон: ${aspectRatio.toFixed(2)}, используем 16:9`,
            )
            // Используем стандартное разрешение 16:9
            width = 1920
            height = 1080
          } else {
            console.log(`Извлечено разрешение: ${width}x${height}`)
          }
        } else {
          console.warn("Не удалось извлечь разрешение из строки:", selectedResolution)
        }
      } else {
        // Если разрешение не выбрано, используем максимальное из доступных
        if (availableResolutions.length > 0) {
          // Сортируем по убыванию (сначала самые высокие разрешения)
          const sortedResolutions = [...availableResolutions].sort((a, b) => {
            const pixelsA = a.width * a.height
            const pixelsB = b.width * b.height
            return pixelsB - pixelsA
          })

          // Берем максимальное разрешение
          const maxResolution = sortedResolutions[0]
          width = maxResolution.width
          height = maxResolution.height

          console.log("Разрешение не выбрано, используем максимальное:", width, "x", height)

          // Обновляем выбранное разрешение
          setSelectedResolution(maxResolution.label)
        }
      }

      console.log(`Запрашиваем разрешение: ${width}x${height}, частота кадров: ${frameRate}`)

      // Проверяем, что разрешение имеет разумные значения
      if (width < 640 || height < 480) {
        console.warn(
          `Обнаружено слишком низкое разрешение ${width}x${height}, устанавливаем минимальное 640x480`,
        )
        width = 640
        height = 480
      }

      // Настраиваем ограничения для видео потока
      // Используем exact для устройства и ideal для разрешения
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
        },
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
      }

      console.log("Запрашиваем максимальное разрешение:", width, "x", height)

      console.log("Запрашиваем медиа-поток с ограничениями:", constraints)
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log("Поток получен:", stream)
        streamRef.current = stream

        // Получаем информацию о фактическом разрешении из трека
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const settings = videoTrack.getSettings()
          console.log("Фактические настройки трека:", settings)
          if (settings.width && settings.height) {
            console.log(`Фактическое разрешение трека: ${settings.width}x${settings.height}`)
          }
        }
      } catch (error) {
        console.error("Ошибка при получении потока с запрошенным разрешением:", error)

        // Пробуем получить поток без указания разрешения
        console.log("Пробуем получить поток без указания разрешения")
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedDevice },
          },
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
        }

        const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
        console.log("Поток получен с резервными настройками:", stream)
        streamRef.current = stream
      }

      if (videoRef.current && streamRef.current) {
        console.log("Устанавливаем srcObject для видео элемента")
        videoRef.current.srcObject = streamRef.current

        // Добавляем обработчик события loadedmetadata
        videoRef.current.onloadedmetadata = () => {
          console.log("Видео метаданные загружены, начинаем воспроизведение")
          videoRef.current?.play().catch((e) => console.error("Ошибка воспроизведения:", e))

          // Получаем фактическое разрешение видео для логирования
          if (videoRef.current) {
            const actualWidth = videoRef.current.videoWidth
            const actualHeight = videoRef.current.videoHeight
            console.log(`Фактическое разрешение видео: ${actualWidth}x${actualHeight}`)
          }

          setIsDeviceReady(true)
        }

        // Добавляем обработчик ошибок
        videoRef.current.onerror = (e) => {
          console.error("Ошибка видео элемента:", e)
        }
      } else {
        console.error("Ссылка на видео элемент отсутствует")
      }
    } catch (error) {
      console.error("Ошибка при инициализации камеры:", error)
      setIsDeviceReady(false)
    }
  }, [selectedDevice, selectedAudioDevice, selectedResolution, frameRate])

  // Запускаем запись
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []

    const options = { mimeType: "video/webm;codecs=vp9,opus" }
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
    } catch (e) {
      console.error("MediaRecorder не поддерживает данный формат:", e)
      try {
        // Пробуем другой формат
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
          mimeType: "video/webm",
        })
      } catch (e) {
        console.error("MediaRecorder не поддерживается браузером:", e)
        return
      }
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const now = new Date()
      const fileName = `camera_recording_${now.toISOString().replace(/:/g, "-")}.webm`
      onVideoRecorded(blob, fileName)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)

    // Запускаем таймер для отслеживания времени записи
    let seconds = 0
    timerRef.current = window.setInterval(() => {
      seconds++
      setRecordingTime(seconds)
    }, 1000)
  }, [onVideoRecorded])

  // Останавливаем запись
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
    setRecordingTime(0)
  }, [])

  // Начинаем обратный отсчет или сразу запись
  const startCountdown = useCallback(() => {
    if (countdown <= 0) {
      // Если обратный отсчет установлен в 0, сразу начинаем запись
      startRecording()
      return
    }

    // Иначе запускаем обратный отсчет
    setShowCountdown(true)
    let currentCount = countdown

    const timer = setInterval(() => {
      currentCount -= 1
      setCountdown(currentCount)

      if (currentCount <= 0) {
        clearInterval(timer)
        setShowCountdown(false)
        startRecording()
      }
    }, 1000)
  }, [countdown, startRecording])

  // Создаем новую функцию для снимка с веб-камеры
  // const takeScreenshot = useCallback(() => {
  //   if (!videoRef.current || !streamRef.current) return

  //   try {
  //     // Создаем канвас размером с видео
  //     const canvas = document.createElement("canvas")
  //     const video = videoRef.current

  //     // Получаем размер видео с учетом разрешения камеры
  //     const [width, height] = selectedResolution.split("x").map(Number)
  //     canvas.width = width
  //     canvas.height = height

  //     // Рисуем текущий кадр на канвасе
  //     const ctx = canvas.getContext("2d")
  //     if (!ctx) return

  //     ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  //     // Конвертируем канвас в блоб
  //     canvas.toBlob((blob) => {
  //       if (!blob) return

  //       // Создаем имя файла на основе текущего времени
  //       const timestamp = new Date().toISOString().replace(/:/g, "-")
  //       const fileName = `camera_snapshot_${timestamp}.png`

  //       // Создаем ссылку для скачивания
  //       const link = document.createElement("a")
  //       link.href = URL.createObjectURL(blob)
  //       link.download = fileName

  //       // Добавляем невидимую ссылку в DOM, кликаем по ней и удаляем
  //       document.body.appendChild(link)
  //       link.click()

  //       // Небольшая задержка перед удалением ссылки
  //       setTimeout(() => {
  //         document.body.removeChild(link)
  //         URL.revokeObjectURL(link.href)
  //       }, 100)
  //     }, "image/png")
  //   } catch (error) {
  //     console.error("Ошибка при создании снимка:", error)
  //   }
  // }, [selectedResolution])

  // Обработчик закрытия модального окна
  const handleClose = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsDeviceReady(false)
    onClose()
  }, [isRecording, stopRecording, onClose])

  // Запрашиваем устройства и запускаем камеру при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      requestPermissions()
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      setIsDeviceReady(false)
    }
  }, [isOpen, requestPermissions])

  // Инициализируем камеру при изменении устройства или разрешения
  useEffect(() => {
    if (isOpen && selectedDevice) {
      initCamera()
    }
  }, [isOpen, selectedDevice, selectedResolution, frameRate, initCamera, selectedAudioDevice])

  // Обновляем useEffect для повторного получения возможностей при смене устройства
  useEffect(() => {
    if (selectedDevice && permissionStatus === "granted") {
      getDeviceCapabilities(selectedDevice)
    }
  }, [selectedDevice, permissionStatus, getDeviceCapabilities])

  // Очищаем ресурсы при размонтировании
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-full max-w-[70%] overflow-hidden border-[#333] bg-[#18181B] p-0 text-white"
        aria-describedby="camera-capture-description"
      >
        <DialogTitle className="border-b border-[#333] p-4 text-lg font-semibold">
          {t("dialogs.cameraCapture.title")}
        </DialogTitle>

        <div className="p-6">
          {/* Отображаем ошибки и статус разрешений */}
          {permissionStatus === "pending" && (
            <div className="mb-4 text-center text-sm">
              {t("dialogs.cameraCapture.permissionDenied")}
            </div>
          )}

          {permissionStatus === "denied" && (
            <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-100">
              {errorMessage}
              <div className="mt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={requestPermissions}>
                  {t("dialogs.cameraCapture.retryRequest")}
                </Button>
              </div>
            </div>
          )}

          {permissionStatus === "error" && (
            <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-100">
              {errorMessage}
              <div className="mt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={requestPermissions}>
                  {t("dialogs.cameraCapture.retry")}
                </Button>
              </div>
            </div>
          )}

          {permissionStatus === "granted" && (
            <>


              {/* Двухколоночная разметка: видео слева, настройки справа */}
              <div className="flex flex-col gap-8 md:flex-row">
                {/* Левая колонка - превью видео */}
                <div className="md:w-3/5">
                  {/* Предпросмотр видео */}
                  <div className="relative flex h-[450px] w-full items-center justify-center rounded-md border border-gray-800 bg-black shadow-lg">
                    {!isDeviceReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        {t("dialogs.cameraCapture.initializingCamera")}
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      className={`${!isDeviceReady ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
                    />
                    {showCountdown && countdown > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-6xl font-bold text-white">
                        {countdown}
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая колонка - настройки и кнопки */}
                <div className="flex flex-col md:w-2/5">
                  {/* Настройки устройств */}
                  <div className="mb-8 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5">
                    <div className="text-sm text-gray-300">
                      {t("dialogs.cameraCapture.device")}:
                    </div>
                    <Select
                      value={selectedDevice}
                      onValueChange={setSelectedDevice}
                      disabled={isRecording || isLoadingCapabilities}
                    >
                      <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full border-[#444] bg-[#222]">
                        {devices.map(
                          (device) =>
                            device.deviceId && (
                              <SelectItem
                                key={device.deviceId}
                                value={device.deviceId}
                                className="text-white hover:bg-[#333] focus:bg-[#333]"
                              >
                                {device.label}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>

                    <div className="text-sm text-gray-300">
                      {t("dialogs.cameraCapture.audioDevice")}:
                    </div>
                    <Select
                      value={selectedAudioDevice}
                      onValueChange={setSelectedAudioDevice}
                      disabled={isRecording || isLoadingCapabilities}
                    >
                      <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full border-[#444] bg-[#222]">
                        {audioDevices.map(
                          (device) =>
                            device.deviceId && (
                              <SelectItem
                                key={device.deviceId}
                                value={device.deviceId}
                                className="text-white hover:bg-[#333] focus:bg-[#333]"
                              >
                                {device.label}
                              </SelectItem>
                            ),
                        )}
                      </SelectContent>
                    </Select>

                    <div className="text-sm text-gray-300">
                      {t("dialogs.cameraCapture.resolution")}:
                    </div>
                    <div>
                      {isLoadingCapabilities ? (
                        <div className="flex items-center text-xs text-gray-400">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0CC] border-t-transparent"></div>
                          {t("dialogs.cameraCapture.determiningCapabilities")}
                        </div>
                      ) : (
                        <Select
                          value={selectedResolution}
                          onValueChange={setSelectedResolution}
                          disabled={isRecording}
                        >
                          <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 w-full overflow-y-auto border-[#444] bg-[#222]">
                            {availableResolutions.map(
                              (res) =>
                                res.label && (
                                  <SelectItem
                                    key={res.label}
                                    value={res.label}
                                    className="text-white hover:bg-[#333] focus:bg-[#333]"
                                  >
                                    {res.label}
                                  </SelectItem>
                                ),
                            )}
                          </SelectContent>
                        </Select>
                      )}

                      {supportedResolutions.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          {t("dialogs.cameraCapture.supportedResolutions", {
                            count: supportedResolutions.length,
                          })}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-300">
                      {t("dialogs.cameraCapture.frameRate")}:
                    </div>
                    <div>
                      {isLoadingCapabilities ? (
                        <div className="flex items-center text-xs text-gray-400">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0CC] border-t-transparent"></div>
                          {t("dialogs.cameraCapture.determiningCapabilities")}
                        </div>
                      ) : (
                        <Select
                          value={frameRate.toString()}
                          onValueChange={(value) => setFrameRate(parseInt(value))}
                          disabled={isRecording}
                        >
                          <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="w-full border-[#444] bg-[#222]">
                            {supportedFrameRates.map((fps) => (
                              <SelectItem
                                key={fps.toString()}
                                value={fps.toString()}
                                className="text-white hover:bg-[#333] focus:bg-[#333]"
                              >
                                {fps} fps
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {supportedFrameRates.length > 0 && supportedFrameRates.length < 10 && (
                        <div className="mt-1 text-xs text-gray-400">
                          {t("dialogs.cameraCapture.supportedFrameRates", {
                            frameRates: supportedFrameRates.join(", "),
                          })}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-300">
                      {t("dialogs.cameraCapture.countdown")}:
                    </div>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        value={countdown}
                        onChange={(e) => setCountdown(parseInt(e.target.value) || 3)}
                        min={1}
                        max={10}
                        className="mr-2 w-20 border-[#444] bg-[#222] text-center"
                        disabled={isRecording}
                      />
                      <span className="text-sm text-gray-300">
                        {t("dialogs.cameraCapture.seconds")}
                      </span>
                    </div>
                  </div>

                  {/* Запись */}
                  <div className="mt-auto flex flex-col items-center pt-4">
                    <div className="mb-4 flex items-center justify-center gap-6">
                      {!isRecording ? (
                        <Button
                          className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                          onClick={startCountdown}
                          disabled={!isDeviceReady}
                          title={t("dialogs.cameraCapture.startRecording")}
                          aria-label={t("dialogs.cameraCapture.startRecording")}
                        >
                          <div className="h-5 w-5 animate-pulse rounded-full bg-white" />
                        </Button>
                      ) : (
                        <Button
                          className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                          onClick={stopRecording}
                          title={t("dialogs.cameraCapture.stopRecording")}
                          aria-label={t("dialogs.cameraCapture.stopRecording")}
                        >
                          <div className="h-5 w-5 rounded bg-white" />
                        </Button>
                      )}
                    </div>
                    <div className="font-mono text-lg font-semibold">
                      {t("dialogs.cameraCapture.recordingTime")}{" "}
                      {formatRecordingTime(recordingTime)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-[#333] p-4">
          <Button
            className="bg-[#0CC] px-6 font-medium text-black hover:bg-[#0AA]"
            onClick={handleClose}
          >
            {t("common.ok")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
