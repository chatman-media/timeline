import { useCallback, useContext,useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription,DialogTitle } from "@/components/ui/dialog"
import { MediaContext } from "@/media-editor/browser/providers/media-provider"
import { CameraCaptureDialog } from "@/media-editor/dialogs"
import { useModalContext } from "@/media-editor/dialogs/services/modal-provider"
import { useTimeline } from "@/media-editor/timeline/services/timeline-provider"
import { MediaFile } from "@/types/media"

export function CameraRecording() {
  const { isRecordModalOpen, handleCloseModal } = useModalContext()
  const mediaContext = useContext(MediaContext)
  const { addMediaFiles } = useTimeline()
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedFileName, setRecordedFileName] = useState<string>("")
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoWidth, setVideoWidth] = useState<number>(0)
  const [videoHeight, setVideoHeight] = useState<number>(0)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Обработчик закрытия предпросмотра
  const handleClosePreview = useCallback(() => {
    setShowPreview(false)

    // Очищаем URL объект, чтобы избежать утечек памяти
    if (videoRef.current && videoRef.current.src) {
      const currentSrc = videoRef.current.src
      console.log("Очищаем URL объект:", currentSrc)

      // Останавливаем воспроизведение
      videoRef.current.pause()

      // Очищаем источник
      videoRef.current.removeAttribute("src")
      videoRef.current.load()

      // Освобождаем URL объект
      if (currentSrc.startsWith("blob:")) {
        URL.revokeObjectURL(currentSrc)
      }
    }

    // Сбрасываем состояние
    setRecordedBlob(null)
    setRecordedFileName("")
    setVideoDuration(0)
    setVideoWidth(0)
    setVideoHeight(0)
  }, [])

  // Обработчик сохранения видео
  const handleSaveVideo = useCallback(() => {
    if (!recordedBlob || !mediaContext) return

    setIsSaving(true)
    console.log(`Сохранение видео: ${recordedFileName}, размер: ${recordedBlob.size} байт`)

    try {
      // Создаем уникальное имя файла
      const fileExt = ".webm"
      const fileNameWithoutExt = recordedFileName.replace(fileExt, "")
      const timestamp = new Date().toISOString().replace(/:/g, "-")
      const uniqueFileName = `${fileNameWithoutExt}_${timestamp}${fileExt}`

      // Создаем объект File из Blob
      const file = new File([recordedBlob], uniqueFileName, { type: "video/webm" })

      // Создаем URL для файла
      const fileUrl = URL.createObjectURL(file)
      console.log("Создан URL для файла:", fileUrl)

      // Создаем ссылку для скачивания файла
      const a = document.createElement("a")
      a.href = fileUrl
      a.download = uniqueFileName
      a.style.display = "none"
      document.body.appendChild(a)

      // Скачиваем файл
      a.click()

      // Удаляем ссылку
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(fileUrl)
      }, 100)

      // Создаем объект MediaFile для добавления в медиатеку
      const newMediaFile: MediaFile = {
        id: uniqueFileName.split(".")[0],
        name: uniqueFileName,
        path: `/media/${uniqueFileName}`,
        size: recordedBlob.size,
        duration: videoDuration,
        isVideo: true,
        createdAt: new Date().toISOString(),
        probeData: {
          format: {
            duration: videoDuration,
            filename: uniqueFileName,
            format_name: "webm",
            size: recordedBlob.size,
          },
          streams: [
            {
              codec_type: "video",
              codec_name: "vp9",
              width: videoWidth,
              height: videoHeight,
              r_frame_rate: "30/1",
              index: 0,
              streamKey: `${uniqueFileName}_0`,
            },
          ],
        },
      }

      // Обновляем список медиафайлов
      mediaContext.reload()

      // Добавляем файл на таймлайн
      addMediaFiles([newMediaFile])

      // Закрываем предпросмотр
      handleClosePreview()

      // Закрываем модальное окно записи
      handleCloseModal()
    } catch (error) {
      console.error("Ошибка при сохранении видео:", error)
    } finally {
      setIsSaving(false)
    }
  }, [
    recordedBlob,
    recordedFileName,
    videoDuration,
    videoWidth,
    videoHeight,
    mediaContext,
    addMediaFiles,
    handleCloseModal,
    handleClosePreview,
  ])

  const handleRecordedVideo = useCallback((blob: Blob, fileName: string) => {
    console.log(`Получена запись видео: ${fileName}, размер: ${blob.size} байт`)

    // Сохраняем блоб и имя файла
    setRecordedBlob(blob)
    setRecordedFileName(fileName)

    // Создаем медиафайл из записанного блоба
    const file = new File([blob], fileName, { type: "video/webm" })

    // Создаем объект URL для просмотра видео
    const fileUrl = URL.createObjectURL(file)
    console.log("Создан URL для предпросмотра:", fileUrl)

    // Получаем длительность видео
    const videoElement = document.createElement("video")
    videoElement.src = fileUrl

    videoElement.onloadedmetadata = () => {
      console.log("Метаданные видео загружены:", {
        duration: videoElement.duration,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      })

      const duration = videoElement.duration
      setVideoDuration(duration)
      setVideoWidth(videoElement.videoWidth)
      setVideoHeight(videoElement.videoHeight)

      // Если есть ссылка на видео элемент в предпросмотре, устанавливаем источник
      if (videoRef.current) {
        console.log("Устанавливаем src для видео элемента:", fileUrl)
        videoRef.current.src = fileUrl

        // Добавляем обработчик для проверки загрузки видео
        videoRef.current.onloadeddata = () => {
          console.log("Видео данные загружены в предпросмотре")
        }

        videoRef.current.onerror = (e) => {
          console.error("Ошибка загрузки видео в предпросмотре:", e)
        }
      } else {
        console.error("Ссылка на видео элемент отсутствует")
      }

      // Показываем предпросмотр после установки всех данных
      setTimeout(() => {
        setShowPreview(true)
      }, 100)
    }

    videoElement.onerror = (e) => {
      console.error("Ошибка загрузки метаданных видео:", e)
    }
  }, [])

  return (
    <>
      <CameraCaptureDialog
        isOpen={isRecordModalOpen && !showPreview}
        onClose={handleCloseModal}
        onVideoRecorded={handleRecordedVideo}
      />

      {/* Диалог предпросмотра записанного видео */}
      <Dialog open={showPreview} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent
          className="overflow-hidden border-[#333] bg-[#18181B] p-0 text-white sm:max-w-[500px]"
          aria-describedby="camera-preview-description"
        >
          <DialogTitle className="border-b border-[#333] p-4 text-lg font-semibold">
            Предпросмотр записи
          </DialogTitle>

          <div className="p-4">
            <DialogDescription id="camera-preview-description" className="mb-4 text-sm text-white">
              Просмотрите записанное видео перед сохранением. После нажатия на кнопку "Сохранить
              видео" файл будет скачан. Переместите его в папку public/media проекта для добавления
              на таймлайн.
            </DialogDescription>

            {/* Предпросмотр видео */}
            <div className="relative mx-auto mb-6 flex h-[320px] w-full max-w-[400px] items-center justify-center rounded-md border border-gray-800 bg-black">
              {!videoRef.current?.src && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Загрузка видео...
                </div>
              )}
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                muted={false}
                preload="auto"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  backgroundColor: "black",
                }}
              />
            </div>

            {/* Информация о видео */}
            <div className="mb-6 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
              <div className="text-sm text-gray-300">Имя файла:</div>
              <div className="text-sm">{recordedFileName}</div>

              <div className="text-sm text-gray-300">Длительность:</div>
              <div className="text-sm">{videoDuration.toFixed(2)} сек.</div>

              <div className="text-sm text-gray-300">Разрешение:</div>
              <div className="text-sm">
                {videoWidth}x{videoHeight}
              </div>

              <div className="text-sm text-gray-300">Размер файла:</div>
              <div className="text-sm">
                {(recordedBlob?.size || 0) / 1024 / 1024 < 1
                  ? `${((recordedBlob?.size || 0) / 1024).toFixed(2)} КБ`
                  : `${((recordedBlob?.size || 0) / 1024 / 1024).toFixed(2)} МБ`}
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={handleClosePreview}
              >
                Отмена
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSaveVideo}
                disabled={isSaving}
              >
                {isSaving ? "Сохранение..." : "Сохранить видео"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
