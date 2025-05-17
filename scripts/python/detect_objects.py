#!/usr/bin/env python3
"""
Скрипт для распознавания объектов на изображениях с использованием YOLOv10.
"""

import argparse
import json
import os
import sys
from pathlib import Path

import torch
import cv2
import numpy as np


def download_yolov10_model(model_name="yolov10s.pt"):
    """
    Загружает модель YOLOv10 из репозитория, если она еще не загружена.

    Args:
        model_name (str): Имя модели для загрузки

    Returns:
        str: Путь к загруженной модели
    """
    # Создаем директорию для моделей, если она не существует
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    os.makedirs(models_dir, exist_ok=True)

    # Путь к модели
    model_path = os.path.join(models_dir, model_name)

    # Проверяем, существует ли модель
    if not os.path.exists(model_path):
        print(f"Загрузка модели {model_name}...", file=sys.stderr)

        # URL для загрузки модели
        model_url = f"https://github.com/THU-MIG/yolov10/releases/download/v1.0/{model_name}"

        # Загружаем модель
        import urllib.request
        urllib.request.urlretrieve(model_url, model_path)

        print(f"Модель {model_name} успешно загружена", file=sys.stderr)

    return model_path


def detect_objects(image_paths, output_dir=None, conf_threshold=0.25, model_name="yolov10s.pt", img_size=640):
    """
    Распознает объекты на изображениях с использованием YOLOv10.

    Args:
        image_paths (list): Список путей к изображениям
        output_dir (str, optional): Директория для сохранения результатов
        conf_threshold (float): Порог уверенности для детекций
        model_name (str): Имя модели для использования
        img_size (int): Максимальный размер большей стороны изображения

    Returns:
        dict: Результаты распознавания объектов
    """
    # Загружаем модель YOLOv10
    try:
        model_path = download_yolov10_model(model_name)

        # Используем YOLO из Ultralytics
        from ultralytics import YOLO
        model = YOLO(model_path)

        # Устанавливаем порог уверенности
        model.conf = conf_threshold

        print(f"Модель YOLOv10 успешно загружена из {model_path}", file=sys.stderr)
    except Exception as e:
        print(f"Ошибка при загрузке модели: {str(e)}", file=sys.stderr)
        return {"error": f"Не удалось загрузить модель: {str(e)}"}

    # Создаем директорию для результатов, если она указана и не существует
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    # Список для хранения результатов
    results = []

    # Обрабатываем каждое изображение
    for image_path in image_paths:
        try:
            # Проверяем существование изображения
            if not os.path.exists(image_path):
                results.append({
                    "image_path": image_path,
                    "error": "Изображение не найдено"
                })
                continue

            # Получаем имя файла без расширения
            image_filename = os.path.basename(image_path)
            image_name = os.path.splitext(image_filename)[0]

            # Загружаем изображение для определения его размеров
            img = cv2.imread(image_path)
            if img is None:
                results.append({
                    "image_path": image_path,
                    "error": "Не удалось загрузить изображение"
                })
                continue

            # Получаем размеры изображения
            height, width = img.shape[:2]

            # Определяем, нужно ли изменять размер изображения
            if max(height, width) > img_size:
                # Вычисляем коэффициент масштабирования
                scale = img_size / max(height, width)

                # Вычисляем новые размеры с сохранением пропорций
                new_width = int(width * scale)
                new_height = int(height * scale)

                # Изменяем размер изображения
                img_resized = cv2.resize(img, (new_width, new_height))

                # Сохраняем изображение во временный файл
                temp_path = os.path.join(output_dir, f"{image_name}_resized.jpg")
                cv2.imwrite(temp_path, img_resized)

                # Используем временный файл для распознавания
                print(f"Обработка изображения: {image_path} (изменен размер до {new_width}x{new_height})", file=sys.stderr)
                detection_results = model(temp_path)

                # Масштабируем координаты обратно к исходному размеру
                scale_factor = 1 / scale
            else:
                # Используем исходное изображение
                print(f"Обработка изображения: {image_path}", file=sys.stderr)
                detection_results = model(image_path)
                scale_factor = 1.0

            # Преобразуем результаты в удобный формат
            detections = []

            # Обрабатываем результаты в новом формате YOLOv10
            for result in detection_results:
                boxes = result.boxes

                for box in boxes:
                    # Получаем координаты
                    x1, y1, x2, y2 = box.xyxy[0].tolist()

                    # Масштабируем координаты обратно к исходному размеру, если изображение было изменено
                    if scale_factor != 1.0:
                        x1 *= scale_factor
                        y1 *= scale_factor
                        x2 *= scale_factor
                        y2 *= scale_factor

                    # Получаем уверенность
                    conf = box.conf[0].item()

                    # Получаем класс
                    class_id = int(box.cls[0].item())
                    class_name = result.names[class_id]

                    # Добавляем информацию о детекции
                    detections.append({
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": float(conf),
                        "bbox": [float(x1), float(y1), float(x2), float(y2)]
                    })

            # Если указана директория для результатов, сохраняем изображение с детекциями
            if output_dir:
                # Загружаем изображение
                img = cv2.imread(image_path)

                # Рисуем рамки и метки
                for det in detections:
                    x1, y1, x2, y2 = map(int, det["bbox"])
                    class_name = det["class_name"]
                    confidence = det["confidence"]

                    # Рисуем рамку
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

                    # Рисуем метку
                    label = f"{class_name} {confidence:.2f}"
                    cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                # Сохраняем изображение с детекциями
                output_path = os.path.join(output_dir, f"{image_name}_detected.jpg")
                cv2.imwrite(output_path, img)

            # Добавляем результаты
            results.append({
                "image_path": image_path,
                "detections": detections,
                "detection_count": len(detections)
            })

        except Exception as e:
            results.append({
                "image_path": image_path,
                "error": str(e)
            })

    # Формируем итоговый результат
    result = {
        "model": model_name,
        "conf_threshold": conf_threshold,
        "image_count": len(image_paths),
        "results": results
    }

    return result


def main():
    """Основная функция скрипта."""
    parser = argparse.ArgumentParser(description="Распознавание объектов на изображениях с использованием YOLOv10")
    parser.add_argument("image_paths", nargs="+", help="Пути к изображениям")
    parser.add_argument("--output-dir", help="Директория для сохранения результатов")
    parser.add_argument("--conf-threshold", type=float, default=0.25, help="Порог уверенности для детекций")
    parser.add_argument("--model", default="yolov10s.pt", help="Имя модели для использования")
    parser.add_argument("--img-size", type=int, default=640, help="Максимальный размер большей стороны изображения")

    args = parser.parse_args()

    result = detect_objects(
        args.image_paths,
        args.output_dir,
        args.conf_threshold,
        args.model,
        args.img_size
    )

    # Выводим результат в формате JSON
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
