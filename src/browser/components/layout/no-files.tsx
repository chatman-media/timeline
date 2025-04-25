export function NoFiles() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="text-gray-600 dark:text-gray-400">Файлы не найдены</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Добавьте медиафайлы в следующие папки:
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">/public/media/</code>
          <span className="ml-2">Видео, аудио, фото</span>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">/public/music/</code>
          <span className="ml-2">Музыка</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        Поддерживаемые форматы видео: MP4, MOV, AVI, MKV, WEBM, INSV (360°)
        <br />
        Поддерживаемые форматы аудио: MP3, WAV, AAC, ALAC, OGG, FLAC
      </div>
    </div>
  )
}
