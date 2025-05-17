#!/usr/bin/env python3
"""
Скрипт для генерации скриншотов из видео с заданным интервалом.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import cv2


def generate_screenshots(video_path, output_dir, interval=1.0, max_screenshots=None, initial_count=10, resize_width=None, resize_height=None):
    """
    Генерирует скриншоты из видео с заданным интервалом.

    Args:
        video_path (str): Путь к видеофайлу
        output_dir (str): Директория для сохранения скриншотов
        interval (float): Интервал между скриншотами в секундах
        max_screenshots (int, optional): Максимальное количество скриншотов
        initial_count (int, optional): Количество скриншотов для начальной генерации
        resize_width (int, optional): Ширина скриншотов (если None, определяется автоматически)
        resize_height (int, optional): Высота скриншотов (если None, определяется автоматически)

    Returns:
        dict: Результаты генерации скриншотов
    """
    # Проверяем существование видеофайла
    if not os.path.exists(video_path):
        return {"error": f"Видеофайл не найден: {video_path}"}

    # Создаем директорию для скриншотов, если она не существует
    os.makedirs(output_dir, exist_ok=True)

    # Открываем видеофайл
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": f"Не удалось открыть видеофайл: {video_path}"}

    # Получаем информацию о видео
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps

    # Получаем размеры видео
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Определяем соотношение сторон и выбираем размер для скриншотов
    if resize_width is None or resize_height is None:
        aspect_ratio = width / height

        # Горизонтальное видео (16:9 или близкое)
        if aspect_ratio > 1.5:
            resize_width = 640
            resize_height = 360
        # Вертикальное видео (9:16 или близкое)
        elif aspect_ratio < 0.67:
            resize_width = 360
            resize_height = 640
        # Квадратное видео (1:1 или близкое)
        else:
            resize_width = 540
            resize_height = 540

    # Выводим информацию в stderr, чтобы не мешать JSON-выводу
    print(f"Исходное разрешение видео: {width}x{height}, соотношение сторон: {width/height:.2f}", file=sys.stderr)
    print(f"Размер скриншотов: {resize_width}x{resize_height}", file=sys.stderr)

    # Вычисляем интервал в кадрах
    frame_interval = int(fps * interval)

    # Получаем имя файла без расширения
    video_filename = os.path.basename(video_path)
    video_name = os.path.splitext(video_filename)[0]

    # Список для хранения информации о скриншотах
    screenshots = []

    # Сначала генерируем initial_count скриншотов равномерно распределенных по видео
    if initial_count > 0:
        if initial_count > frame_count:
            initial_count = frame_count

        # Вычисляем интервал для равномерного распределения
        initial_interval = frame_count // initial_count

        for i in range(initial_count):
            frame_pos = i * initial_interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
            ret, frame = cap.read()

            if not ret:
                continue

            # Вычисляем временную метку
            timestamp = frame_pos / fps

            # Формируем имя файла
            screenshot_filename = f"{video_name}_initial_{i:04d}_{timestamp:.3f}.jpg"
            screenshot_path = os.path.join(output_dir, screenshot_filename)

            # Изменяем размер кадра
            resized_frame = cv2.resize(frame, (resize_width, resize_height), interpolation=cv2.INTER_AREA)

            # Сохраняем скриншот
            cv2.imwrite(screenshot_path, resized_frame)

            # Добавляем информацию о скриншоте
            screenshots.append({
                "path": screenshot_path,
                "timestamp": timestamp,
                "frame": frame_pos,
                "type": "initial"
            })

    # Затем генерируем скриншоты с заданным интервалом
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    frame_pos = 0
    count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_pos % frame_interval == 0:
            # Вычисляем временную метку
            timestamp = frame_pos / fps

            # Формируем имя файла
            screenshot_filename = f"{video_name}_{count:04d}_{timestamp:.3f}.jpg"
            screenshot_path = os.path.join(output_dir, screenshot_filename)

            # Изменяем размер кадра
            resized_frame = cv2.resize(frame, (resize_width, resize_height), interpolation=cv2.INTER_AREA)

            # Сохраняем скриншот
            cv2.imwrite(screenshot_path, resized_frame)

            # Добавляем информацию о скриншоте
            screenshots.append({
                "path": screenshot_path,
                "timestamp": timestamp,
                "frame": frame_pos,
                "type": "regular"
            })

            count += 1

            # Проверяем ограничение на количество скриншотов
            if max_screenshots and count >= max_screenshots:
                break

        frame_pos += 1

    # Освобождаем ресурсы
    cap.release()

    # Формируем результат
    result = {
        "video_path": video_path,
        "video_name": video_name,
        "duration": duration,
        "fps": fps,
        "frame_count": frame_count,
        "screenshot_count": len(screenshots),
        "screenshots": screenshots
    }

    return result


def main():
    """Основная функция скрипта."""
    parser = argparse.ArgumentParser(description="Генерация скриншотов из видео")
    parser.add_argument("video_path", help="Путь к видеофайлу")
    parser.add_argument("output_dir", help="Директория для сохранения скриншотов")
    parser.add_argument("--interval", type=float, default=1.0, help="Интервал между скриншотами в секундах")
    parser.add_argument("--max-screenshots", type=int, help="Максимальное количество скриншотов")
    parser.add_argument("--initial-count", type=int, default=10, help="Количество скриншотов для начальной генерации")
    parser.add_argument("--width", type=int, help="Ширина скриншотов (если не указана, определяется автоматически)")
    parser.add_argument("--height", type=int, help="Высота скриншотов (если не указана, определяется автоматически)")

    args = parser.parse_args()

    result = generate_screenshots(
        args.video_path,
        args.output_dir,
        args.interval,
        args.max_screenshots,
        args.initial_count,
        args.width,
        args.height
    )

    # Выводим результат в формате JSON
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
