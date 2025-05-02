import { useCallback } from "react"

import { CameraCaptureDialog } from "@/dialogs"
import { useModalContext } from "@/dialogs/services/modal-provider"

export function CameraRecording() {
  const { isRecordModalOpen, handleCloseModal } = useModalContext()

  const handleRecordedVideo = useCallback((blob: Blob, fileName: string) => {
    console.log(`Получена запись видео: ${fileName}, размер: ${blob.size} байт`)

    // Создаем медиафайл из записанного блоба
    const file = new File([blob], fileName, { type: "video/webm" })

    // Создаем объект URL для просмотра видео
    const fileUrl = URL.createObjectURL(file)

    // Получаем длительность видео
    const videoElement = document.createElement("video")
    videoElement.src = fileUrl

    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration

      // Создаем новый MediaFile объект
      // const newMediaFile: MediaFile = {
      //   id: `recorded-${Date.now()}`,
      //   name: fileName,
      //   path: fileUrl,
      //   size: blob.size,
      //   startTime: 0,
      //   duration: duration,
      //   probeData: {
      //     format: {
      //       duration: duration,
      //       filename: fileName,
      //       format_name: "webm",
      //       size: blob.size,
      //     },
      //     streams: [
      //       {
      //         codec_type: "video",
      //         codec_name: "vp9",
      //         width: videoElement.videoWidth,
      //         height: videoElement.videoHeight,
      //         r_frame_rate: "30/1",
      //         index: 0,
      //       },
      //     ],
      //   },
      // }

      URL.revokeObjectURL(fileUrl)
    }
  }, [])

  return (
    <>
      <CameraCaptureDialog
        isOpen={isRecordModalOpen}
        onClose={handleCloseModal}
        onVideoRecorded={handleRecordedVideo}
      />
    </>
  )
}
