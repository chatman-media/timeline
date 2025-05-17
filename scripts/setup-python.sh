#!/bin/bash

# Скрипт для установки Python-зависимостей в виртуальное окружение

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "Python не найден. Пожалуйста, установите Python 3."
    exit 1
fi

# Определяем директорию проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${PROJECT_DIR}/venv"

# Проверяем, существует ли виртуальное окружение
if [ ! -d "${VENV_DIR}" ]; then
    echo "Создание виртуального окружения в ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
    if [ $? -ne 0 ]; then
        echo "Ошибка при создании виртуального окружения."
        exit 1
    fi
    echo "Виртуальное окружение успешно создано."
else
    echo "Виртуальное окружение уже существует в ${VENV_DIR}."
fi

# Активируем виртуальное окружение
echo "Активация виртуального окружения..."
source "${VENV_DIR}/bin/activate"

# Проверяем, что виртуальное окружение активировано
if [ -z "${VIRTUAL_ENV}" ]; then
    echo "Ошибка при активации виртуального окружения."
    exit 1
fi

# Обновляем pip
echo "Обновление pip..."
pip install --upgrade pip

# Устанавливаем зависимости
echo "Установка Python-зависимостей..."
pip install -r "${PROJECT_DIR}/scripts/python/requirements.txt"

echo "Python-зависимости успешно установлены в виртуальное окружение."
echo "Для использования виртуального окружения выполните команду:"
echo "source ${VENV_DIR}/bin/activate"
