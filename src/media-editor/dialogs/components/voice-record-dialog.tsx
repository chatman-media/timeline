import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

interface VoiceRecordDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function VoiceRecordDialog({
  isOpen,
  onClose,
}: VoiceRecordDialogProps) {
  const { t } = useTranslation()
  const [audioDevices, setAudioDevices] = useState<CaptureDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("")
  const [countdown, setCountdown] = useState<number>(3)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [showCountdown, setShowCountdown] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isDeviceReady, setIsDeviceReady] = useState<boolean>(false)
  const [permissionStatus, setPermissionStatus] = useState<
    "pending" | "granted" | "denied" | "error"
  >("pending")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [savePath, setSavePath] = useState<string>("")

  // Refs для управления потоком и записью
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Запрашиваем разрешения на доступ к медиа-устройствам
  const requestPermissions = useCallback(async () => {
    try {
      setPermissionStatus("pending")
      setErrorMessage("")

      // Запрашиваем доступ к микрофону
      const tempStream = await navigator.mediaDevices.getUserMedia({
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
      setErrorMessage(
        t("dialogs.voiceRecord.permissionError", {
          defaultValue: "Не удалось получить доступ к микрофону. Пожалуйста, проверьте настройки разрешений в браузере.",
        }),
      )
    }
  }, [t])

  // Получаем список доступных аудио устройств
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioDevices = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => {
          // Очищаем названия устройств от текста в скобках
          let label =
            device.label ||
            t("dialogs.voiceRecord.microphoneWithNumber", {
              number: devices.indexOf(device) + 1,
              defaultValue: `Микрофон ${devices.indexOf(device) + 1}`,
            })
          // Удаляем текст в скобках, если он присутствует
          label = label.replace(/\s*\([^)]*\)\s*$/, "")

          return {
            deviceId: device.deviceId || `microphone-${devices.indexOf(device)}`,
            label: label,
          }
        })

      setAudioDevices(audioDevices)

      console.log("Найдены аудио устройства:", audioDevices)

      // Выбираем первое устройство, если еще не выбрано
      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId)
      }

      return true
    } catch (error) {
      console.error("Ошибка при получении устройств:", error)
      setErrorMessage("Не удалось получить список устройств")
      return false
    }
  }, [selectedAudioDevice, t])

  // Инициализация потока с микрофона
  const initAudio = useCallback(async () => {
    if (!selectedAudioDevice) {
      console.log("Устройство не выбрано")
      return
    }

    try {
      console.log("Инициализация микрофона с устройством:", selectedAudioDevice)

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Настраиваем ограничения для аудио потока
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: { exact: selectedAudioDevice },
        },
      }

      // Запрашиваем поток с микрофона
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Создаем аудио элемент для предпросмотра
      if (audioRef.current) {
        audioRef.current.srcObject = stream
        audioRef.current.muted = isMuted
      }

      setIsDeviceReady(true)
      console.log("Микрофон инициализирован успешно")
    } catch (error) {
      console.error("Ошибка при инициализации микрофона:", error)
      setErrorMessage(
        t("dialogs.voiceRecord.initError", {
          defaultValue: "Не удалось инициализировать микрофон. Пожалуйста, проверьте настройки и разрешения.",
        }),
      )
      setIsDeviceReady(false)
    }
  }, [selectedAudioDevice, isMuted, t])

  // Запускаем обратный отсчет перед записью
  const startCountdown = useCallback(() => {
    if (!isDeviceReady) return

    setShowCountdown(true)
    let count = countdown
    setCountdown(count)

    countdownTimerRef.current = window.setInterval(() => {
      count--
      setCountdown(count)

      if (count <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
        setShowCountdown(false)
        startRecording()
      }
    }, 1000)
  }, [isDeviceReady, countdown])

  // Функция для отправки аудиозаписи на сервер
  const saveAudioToServer = useCallback(async (blob: Blob, fileName: string) => {
    try {
      // Создаем объект FormData для отправки файла
      const formData = new FormData()
      formData.append("file", blob, fileName)
      formData.append("fileName", fileName)

      // Отправляем запрос на сервер
      const response = await fetch("/api/save-audio-recording", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Аудиозапись успешно сохранена:", data)

      // Закрываем диалог после успешного сохранения
      onClose()
    } catch (error) {
      console.error("Ошибка при сохранении аудиозаписи:", error)
      // Здесь можно добавить отображение ошибки пользователю
    }
  }, [onClose])

  // Запускаем запись
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []

    const options = { mimeType: "audio/webm" }
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
    } catch (e) {
      console.error("MediaRecorder не поддерживает данный формат:", e)
      try {
        // Пробуем другой формат
        mediaRecorderRef.current = new MediaRecorder(streamRef.current)
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
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const now = new Date()
      const fileName = `voice_recording_${now.toISOString().replace(/:/g, "-")}.webm`
      saveAudioToServer(blob, fileName)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)

    // Запускаем таймер для отслеживания времени записи
    let seconds = 0
    timerRef.current = window.setInterval(() => {
      seconds++
      setRecordingTime(seconds)
    }, 1000)
  }, [saveAudioToServer])

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

  // Форматируем время записи в формат MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Обработчик закрытия модального окна
  const handleClose = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    setIsDeviceReady(false)
    onClose()
  }, [isRecording, stopRecording, onClose])

  // Запрашиваем устройства и запускаем микрофон при открытии модального окна
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

  // Инициализируем микрофон при изменении устройства
  useEffect(() => {
    if (isOpen && selectedAudioDevice) {
      initAudio()
    }
  }, [isOpen, selectedAudioDevice, initAudio])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-full max-w-[500px] overflow-hidden border-[#333] bg-[#18181B] p-0 text-white"
        aria-describedby="voice-record-description"
      >
        <DialogTitle className="border-b border-[#333] p-4 text-lg font-semibold">
          {t("dialogs.voiceRecord.title", { defaultValue: "Запись аудио" })}
        </DialogTitle>

        <div className="p-6">
          {/* Отображаем ошибки и статус разрешений */}
          {permissionStatus === "pending" && (
            <div className="mb-4 text-center text-sm">
              {t("dialogs.voiceRecord.requestingPermissions", { defaultValue: "Запрашиваем разрешения..." })}
            </div>
          )}

          {permissionStatus === "denied" && (
            <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-100">
              {errorMessage}
              <div className="mt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={requestPermissions}>
                  {t("dialogs.voiceRecord.retryRequest", { defaultValue: "Повторить запрос" })}
                </Button>
              </div>
            </div>
          )}

          {permissionStatus === "error" && (
            <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-100">
              {errorMessage}
              <div className="mt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={requestPermissions}>
                  {t("dialogs.voiceRecord.retryRequest", { defaultValue: "Повторить запрос" })}
                </Button>
              </div>
            </div>
          )}

          {/* Основной контент */}
          {permissionStatus === "granted" && (
            <>
              {/* Аудио элемент для предпросмотра (скрытый) */}
              <audio ref={audioRef} autoPlay muted={isMuted} />

              {/* Настройки устройств */}
              <div className="mb-8 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5">
                <div className="text-sm text-gray-300">
                  {t("dialogs.voiceRecord.device", { defaultValue: "Устройство" })}:
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedAudioDevice}
                    onValueChange={setSelectedAudioDevice}
                    disabled={isRecording}
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-[#444] bg-[#222] hover:bg-[#333]"
                    onClick={getDevices}
                    title={t("dialogs.voiceRecord.refreshDevices", { defaultValue: "Обновить устройства" })}
                  >
                    <RefreshCw size={16} />
                  </Button>
                </div>

                <div className="text-sm text-gray-300">
                  {t("dialogs.voiceRecord.savePath", { defaultValue: "Сохранить в" })}:
                </div>
                <Input
                  value={savePath}
                  onChange={(e) => setSavePath(e.target.value)}
                  className="border-[#444] bg-[#222] text-white focus:border-[#666]"
                  placeholder="/Users/username/Movies"
                  disabled={isRecording}
                />

                <div className="text-sm text-gray-300">
                  {t("dialogs.voiceRecord.countdown", { defaultValue: "Обратный отсчет" })}:
                </div>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={countdown}
                  onChange={(e) => setCountdown(parseInt(e.target.value) || 0)}
                  className="w-20 border-[#444] bg-[#222] text-white focus:border-[#666]"
                  disabled={isRecording}
                />
              </div>

              {/* Запись */}
              <div className="mt-auto flex flex-col items-center pt-4">
                {/* Отображаем обратный отсчет */}
                {showCountdown && (
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-4xl font-bold">
                    {countdown}
                  </div>
                )}

                {/* Отображаем время записи */}
                {isRecording && (
                  <div className="mb-4 text-center">
                    <div className="text-lg font-semibold">
                      {t("dialogs.voiceRecord.recordingTime", { defaultValue: "Время записи" })}{" "}
                      {formatTime(recordingTime)}
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-700">
                      <div
                        className="h-2 bg-red-600"
                        style={{ width: `${Math.min(100, (recordingTime / 300) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-center gap-6">
                  {!isRecording ? (
                    <Button
                      className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                      onClick={startCountdown}
                      disabled={!isDeviceReady}
                      title={t("dialogs.voiceRecord.startRecording", { defaultValue: "Начать запись" })}
                      aria-label={t("dialogs.voiceRecord.startRecording", { defaultValue: "Начать запись" })}
                    >
                      <div className="h-5 w-5 animate-pulse rounded-full bg-white" />
                    </Button>
                  ) : (
                    <Button
                      className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                      onClick={stopRecording}
                      title={t("dialogs.voiceRecord.stopRecording", { defaultValue: "Остановить запись" })}
                      aria-label={t("dialogs.voiceRecord.stopRecording", { defaultValue: "Остановить запись" })}
                    >
                      <div className="h-5 w-5 rounded bg-white" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 text-center text-xs text-gray-400">
                  {t("dialogs.voiceRecord.hint", {
                    defaultValue:
                      "Нажмите кнопку записи, чтобы начать. Запись автоматически добавится в медиатеку.",
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
