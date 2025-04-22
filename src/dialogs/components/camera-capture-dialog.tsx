import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  { width: 1920, height: 1080, label: "1920x1080" },
  { width: 1280, height: 720, label: "1280x720" },
  { width: 640, height: 480, label: "640x480" },
  { width: 320, height: 240, label: "320x240" },
]

const COMMON_FRAMERATES = [30, 60, 24, 25]

export function CameraCaptureDialog({
  isOpen,
  onClose,
  onVideoRecorded,
}: CameraCaptureDialogProps) {
  const [devices, setDevices] = useState<CaptureDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [audioDevices, setAudioDevices] = useState<CaptureDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("")
  const [availableResolutions, setAvailableResolutions] = useState<Resolution[]>([])
  const [supportedResolutions, setSupportedResolutions] = useState<Resolution[]>([])
  const [selectedResolution, setSelectedResolution] = useState<string>("1920x1080")
  const [frameRate, setFrameRate] = useState<number>(30)
  const [supportedFrameRates, setSupportedFrameRates] = useState<number[]>([])
  const [countdown, setCountdown] = useState<number>(3)
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

          // Создаем пары разрешений в стандартных соотношениях сторон
          // Обычно камеры поддерживают 16:9, 4:3, 1:1
          const standardResolutions = [
            { width: 320, height: 240 }, // 4:3
            { width: 640, height: 480 }, // 4:3
            { width: 640, height: 360 }, // 16:9
            { width: 1280, height: 720 }, // 16:9
            { width: 1920, height: 1080 }, // 16:9
            { width: 3840, height: 2160 }, // 16:9 (4K)
          ]

          // Проверяем, какие из стандартных разрешений поддерживаются
          standardResolutions.forEach((res) => {
            // Проверяем наличие свойств max и min перед использованием
            const widthMax = capabilities.width?.max
            const widthMin = capabilities.width?.min
            const heightMax = capabilities.height?.max
            const heightMin = capabilities.height?.min

            if (
              (widthMax === undefined || res.width <= widthMax) &&
              (widthMin === undefined || res.width >= widthMin) &&
              (heightMax === undefined || res.height <= heightMax) &&
              (heightMin === undefined || res.height >= heightMin)
            ) {
              resolutions.push({
                width: res.width,
                height: res.height,
                label: `${res.width}x${res.height}`,
              })
            }
          })

          // Если есть высокие разрешения, добавляем их
          const widthMax = capabilities.width?.max
          const heightMax = capabilities.height?.max

          if (widthMax && heightMax && (widthMax > 1920 || heightMax > 1080)) {
            // Проверяем поддержку 4K
            if (widthMax >= 3840 && heightMax >= 2160) {
              const found = resolutions.find((r) => r.width === 3840 && r.height === 2160)
              if (!found) {
                resolutions.push({
                  width: 3840,
                  height: 2160,
                  label: "3840x2160 (4K UHD)",
                })
              }
            }

            // Добавляем максимальное разрешение устройства
            // Проверяем, чтобы не дублировать уже добавленные разрешения
            const maxResExists = resolutions.some(
              (r) => r.width === widthMax && r.height === heightMax,
            )

            if (!maxResExists) {
              resolutions.push({
                width: widthMax,
                height: heightMax,
                label: `${widthMax}x${heightMax} (Макс.)`,
              })
            }
          }

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

          if (resolutions.length > 0) {
            setSupportedResolutions(resolutions)
            setAvailableResolutions(resolutions)

            // Устанавливаем разрешение по умолчанию (HD или лучшее доступное)
            const hdResolution = resolutions.find((r) => r.width === 1280 && r.height === 720)
            const fullHdResolution = resolutions.find((r) => r.width === 1920 && r.height === 1080)

            if (fullHdResolution) {
              setSelectedResolution(fullHdResolution.label)
            } else if (hdResolution) {
              setSelectedResolution(hdResolution.label)
            } else if (resolutions.length > 0) {
              setSelectedResolution(resolutions[0].label)
            }
          } else {
            setAvailableResolutions(COMMON_RESOLUTIONS)
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
          let label = device.label || `Камера ${devices.indexOf(device) + 1}`
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
          let label = device.label || `Микрофон ${devices.indexOf(device) + 1}`
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
    if (!selectedDevice) return

    try {
      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Извлекаем выбранное разрешение
      const [width, height] = selectedResolution.split("x").map(Number)

      // Настраиваем ограничения для видео потока
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
        },
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsDeviceReady(true)
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

  // Начинаем обратный отсчет
  const startCountdown = useCallback(() => {
    setShowCountdown(true)
    setCountdown(3)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowCountdown(false)
          startRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [startRecording])

  // Создаем новую функцию для снимка с веб-камеры
  const takeScreenshot = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return

    try {
      // Создаем канвас размером с видео
      const canvas = document.createElement("canvas")
      const video = videoRef.current

      // Получаем размер видео с учетом разрешения камеры
      const [width, height] = selectedResolution.split("x").map(Number)
      canvas.width = width
      canvas.height = height

      // Рисуем текущий кадр на канвасе
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Конвертируем канвас в блоб
      canvas.toBlob((blob) => {
        if (!blob) return

        // Создаем имя файла на основе текущего времени
        const timestamp = new Date().toISOString().replace(/:/g, "-")
        const fileName = `camera_snapshot_${timestamp}.png`

        // Создаем ссылку для скачивания
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = fileName

        // Добавляем невидимую ссылку в DOM, кликаем по ней и удаляем
        document.body.appendChild(link)
        link.click()

        // Небольшая задержка перед удалением ссылки
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(link.href)
        }, 100)
      }, "image/png")
    } catch (error) {
      console.error("Ошибка при создании снимка:", error)
    }
  }, [selectedResolution])

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
      <DialogContent className="overflow-hidden border-[#333] bg-[#18181B] p-0 text-white sm:max-w-[500px]">
        <div className="flex items-center justify-between border-b border-[#333] p-4">
          <h2 className="text-lg font-semibold">Захват видео</h2>
        </div>

        <div className="p-4">
          {/* Отображаем ошибки и статус разрешений */}
          {permissionStatus === "pending" && (
            <div className="mb-4 text-center text-sm">
              Запрашиваем доступ к камере и микрофону...
            </div>
          )}

          {permissionStatus === "denied" && (
            <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-100">
              {errorMessage}
              <div className="mt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={requestPermissions}>
                  Повторить запрос
                </Button>
              </div>
            </div>
          )}

          {permissionStatus === "error" && (
            <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-100">
              {errorMessage}
              <div className="mt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={requestPermissions}>
                  Повторить
                </Button>
              </div>
            </div>
          )}

          {permissionStatus === "granted" && (
            <>
              <div className="mb-4 text-sm">Запись с веб-камеры</div>

              {/* Предпросмотр видео */}
              <div className="relative mx-auto mb-6 flex h-[320px] w-full max-w-[240px] items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-black">
                {!isDeviceReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Инициализация камеры...
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${!isDeviceReady ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
                />
                {showCountdown && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-6xl font-bold text-white">
                    {countdown}
                  </div>
                )}
              </div>

              {/* Настройки устройств */}
              <div className="mb-6 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4">
                <div className="text-sm text-gray-300">Устройство:</div>
                <Select
                  value={selectedDevice}
                  onValueChange={setSelectedDevice}
                  disabled={isRecording || isLoadingCapabilities}
                >
                  <SelectTrigger className="border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#444] bg-[#222]">
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

                <div className="text-sm text-gray-300">Аудио:</div>
                <Select
                  value={selectedAudioDevice}
                  onValueChange={setSelectedAudioDevice}
                  disabled={isRecording || isLoadingCapabilities}
                >
                  <SelectTrigger className="border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#444] bg-[#222]">
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

                <div className="text-sm text-gray-300">Разрешение:</div>
                <div>
                  {isLoadingCapabilities ? (
                    <div className="flex items-center text-xs text-gray-400">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0CC] border-t-transparent"></div>
                      Определяем возможности...
                    </div>
                  ) : (
                    <Select
                      value={selectedResolution}
                      onValueChange={setSelectedResolution}
                      disabled={isRecording}
                    >
                      <SelectTrigger className="border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-56 overflow-y-auto border-[#444] bg-[#222]">
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
                      Поддерживается: {supportedResolutions.length} разрешений
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-300">Частота кадров:</div>
                <div>
                  {isLoadingCapabilities ? (
                    <div className="flex items-center text-xs text-gray-400">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0CC] border-t-transparent"></div>
                      Определяем возможности...
                    </div>
                  ) : (
                    <Select
                      value={frameRate.toString()}
                      onValueChange={(value) => setFrameRate(parseInt(value))}
                      disabled={isRecording}
                    >
                      <SelectTrigger className="border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#444] bg-[#222]">
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
                      Поддерживается: {supportedFrameRates.join(", ")} fps
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-300">Обратный отсчет:</div>
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={countdown}
                    onChange={(e) => setCountdown(parseInt(e.target.value) || 3)}
                    min={1}
                    max={10}
                    className="mr-2 w-16 border-[#444] bg-[#222] text-center"
                    disabled={isRecording}
                  />
                  <span className="text-sm text-gray-300">сек</span>
                </div>
              </div>

              {/* Запись */}
              <div className="flex flex-col items-center">
                <div className="mb-4 flex items-center justify-center gap-6">
                  {!isRecording ? (
                    <Button
                      className="mb-0 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-red-500 hover:bg-red-600"
                      onClick={startCountdown}
                      disabled={!isDeviceReady}
                    >
                      <div className="h-6 w-6 animate-pulse rounded-full bg-white" />
                    </Button>
                  ) : (
                    <Button
                      className="mb-0 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-red-500 hover:bg-red-600"
                      onClick={stopRecording}
                    >
                      <div className="h-6 w-6 rounded bg-white" />
                    </Button>
                  )}
                </div>
                <div className="font-mono text-xl">
                  Время записи: {formatRecordingTime(recordingTime)}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-[#333] p-4">
          <Button className="bg-[#0CC] text-black hover:bg-[#0AA]" onClick={handleClose}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
