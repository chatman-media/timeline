# Генерация и управление миниатюрами

## Анализ текущей реализации

Сейчас система генерирует миниатюры по запросу через эндпоинт `/api/thumbnail`, который принимает параметры `video` и `timestamp`. Это приводит к множеству отдельных запросов и неэффективному использованию ресурсов.

## Предлагаемые улучшения

### 1. Начальная генерация миниатюр

Вместо генерации миниатюр по отдельным временным меткам, следует:
- Рассчитывать оптимальное количество миниатюр на основе длительности видео и требований отображения
- Генерировать миниатюры пакетами с равномерным распределением
- Кэшировать результаты для повторного использования

### 2. Формула расчета

```typescript
interface ThumbnailParams {
  videoDuration: number;     // Длительность видео в секундах
  containerWidth: number;    // Ширина таймлайна в пикселях
  scale: number;            // Текущий масштаб
  trackHeight: number;      // Высота дорожки (52px)
}

function calculateThumbnailRequirements(params: ThumbnailParams) {
  const { videoDuration, containerWidth, scale, trackHeight } = params;
  
  // Количество пикселей на секунду видео
  const pixelsPerSecond = (containerWidth * scale) / videoDuration;
  
  // Оптимальное количество миниатюр
  const optimalCount = Math.ceil((containerWidth * scale) / trackHeight);
  
  // Интервал времени между миниатюрами
  const timeStep = videoDuration / optimalCount;
  
  return {
    count: optimalCount,
    timeStep,
    width: trackHeight, // Квадратные миниатюры
    pixelsPerSecond
  };
}
```

### 3. Изменения в API

Текущий эндпоинт: `/api/thumbnail?video=video.mp4&timestamp=123.45`

Предлагаемый новый эндпоинт: `/api/thumbnails?video=video.mp4&start=0&end=3600&count=30`

### 4. Стратегия кэширования

1. **Клиентский кэш:**
   - Хранение миниатюр в памяти с использованием глобального объекта кэша
   - Формат ключа: `${videoName}-${timeSegment}`
   - Сохранение между ре-рендерами

### 5. Прогрессивная загрузка

- Начинать с базового количества миниатюр
- Предварительно загружать следующую партию при увеличении масштаба
- Повторно использовать существующие миниатюры когда возможно

### 6. Обновление при изменении масштаба

Генерировать новые миниатюры только когда:
- Ширина контейнера таймлайна значительно изменилась (>20%)
- Изменение масштаба приводит к тому, что ширина миниатюр выходит за оптимальный диапазон
- Становится видимым новый временной диапазон

### 7. Этапы реализации

1. Расчет начальных требований
2. Реализация пакетной генерации
3. Добавление слоя кэширования
4. Обновление UI компонентов
5. Добавление логики регенерации при изменении масштаба

### 8. Оптимизация производительности

- Генерировать миниатюры с оптимальным разрешением (320x180)
- Реализовать debouncing запросов (300мс)
- Отменять текущие запросы при изменении масштаба
- Очищать неиспользуемые миниатюры из памяти
- Использовать формат WebP для лучшего сжатия

### План миграции

1. Создать новый эндпоинт генерации миниатюр
2. Обновить компонент track-thumbnails
3. Реализовать слой кэширования
4. Добавить регенерацию при изменении масштаба
5. Удалить старый эндпоинт
6. Очистить устаревший код
7. 