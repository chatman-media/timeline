## Начало работы

![Интерфейс таймлайна](/public/timeline.png)

```bash
git clone git@github.com:chatman-media/timeline.git
cd timeline
```

### Добавление медиафайлов

Для корректной работы и синхронизации следуйте этим рекомендациям:

#### Папка /public/videos/
Сюда добавляйте:
- Видеофайлы (MP4, MOV, AVI, MKV, WEBM)
- 360-градусные видео (INSV)
- Аудиозаписи с микрофонов, которые должны быть синхронизированы с видео

#### Папка /public/music/
Сюда добавляйте:
- Музыкальные треки
- Аудиофайлы, не требующие синхронизации с видео
- Поддерживаемые форматы: MP3, WAV, AAC, OGG, FLAC

### Установка и запуск

Можно использовать на выбор pnpm/bun/deno

Установите ffmpeg ([через brew](https://formulae.brew.sh/formula/ffmpeg)):

```bash
brew install ffmpeg
ffmpeg -version
```

Установка зависимостей и запуск:

```bash
pnpm i # установка зависимостей

pnpm task dev # запуск сервера разработки

pnpm lint --fix # проверка кода

pnpm fmt # форматирование кода

pnpm test # запуск тестов

pnpm outdated --recursive --update --latest # обновление зависимостей до последних версий (при необходимости)
```

## Разработка

Проект использует pre-commit хуки для контроля качества кода. Для настройки:

```bash
# Установка pre-commit
brew install pre-commit

# Установка хуков
pre-commit install
```
