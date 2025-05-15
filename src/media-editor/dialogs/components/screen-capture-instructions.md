# Инструкции по реализации записи экрана и камеры

## Требования

1. Добавить возможность записи экрана в существующий компонент записи камеры
2. Отображать камеру и экран рядом друг с другом (не картинка в картинке)
3. Записывать камеру и экран в отдельные файлы

## Шаги реализации

### 1. Добавить новые состояния и ссылки

```tsx
// Добавить новые состояния
const [captureMode, setCaptureMode] = useState<"camera" | "screen">("camera")
const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
const [selectedScreenSource, setSelectedScreenSource] = useState<string>("screen:0")
const [includeAudio, setIncludeAudio] = useState<boolean>(true)
const [includeCamera, setIncludeCamera] = useState<boolean>(true)
const [recordBothStreams, setRecordBothStreams] = useState<boolean>(true)

// Добавить новые ссылки
const cameraVideoRef = useRef<HTMLVideoElement>(null)
const cameraStreamRef = useRef<MediaStream | null>(null)
const cameraRecorderRef = useRef<MediaRecorder | null>(null)
const cameraChunksRef = useRef<Blob[]>([])
```

### 2. Добавить функцию для получения источников экрана

```tsx
// Получение доступных источников экрана
const getScreenSources = useCallback(async () => {
  try {
    // Получаем список доступных экранов
    const sources = await navigator.mediaDevices.getDisplayMedia({ video: true })

    // Останавливаем поток, так как нам нужны только метаданные
    sources.getTracks().forEach((track) => track.stop())

    // Добавляем основной экран
    const screenSources = [
      { id: "screen:0", label: t("dialogs.screenCapture.entireScreen", "Entire Screen") },
    ]

    setScreenSources(screenSources)
    return true
  } catch (error) {
    console.error("Error getting screen sources:", error)
    return false
  }
}, [t])
```

### 3. Создать функцию инициализации экрана

```tsx
// Инициализация потока с экрана
const initScreen = useCallback(async () => {
  try {
    console.log("Initializing screen capture")

    // Останавливаем предыдущий поток, если есть
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Запрашиваем доступ к экрану
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { ideal: frameRate },
      },
      audio: includeAudio,
    })

    // Получаем видеотрек для логирования информации
    const videoTrack = screenStream.getVideoTracks()[0]
    if (videoTrack) {
      console.log("Screen video track:", videoTrack.getSettings())
    }

    // Если включена опция камеры
    if (includeCamera && selectedDevice) {
      try {
        console.log("Инициализируем камеру для записи экрана")

        // Получаем поток с камеры
        const cameraConstraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedDevice },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: frameRate },
          },
          audio: false, // Аудио уже получаем из экрана, если нужно
        }

        const cameraStream = await navigator.mediaDevices.getUserMedia(cameraConstraints)
        console.log("Поток камеры получен:", cameraStream)

        // Сохраняем поток камеры отдельно
        cameraStreamRef.current = cameraStream

        // Основной поток - экран
        streamRef.current = screenStream
      } catch (error) {
        console.error("Ошибка при инициализации камеры:", error)
        // Если не удалось получить камеру, продолжаем только с экраном
        streamRef.current = screenStream
      }
    } else {
      // Если камера не нужна, используем только экран
      streamRef.current = screenStream
    }

    return true
  } catch (error) {
    console.error("Error initializing screen capture:", error)
    return false
  }
}, [includeAudio, includeCamera, selectedDevice, frameRate])
```

### 4. Создать общую функцию инициализации медиа-потока

```tsx
// Общая функция инициализации медиа-потока
const initMediaStream = useCallback(async () => {
  try {
    setIsDeviceReady(false)

    // В зависимости от режима, инициализируем камеру или экран
    let success = false
    if (captureMode === "camera") {
      success = await initCamera()
    } else {
      success = await initScreen()
    }

    if (!success) {
      setIsDeviceReady(false)
      return false
    }

    // Устанавливаем потоки для видеоэлементов
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.muted = true

      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => console.error("Ошибка воспроизведения:", e))
        setIsDeviceReady(true)
      }
    }

    // Если у нас режим экрана с камерой, настраиваем элемент камеры
    if (
      captureMode === "screen" &&
      includeCamera &&
      cameraStreamRef.current &&
      cameraVideoRef.current
    ) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current
      cameraVideoRef.current.muted = true

      cameraVideoRef.current.onloadedmetadata = () => {
        cameraVideoRef.current
          ?.play()
          .catch((e) => console.error("Ошибка воспроизведения камеры:", e))
      }
    }

    return true
  } catch (error) {
    console.error(`Error initializing ${captureMode}:`, error)
    setIsDeviceReady(false)
    return false
  }
}, [captureMode, initCamera, initScreen, includeCamera])
```

