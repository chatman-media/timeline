/**
 * Демонстрационный скрипт для создания сборной дорожки
 */
import { v4 as uuidv4 } from "uuid"

import { createEditSegment, createEditTrack, EditSegment, EditTrack } from "@/types/edit-schema"

import { CompositeTrackBuilder } from "./composite-track-builder"

/**
 * Создает демонстрационный сегмент с несколькими параллельными дорожками
 */
function createDemoSegment(): EditSegment {
  // Создаем дорожки
  const tracks: EditTrack[] = [
    createEditTrack(
      "Видео 1",
      "video",
      "video1.mp4",
      0,
      10,
      { x: 0, y: 0, width: 1, height: 1 },
      1,
    ),
    createEditTrack(
      "Видео 2",
      "video",
      "video2.mp4",
      2,
      12,
      { x: 0, y: 0, width: 1, height: 1 },
      1,
    ),
    createEditTrack(
      "Видео 3",
      "video",
      "video3.mp4",
      5,
      15,
      { x: 0, y: 0, width: 1, height: 1 },
      1,
    ),
    createEditTrack("Аудио 1", "audio", "audio1.mp3", 0, 20, undefined, 0.8),
  ]

  // Создаем сегмент
  return createEditSegment("Демонстрационный сегмент", 0, 20, tracks)
}

/**
 * Запускает демонстрацию создания сборной дорожки
 */
export function runCompositeTrackDemo() {
  console.log("=== Демонстрация создания сборной дорожки ===")

  // Создаем демонстрационный сегмент
  const segment = createDemoSegment()
  console.log("Создан демонстрационный сегмент:")
  console.log(`- Название: ${segment.name}`)
  console.log(`- ID: ${segment.id}`)
  console.log(`- Длительность: ${segment.duration} секунд`)
  console.log(`- Количество дорожек: ${segment.tracks.length}`)

  // Выводим информацию о дорожках
  console.log("\nДорожки в сегменте:")
  segment.tracks.forEach((track, index) => {
    console.log(`${index + 1}. ${track.name} (${track.type})`)
    console.log(`   - ID: ${track.id}`)
    console.log(`   - Источник: ${track.sourceId}`)
    console.log(`   - Начало: ${track.startTime} сек, Длительность: ${track.duration} сек`)
  })

  // Создаем сборную дорожку только для видео
  console.log("\nСоздание сборной видеодорожки:")
  const videoResult = CompositeTrackBuilder.buildCompositeTrack(segment, {
    segmentId: segment.id,
    switchInterval: 3,
    trackTypes: ["video"],
    includeTransitions: true,
    transitionDuration: 0.5,
  })

  console.log("\nСоздана сборная видеодорожка:")
  console.log(`- Название: ${videoResult.track.name}`)
  console.log(`- ID: ${videoResult.track.id}`)
  console.log(`- Тип: ${videoResult.track.type}`)
  console.log(`- Длительность: ${videoResult.track.duration} секунд`)

  console.log("\nСегменты сборной дорожки:")
  videoResult.segments.forEach((segment, index) => {
    // Находим дорожку по ID
    const track = segment.tracks.find((track) => track.id === segment.trackId)
    const trackName = track?.name || "Неизвестная дорожка"
    console.log(`${index + 1}. ${trackName}`)
    console.log(`   - Начало: ${segment.startTime} сек, Длительность: ${segment.duration} сек`)
  })

  console.log("\nКоманда FFmpeg для сборки:")
  console.log(videoResult.ffmpegCommand)

  // Создаем сборную дорожку для аудио
  console.log("\nСоздание сборной аудиодорожки:")
  try {
    const audioResult = CompositeTrackBuilder.buildCompositeTrack(segment, {
      segmentId: segment.id,
      switchInterval: 5,
      trackTypes: ["audio"],
      includeTransitions: true,
      transitionDuration: 1,
    })

    console.log("\nСоздана сборная аудиодорожка:")
    console.log(`- Название: ${audioResult.track.name}`)
    console.log(`- ID: ${audioResult.track.id}`)
    console.log(`- Тип: ${audioResult.track.type}`)
    console.log(`- Длительность: ${audioResult.track.duration} секунд`)

    console.log("\nСегменты сборной дорожки:")
    audioResult.segments.forEach((segment, index) => {
      // Находим дорожку по ID
      const track = segment.tracks.find((track) => track.id === segment.trackId)
      const trackName = track?.name || "Неизвестная дорожка"
      console.log(`${index + 1}. ${trackName}`)
      console.log(`   - Начало: ${segment.startTime} сек, Длительность: ${segment.duration} сек`)
    })

    console.log("\nКоманда FFmpeg для сборки:")
    console.log(audioResult.ffmpegCommand)
  } catch (error) {
    console.error("Ошибка при создании сборной аудиодорожки:", error)
  }

  console.log("\n=== Демонстрация завершена ===")
}

// Запускаем демонстрацию, если скрипт запущен напрямую
if (typeof window !== "undefined" && window.document) {
  console.log(
    "Скрипт загружен в браузере. Для запуска демонстрации вызовите runCompositeTrackDemo()",
  )
} else {
  runCompositeTrackDemo()
}
