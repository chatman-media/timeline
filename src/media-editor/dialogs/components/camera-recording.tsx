import { useCallback, useContext, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { MediaContext } from "@/media-editor/browser/providers/media-provider"
import { CameraCaptureDialog } from "@/media-editor/dialogs"
import { useModalContext } from "@/media-editor/dialogs/services/modal-provider"
import { useTimeline } from "@/media-editor/timeline/services/timeline-provider"
import { MediaFile } from "@/types/media"

export function CameraRecording() {
  const { t } = useTranslation()
  const { isRecordModalOpen, handleCloseModal } = useModalContext()
  const mediaContext = useContext(MediaContext)
  const { addMediaFiles } = useTimeline()

  // Логируем значение isRecordModalOpen при каждом рендере
  console.log("CameraRecording: isRecordModalOpen =", isRecordModalOpen)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedFileName, setRecordedFileName] = useState<string>("")
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [videoWidth, setVideoWidth] = useState<number>(0)
  const [videoHeight, setVideoHeight] = useState<number>(0)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveProgress, setSaveProgress] = useState<number>(0)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  // Логируем состояние isSaving после его объявления
  console.log("CameraRecording: isSaving =", isSaving, "saveProgress =", saveProgress, "saveSuccess =", saveSuccess)

  const videoRef = useRef<HTMLVideoElement>(null)

  // Обработчик закрытия предпросмотра
  const handleClosePreview = useCallback(() => {
    console.log("handleClosePreview вызван")
    setShowPreview(false)
    console.log("setShowPreview(false) вызван")

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

    // Закрываем модальное окно записи
    handleCloseModal()
    console.log("handleCloseModal вызван")
  }, [handleCloseModal])

  // Обработчик сохранения видео
  const handleSaveVideo = useCallback(() => {
    if (!recordedBlob || !mediaContext) return

    console.log("handleSaveVideo: устанавливаем isSaving = true")
    setIsSaving(true)
    setSaveProgress(0)
    setSaveSuccess(false)
    console.log(`Сохранение видео: ${recordedFileName}, размер: ${recordedBlob.size} байт`)

    try {
      // Создаем уникальное имя файла
      const fileExt = ".webm"
      const fileNameWithoutExt = recordedFileName.replace(fileExt, "")
      const timestamp = new Date().toISOString().replace(/:/g, "-")
      const uniqueFileName = `${fileNameWithoutExt}_${timestamp}${fileExt}`

      // Имитируем прогресс сохранения
      const progressInterval = setInterval(() => {
        setSaveProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

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

      // Завершаем прогресс и показываем сообщение об успехе
      setTimeout(() => {
        clearInterval(progressInterval);
        setSaveProgress(100);
        setSaveSuccess(true);
        console.log("Сохранение завершено, показываем сообщение об успехе");

        // Через 2 секунды после успешного сохранения убираем индикатор сохранения
        setTimeout(() => {
          setIsSaving(false);
          console.log("Убираем индикатор сохранения");
        }, 2000);
      }, 500);
    } catch (error) {
      console.error("Ошибка при сохранении видео:", error)
      setIsSaving(false)
      setSaveProgress(0)
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
    console.log("handleRecordedVideo: isRecordModalOpen =", isRecordModalOpen)

    try {
      // Сначала показываем предпросмотр, чтобы диалог не закрылся
      setShowPreview(true)
      console.log("setShowPreview(true) вызван немедленно")

      // Сохраняем блоб и имя файла
      setRecordedBlob(blob)
      setRecordedFileName(fileName)
      console.log("Блоб и имя файла сохранены в состоянии")

      // Создаем медиафайл из записанного блоба
      const file = new File([blob], fileName, { type: "video/webm" })

      // Создаем объект URL для просмотра видео
      const fileUrl = URL.createObjectURL(file)
      console.log("Создан URL для предпросмотра:", fileUrl)

      // Получаем длительность видео
      const videoElement = document.createElement("video")
      videoElement.src = fileUrl
      console.log("Создан временный видео элемент для получения метаданных")

      // Добавляем обработчик ошибок
      videoElement.onerror = (e) => {
        console.error("Ошибка загрузки метаданных видео:", e)
      }

      // Добавляем обработчик загрузки метаданных
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
        console.log("Метаданные видео сохранены в состоянии")

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

        // Предпросмотр уже показан, просто логируем
        console.log("Метаданные видео загружены, диалог предпросмотра должен быть виден")
      }
    } catch (error) {
      console.error("Ошибка в handleRecordedVideo:", error)
    }
  }, [])

  // Логируем состояния перед рендерингом
  console.log("Перед рендерингом: isRecordModalOpen =", isRecordModalOpen, "showPreview =", showPreview)

  return (
    <>
      {console.log("Рендеринг CameraCaptureDialog с isOpen =", isRecordModalOpen && !showPreview)}
      <CameraCaptureDialog
        isOpen={isRecordModalOpen && !showPreview}
        onClose={handleCloseModal}
        onVideoRecorded={handleRecordedVideo}
      />

      {/* Диалог предпросмотра записанного видео */}
      {console.log("Рендеринг диалога предпросмотра, showPreview =", showPreview)}
      <Dialog
        open={showPreview}
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange вызван с параметром open =", open);
          if (!open) handleClosePreview();
        }}
      >
        <DialogContent
          className="overflow-hidden border-[#333] bg-[#18181B] p-0 text-white sm:max-w-[500px]"
          aria-describedby="camera-preview-description"
        >
          <DialogTitle className="border-b border-[#333] p-4 text-lg font-semibold">
            {t("dialogs.cameraPreview.title")}
          </DialogTitle>

          <div className="p-4">
            <DialogDescription id="camera-preview-description" className="mb-4 text-sm text-white">
              {t("dialogs.cameraPreview.description")}
            </DialogDescription>

            {/* Предпросмотр видео */}
            <div className="relative mx-auto mb-6 flex h-[320px] w-full max-w-[400px] items-center justify-center rounded-md border border-gray-800 bg-black">
              {!videoRef.current?.src && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  {t("dialogs.cameraPreview.loadingVideo")}
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

            <div className="mb-6 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
              <div className="text-sm text-gray-300">{t("dialogs.cameraPreview.fileName")}:</div>
              <div className="text-sm">{recordedFileName}</div>

              <div className="text-sm text-gray-300">{t("dialogs.cameraPreview.duration")}:</div>
              <div className="text-sm">
                {videoDuration.toFixed(2)} {t("dialogs.cameraPreview.seconds")}
              </div>

              <div className="text-sm text-gray-300">{t("dialogs.cameraPreview.resolution")}:</div>
              <div className="text-sm">
                {videoWidth}x{videoHeight}
              </div>

              <div className="text-sm text-gray-300">{t("dialogs.cameraPreview.fileSize")}:</div>
              <div className="text-sm">
                {(recordedBlob?.size || 0) / 1024 / 1024 < 1
                  ? `${((recordedBlob?.size || 0) / 1024).toFixed(2)} КБ`
                  : `${((recordedBlob?.size || 0) / 1024 / 1024).toFixed(2)} МБ`}
              </div>
            </div>

            {/* Индикатор прогресса сохранения */}
            {(isSaving) && (
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>{t("dialogs.cameraPreview.savingProgress", "Прогресс сохранения")}</span>
                  <span>{Math.round(saveProgress)}%</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-700 border border-gray-600">
                  <div
                    className={`h-full ${saveSuccess ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-300`}
                    style={{ width: `${saveProgress}%` }}
                  ></div>
                </div>

                {/* Сообщение об успешном сохранении */}
                {saveSuccess && (
                  <div className="mt-2 rounded-md bg-green-900/50 p-3 text-center text-sm text-green-100">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("dialogs.cameraPreview.saveSuccess", "Видео успешно сохранено!")}
                    </div>

                    {/* Кнопка закрытия после успешного сохранения */}
                    <Button
                      className="mt-2 w-full bg-green-600 hover:bg-green-700"
                      onClick={handleClosePreview}
                    >
                      {t("dialogs.cameraPreview.close", "Закрыть")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Кнопки действий - показываем только если видео не сохранено успешно */}
            {!saveSuccess && (
              <div className="flex flex-col gap-2">
                {/* Кнопка для тестирования индикатора прогресса */}
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => {
                    console.log("Тестирование индикатора прогресса");
                    setIsSaving(true);
                    setSaveProgress(0);

                    // Имитируем прогресс
                    const progressInterval = setInterval(() => {
                      setSaveProgress((prev) => {
                        const newProgress = prev + 10;
                        if (newProgress >= 100) {
                          clearInterval(progressInterval);
                          setSaveSuccess(true);
                          return 100;
                        }
                        return newProgress;
                      });
                    }, 500);
                  }}
                >
                  Тест индикатора прогресса
                </Button>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={handleClosePreview}
                    disabled={isSaving}
                  >
                    {t("dialogs.cameraPreview.cancel")}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSaveVideo}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? t("dialogs.cameraPreview.saving")
                      : t("dialogs.cameraPreview.saveVideo")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
