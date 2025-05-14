# API для записи медиа

Этот документ описывает API для записи и сохранения медиа-файлов (видео и аудио) в приложении.

## Запись видео с камеры

### Компонент `CameraCaptureDialog`

Компонент для записи видео с веб-камеры.

#### Пропсы

| Имя | Тип | Описание |
|-----|-----|----------|
| `isOpen` | `boolean` | Флаг, указывающий, открыт ли диалог |
| `onClose` | `() => void` | Функция, вызываемая при закрытии диалога |
| `onVideoRecorded` | `(blob: Blob, fileName: string) => void` | Функция обратного вызова, вызываемая при завершении записи видео |

#### Пример использования

```tsx
import { CameraCaptureDialog } from "@/media-editor/dialogs"

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleVideoRecorded = (blob: Blob, fileName: string) => {
    console.log(`Получена запись видео: ${fileName}, размер: ${blob.size} байт`)
    // Обработка записанного видео
  }
  
  return (
    <CameraCaptureDialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onVideoRecorded={handleVideoRecorded}
    />
  )
}
```

### API-эндпоинт для сохранения видео

#### `POST /api/save-recording`

Эндпоинт для сохранения записанного видео на сервере.

#### Параметры запроса

Запрос должен быть отправлен как `multipart/form-data` с следующими полями:

| Имя | Тип | Описание |
|-----|-----|----------|
| `file` | `File` | Файл видео в формате webm |
| `fileName` | `string` | Имя файла для сохранения |

#### Ответ

```json
{
  "success": true,
  "filePath": "/media/camera_recording_2023-01-01T12-00-00.000Z_abcd1234.webm",
  "fileName": "camera_recording_2023-01-01T12-00-00.000Z_abcd1234.webm",
  "fullPath": "/path/to/public/media/camera_recording_2023-01-01T12-00-00.000Z_abcd1234.webm",
  "size": 1024000,
  "createdAt": "2023-01-01T12:00:00.000Z"
}
```

#### Пример использования

```javascript
async function saveRecording(blob, fileName) {
  const formData = new FormData()
  formData.append('file', blob, fileName)
  formData.append('fileName', fileName)
  
  try {
    const response = await fetch('/api/save-recording', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Failed to save recording')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error saving recording:', error)
    throw error
  }
}
```

## Запись аудио

### Компонент `VoiceRecordDialog`

Компонент для записи аудио с микрофона.

#### Пропсы

| Имя | Тип | Описание |
|-----|-----|----------|
| `isOpen` | `boolean` | Флаг, указывающий, открыт ли диалог |
| `onClose` | `() => void` | Функция, вызываемая при закрытии диалога |

#### Пример использования

```tsx
import { VoiceRecordDialog } from "@/media-editor/dialogs"

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <VoiceRecordDialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  )
}
```

### API-эндпоинт для сохранения аудио

#### `POST /api/save-audio-recording`

Эндпоинт для сохранения записанного аудио на сервере.

#### Параметры запроса

Запрос должен быть отправлен как `multipart/form-data` с следующими полями:

| Имя | Тип | Описание |
|-----|-----|----------|
| `file` | `File` | Файл аудио в формате webm |
| `fileName` | `string` | Имя файла для сохранения |

#### Ответ

```json
{
  "success": true,
  "filePath": "/media/voice_recording_2023-01-01T12-00-00.000Z_abcd1234.webm",
  "fileName": "voice_recording_2023-01-01T12-00-00.000Z_abcd1234.webm",
  "fullPath": "/path/to/public/media/voice_recording_2023-01-01T12-00-00.000Z_abcd1234.webm",
  "size": 512000,
  "createdAt": "2023-01-01T12:00:00.000Z"
}
```

## Процесс записи и сохранения видео

1. Пользователь открывает диалог записи видео
2. Пользователь выбирает устройство камеры и аудио
3. Пользователь настраивает разрешение и частоту кадров
4. Пользователь начинает запись
5. После завершения записи вызывается функция `onVideoRecorded` с Blob и именем файла
6. Компонент `CameraRecording` получает Blob и отображает предпросмотр
7. Пользователь может сохранить видео или отменить запись
8. При сохранении видео файл отправляется на сервер через API-эндпоинт `/api/save-recording`
9. Сервер сохраняет файл и возвращает информацию о сохраненном файле
10. Файл добавляется в медиатеку и может быть использован в проекте