### 5. Обновить функцию startRecording для записи обоих потоков

```tsx
// Запускаем запись
const startRecording = useCallback(() => {
  if (!streamRef.current) return

  chunksRef.current = []

  // Если записываем оба потока, инициализируем второй рекордер
  if (recordBothStreams && cameraStreamRef.current) {
    cameraChunksRef.current = []
  }

  const options = { mimeType: "video/webm;codecs=vp9,opus" }

  // Инициализируем основной рекордер (экран или камера)
  try {
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
  } catch (e) {
    console.error("MediaRecorder не поддерживает данный формат:", e)
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: "video/webm" })
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

  // Если записываем оба потока, инициализируем рекордер для камеры
  if (recordBothStreams && cameraStreamRef.current) {
    try {
      cameraRecorderRef.current = new MediaRecorder(cameraStreamRef.current, options)
    } catch (e) {
      console.error("MediaRecorder для камеры не поддерживает данный формат:", e)
      try {
        cameraRecorderRef.current = new MediaRecorder(cameraStreamRef.current, {
          mimeType: "video/webm",
        })
      } catch (e) {
        console.error("MediaRecorder для камеры не поддерживается браузером:", e)
      }
    }

    if (cameraRecorderRef.current) {
      cameraRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          cameraChunksRef.current.push(event.data)
        }
      }

      cameraRecorderRef.current.onstop = () => {
        if (cameraChunksRef.current.length > 0) {
          const cameraBlob = new Blob(cameraChunksRef.current, { type: "video/webm" })
          const now = new Date()
          const cameraFileName = `camera_only_recording_${now.toISOString().replace(/:/g, "-")}.webm`

          // Сохраняем видео с камеры
          onVideoRecorded(cameraBlob, cameraFileName)
        }
      }
    }
  }

  mediaRecorderRef.current.onstop = () => {
    const blob = new Blob(chunksRef.current, { type: "video/webm" })
    const now = new Date()
    let prefix = captureMode === "camera" ? "camera" : "screen"

    const fileName = `${prefix}_recording_${now.toISOString().replace(/:/g, "-")}.webm`
    onVideoRecorded(blob, fileName)

    // Если записываем оба потока, останавливаем рекордер камеры
    if (
      recordBothStreams &&
      cameraRecorderRef.current &&
      cameraRecorderRef.current.state !== "inactive"
    ) {
      cameraRecorderRef.current.stop()
    }
  }

  // Запускаем основной рекордер
  mediaRecorderRef.current.start()

  // Запускаем рекордер камеры, если нужно
  if (recordBothStreams && cameraRecorderRef.current) {
    cameraRecorderRef.current.start()
  }

  setIsRecording(true)

  // Запускаем таймер для отслеживания времени записи
  let seconds = 0
  timerRef.current = window.setInterval(() => {
    seconds++
    setRecordingTime(seconds)
  }, 1000)
}, [onVideoRecorded, recordBothStreams, captureMode, includeCamera])
```

### 6. Обновить JSX для отображения камеры и экрана рядом

```tsx
{
  isDeviceReady && (
    <>
      {captureMode === "camera" ? (
        /* Только камера */
        <div className="relative flex h-[450px] w-full items-center justify-center rounded-md border border-gray-800 bg-black shadow-lg">
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
            className="transition-opacity duration-300"
          />
        </div>
      ) : (
        /* Экран и камера рядом */
        <div className="flex h-[450px] w-full flex-col gap-2">
          {/* Экран */}
          <div className="relative flex h-[300px] w-full items-center justify-center rounded-md border border-gray-800 bg-black shadow-lg">
            <div className="absolute top-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
              {t("dialogs.screenCapture.screen", "Screen")}
            </div>
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
              className="transition-opacity duration-300"
            />
          </div>

          {/* Камера */}
          {includeCamera && (
            <div className="relative flex h-[140px] w-full items-center justify-center rounded-md border border-gray-800 bg-black shadow-lg">
              <div className="absolute top-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                {t("dialogs.screenCapture.camera", "Camera")}
              </div>
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                className="transition-opacity duration-300"
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
```

## Примечания

- Переименуйте компонент с `CameraCaptureDialog` на `MediaCaptureDialog` для лучшего отражения функциональности
- Добавьте переводы для новых строк в файлы локализации
- Обновите обработчик закрытия, чтобы он корректно останавливал все потоки
