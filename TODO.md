# Timeline Editor - Список задач (TODO)

## Основные задачи (из открытых issues)

### Интерфейс и пользовательский опыт

1. **Hotkeys (#26)**

   - [ ] Реализовать горячие клавиши для основных действий
   - [ ] Добавить настройки горячих клавиш
   - [ ] Создать документацию по горячим клавишам

2. **Адаптивность веб-интерфейса (#25)**

   - [ ] Оптимизировать интерфейс для мобильных устройств
   - [ ] Обеспечить корректное отображение на планшетах
   - [ ] Адаптировать интерфейс для различных размеров экранов ПК
   - [ ] Тестирование на различных устройствах (PC, Android, iOS)

3. **Опции дорожек (#15)**

   - [ ] Реализовать возможность переименования дорожек
   - [ ] Добавить функцию блокировки трека
   - [ ] Добавить функцию отключения звука для трека
   - [ ] Добавить функцию скрытия трека
   - [ ] Реализовать выбор главного звука/видео с трека

4. **Опции (#14)**
   - [ ] Реализовать настройки аудио
   - [ ] Реализовать настройки видео
   - [ ] Добавить настройки цвета
   - [ ] Добавить настройки скорости воспроизведения

### Таймлайн и дорожки

5. **Исправить работу шкалы на таймлайне (#24)**

   - [ ] Реализовать функционал аналогичный Filmora
   - [ ] Исправить масштабирование шкалы
   - [ ] Улучшить навигацию по шкале

6. **Сведение дорожек в одну (#23)**

   - [ ] Реализовать произвольное сведение всех дорожек без приоритета
   - [ ] Добавить опцию главной дорожки с настройкой приоритета показа
   - [ ] Реализовать функцию "смешать и сжать" с показом лучших моментов (ИИ)
   - [ ] Добавить применение шаблонов при смешивании

7. **Выделение сегментов при записи (#22)**

   - [ ] Реализовать выделение сегментов во время записи
   - [ ] Добавить отображение сегментов на объединенной дорожке

8. **Корректная работа бара на таймлайне (#21)**

   - [ ] Исправить отображение и перемещение бара
   - [ ] Улучшить точность позиционирования

9. **Перемещение дорожек по вертикали (#16)**

   - [ ] Реализовать drag-and-drop для дорожек
   - [ ] Добавить визуальные индикаторы при перемещении
   - [ ] Сохранять порядок дорожек между сессиями

10. **Таймлайн (#13)**
    - [ ] Завершить оставшиеся задачи по таймлайну (3 из 7)

### Ресурсы и эффекты

11. **Доработка браузера ресурсов и эффектов/фильтров (#11)**
    - [ ] Улучшить интерфейс браузера ресурсов
    - [ ] Добавить новые эффекты и фильтры
    - [ ] Оптимизировать производительность при работе с эффектами

### Архитектура и инфраструктура

12. **Перенос веб-части в монорепозиторий Tauri (Rust) + React TS (#10)**

    - [ ] Настроить монорепозиторий
    - [ ] Интегрировать Tauri
    - [ ] Перенести существующий код React
    - [ ] Обеспечить кроссплатформенную совместимость

13. **Полное покрытие тестами (#27)**

    - [ ] Написать unit-тесты для всех компонентов
    - [ ] Добавить интеграционные тесты
    - [ ] Реализовать e2e тесты для основных пользовательских сценариев
    - [ ] Настроить CI/CD для автоматического запуска тестов

14. **Система избранного (Favorites) (#28)**

    - [ ] Добавить возможность сохранения любых медиа в избранное
    - [ ] Реализовать сохранение шаблонов в избранное с пользовательскими настройками
    - [ ] Добавить сохранение эффектов в избранное с настроенными параметрами
    - [ ] Реализовать сохранение переходов в избранное с пользовательскими настройками
    - [ ] Добавить сохранение фильтров в избранное с настроенными параметрами
    - [ ] Создать интерфейс для управления избранным

15. **Реализация функционала субтитров (титров) (#29)**

    - [ ] Разработать компонент списка субтитров с превью
    - [ ] Создать компонент предпросмотра субтитров (текст на черном фоне)
    - [ ] Реализовать диалог создания/редактирования субтитров
    - [ ] Добавить функционал импорта/экспорта субтитров
    - [ ] Создать редактор стилей субтитров
    - [ ] Интегрировать субтитры с системой избранного

16. **Настройка стиля разделяющих линий в шаблонах (#30)**
    - [ ] Добавить компонент настройки стиля разделяющих линий
    - [ ] Реализовать настройки внешнего вида линий (цвет, толщина, тип, прозрачность)
    - [ ] Добавить возможность включения/отключения отображения линий в плеере
    - [ ] Реализовать опцию включения/отключения линий в экспортируемом видео
    - [ ] Интегрировать настройки стиля линий с системой избранного

## Дополнительные задачи (не отраженные в issues)

### Функциональность

1. **Система избранного (Favorites)**

   - [ ] Добавить возможность сохранения любых медиа в избранное
   - [ ] Реализовать сохранение шаблонов в избранное с пользовательскими настройками
   - [ ] Добавить сохранение эффектов в избранное с настроенными параметрами
   - [ ] Реализовать сохранение переходов в избранное с пользовательскими настройками
   - [ ] Добавить сохранение фильтров в избранное с настроенными параметрами
   - [ ] Создать интерфейс для управления избранным (просмотр, редактирование, удаление)
   - [ ] Реализовать быстрый доступ к избранному из соответствующих разделов
   - [ ] Добавить возможность экспорта/импорта избранного для переноса между проектами

2. **Эффекты**

   - [ ] Реализовать базовые визуальные эффекты
   - [ ] Добавить настройки параметров эффектов
   - [ ] Реализовать предпросмотр эффектов в реальном времени
   - [ ] Добавить возможность сохранения пресетов эффектов

3. **Переходы**

   - [ ] Реализовать базовые типы переходов между клипами
   - [ ] Добавить настройки параметров переходов
   - [ ] Реализовать предпросмотр переходов
   - [ ] Добавить возможность сохранения пресетов переходов

4. **Шаблоны/Сценарии**

   - [ ] Разработать систему шаблонов монтажа
   - [ ] Реализовать программируемые сценарии монтажа
   - [ ] Добавить пользовательские шаблоны
   - [ ] Реализовать настройку положения линий разделения в шаблонах
   - [ ] Добавить настройки стиля разделяющих линий (цвет, толщина, тип, прозрачность)
   - [ ] Реализовать возможность включения/отключения отображения линий в плеере и экспорте
   - [ ] Добавить возможность сохранения пользовательских шаблонов

5. **Экспорт**
   - [ ] Реализовать экспорт в различные форматы
   - [ ] Добавить настройки качества экспорта
   - [ ] Реализовать предпросмотр перед экспортом

### Оптимизация и производительность

5. **Оптимизация работы с большим количеством треков/файлов**

   - [ ] Улучшить производительность при работе с большим количеством треков
   - [ ] Оптимизировать загрузку и отображение файлов
   - [ ] Реализовать виртуализацию списков для улучшения производительности

6. **Кэширование и оптимизация запросов**
   - [ ] Улучшить систему кэширования миниатюр
   - [ ] Оптимизировать асинхронные запросы
   - [ ] Реализовать эффективное обновление UI

### Интеграции

7. **Интеграция YOLO**

   - [ ] Подключить модель YOLO для детекции объектов в видео
   - [ ] Реализовать визуализацию обнаруженных объектов
   - [ ] Добавить фильтрацию/поиск по обнаруженным объектам

8. **Интеграция с облачными сервисами**

   - [ ] Добавить возможность импорта медиа из облачных хранилищ
   - [ ] Реализовать экспорт проектов в облако
   - [ ] Добавить синхронизацию проектов между устройствами

9. **Интеграция чата с ИИ-ассистентом**

   - [ ] Разработать компонент чата справа от таймлайна
   - [ ] Реализовать панель выбора ИИ-моделей для редактирования схемы видео
   - [ ] Добавить функционал генерации схемы монтажа на основе выбранных клипов
   - [ ] Реализовать возможность применения сгенерированной схемы к таймлайну
   - [ ] Добавить историю взаимодействия с ИИ-ассистентом
   - [ ] Интегрировать сохранение и загрузку схем монтажа

10. **Панель ресурсов**

- [ ] Разработать компонент панели ресурсов слева от таймлайна
- [ ] Интегрировать существующие ресурсы из машины состояний
- [ ] Реализовать быстрый доступ к часто используемым ресурсам
- [ ] Добавить возможность организации ресурсов по категориям
- [ ] Реализовать drag-and-drop для добавления ресурсов на таймлайн

## Документация

11. **Улучшение документации**

- [ ] Обновить README.md с актуальной информацией
- [ ] Создать руководство пользователя
- [ ] Добавить документацию для разработчиков
- [ ] Создать видео-туториалы по основным функциям

## Приоритеты задач

### Высокий приоритет

- Исправление работы шкалы на таймлайне (#24)
- Корректная работа бара на таймлайне (#21)
- Перемещение дорожек по вертикали (#16)
- Hotkeys (#26)

### Средний приоритет

- Адаптивность веб-интерфейса (#25)
- Опции дорожек (#15)
- Сведение дорожек в одну (#23)
- Выделение сегментов при записи (#22)
- Доработка браузера ресурсов и эффектов/фильтров (#11)
- Система избранного (Favorites) для медиа, шаблонов, эффектов и фильтров (#28)
- Реализация функционала субтитров (титров) (#29)
- Настройка стиля разделяющих линий в шаблонах (#30)
- Интеграция чата с ИИ-ассистентом справа от таймлайна
- Реализация панели ресурсов слева от таймлайна

### Низкий приоритет

- Перенос веб-части в монорепозиторий Tauri (#10)
- Полное покрытие тестами (#27)
- Дополнительные задачи (не отраженные в issues)
