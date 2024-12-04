# Сценарии тестирования приложения Timeline

## Главная страница (Home Page)

### Состояния отображения
1. **Загрузка данных**
   - Если `isLoading: true`, отображается компонент загрузки
   - Показывается текст "Загрузка..."

2. **Нет файлов**
   - Если `hasMedia: false`, отображается компонент NoFiles
   - Показываются инструкции по добавлению файлов
   - Отображаются поддерживаемые форматы

3. **Основной интерфейс**
   - Если `hasMedia: true`, отображается MediaEditor
   - Включает в себя элементы управления и видеоплеер

### Управление с клавиатуры
1. **Переключение камер (1-9)**
   - Нажатие клавиш 1-9 переключает на соответствующую камеру
   - Переключение происходит только если выбранная дорожка имеет запись в текущий момент времени
   - При попытке переключения на дорожку без записи в текущий момент времени ничего не происходит

2. **Управление воспроизведением**
   - Пробел: переключает воспроизведение/паузу
   - 'P'/'p': переключает воспроизведение/паузу
   - Работает с учетом регистра клавиш

### Очистка ресурсов
- При размонтировании компонента удаляются все слушатели событий
- Предотвращаются утечки памяти

## Технические детали
- Использует хук `useMedia` для управления состоянием
- Поддерживает горячие клавиши через глобальные слушатели событий
- Обрабатывает монтирование/размонтирование компонентов

## Кэширование и оптимизация

### 1. Кэширование данных в памяти

#### Кэширование миниатюр
- Хранение в `thumbnailCache` состояния VideoStore.
- Ключ кэша формируется как `${videoId}-${timestamp}`.
- Реализация в методе `getThumbnail`:
  ```typescript
  // src/stores/videoStore.ts:getThumbnail
  const cacheKey = `${videoId}-${timestamp}`
  if (thumbnailCache[cacheKey]) {
    return thumbnailCache[cacheKey]
  }
  ```

#### Сохранение состояния воспроизведения
- Текущее время сохраняется в `sessionStorage` при каждом обновлении.
- При закрытии страницы сохраняется в `localStorage`.
- Реализовано через `useEffect` в хуке `useMedia`:
  ```typescript
  // src/hooks/use-media.tsx
  sessionStorage.setItem(STORAGE_KEYS.CURRENT_TIME, store.currentTime.toString())
  localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, store.currentTime.toString())
  ```

### 2. Оптимизация загрузки

#### Предзагрузка видео
- При переключении камеры предзагружаются соседние видео.
- Реализовано в методе `setActiveCamera`:
  ```typescript
  // src/stores/videoStore.ts:setActiveCamera
  const preloadNearbyVideos = () => {
    const nearbyVideos = [
      targetTrack.allVideos[currentIndex - 1],
      targetTrack.allVideos[currentIndex + 1],
    ].filter(Boolean)
    // Предзагрузка видео
  }
  ```

#### Управление запросами миниатюр
- Отмена предыдущих запросов при быстрой прокрутке.
- Использование `AbortController` для управления запросами.
- Реализовано в компоненте `TrackThumbnails`:
  ```typescript
  // src/components/track/track-thumbnails.tsx
  abortController.current = new AbortController()
  requestsInProgress.current = true
  ```

### 3. Управление состоянием

#### Zustand Store
- Централизованное хранение состояния в `VideoStore`.
- Эффективное обновление только измененных данных.
- Основные методы:
  - `setVideos`: Установка списка видео.
  - `setActiveCamera`: Переключение активной камеры.
  - `updateActiveVideos`: Обновление активных видео.
  - `addThumbnailToCache`: Добавление миниатюр в кэш.

#### Оптимизация переключения камер
- Проверка доступности видео перед переключением.
- Учет временных меток для синхронизации.
- Реализовано в методе `setActiveCamera`:
  ```typescript
  // src/stores/videoStore.ts
  const availableVideo = targetTrack.allVideos.find((video) => {
    const startTime = new Date(video.probeData.format.tags?.creation_time || 0).getTime() / 1000
    const endTime = startTime + (video.probeData.format.duration || 0)
    return currentTime >= startTime && currentTime <= endTime
  })
  ```

### 4. Технические детали
- Использование `AbortController` для управления асинхронными запросами.
- Дебаунсинг запросов миниатюр для оптимизации производительности.
- Предварительная загрузка видео через HTML5 Video API.
- Кэширование в localStorage/sessionStorage для персистентности данных.
