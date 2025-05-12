import { Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Импортируем типы и функции из наших новых модулей
import { createPresets, PresetType, ShortcutCategory, Shortcut } from "./keyboard-shortcuts"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}


export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const { t, i18n } = useTranslation()
  // Создаем предустановки с локализацией
  const PRESETS = useMemo(() => createPresets(t), [t, i18n.language])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("Timeline")
  const [categories, setCategories] = useState<ShortcutCategory[]>(PRESETS["Timeline"])
  const [editingShortcut, setEditingShortcut] = useState<{
    categoryIndex: number
    shortcutIndex: number
  } | null>(null)
  const [listeningForKeys, setListeningForKeys] = useState(false)

  // Refs для каждой категории для scrollspy
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeSection, setActiveSection] = useState<number>(0)

  // Собственная реализация scrollspy
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const sections = sectionRefs.current.filter(Boolean)

      // Находим текущую активную секцию
      let currentActive = 0
      const scrollPosition = scrollContainer.scrollTop + 80 // Добавляем отступ

      sections.forEach((section, index) => {
        if (!section) return

        const sectionTop = section.offsetTop - scrollContainer.offsetTop
        if (scrollPosition >= sectionTop) {
          currentActive = index
        }
      })

      setActiveSection(currentActive)
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    handleScroll() // Вызываем один раз при монтировании

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [categories, searchQuery])

  // Обновляем категории при изменении предустановки или языка
  useEffect(() => {
    setCategories(PRESETS[selectedPreset])
    // Инициализируем массив refs при изменении категорий
    sectionRefs.current = Array(PRESETS[selectedPreset].length).fill(null)
    // Сбрасываем режим редактирования при смене предустановки
    setEditingShortcut(null)
    setListeningForKeys(false)
  }, [selectedPreset, PRESETS])

  // Добавляем обработчик клика вне для отмены редактирования
  useEffect(() => {
    if (!listeningForKeys) return

    const handleClickOutside = () => {
      cancelEditing()
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [listeningForKeys])

  // Добавляем обработчик нажатия Escape для отмены редактирования
  useEffect(() => {
    if (!listeningForKeys) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelEditing()
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [listeningForKeys])

  // Фильтрация категорий и горячих клавиш по поисковому запросу
  const filteredCategories = searchQuery
    ? categories
      .map((category) => ({
        ...category,
        shortcuts: category.shortcuts.filter(
          (shortcut) =>
            shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              shortcut.keys.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((category) => category.shortcuts.length > 0)
    : categories

  // Обработчик изменения поискового запроса
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Обработчик нажатия клавиш в поле поиска
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Если нажата только модификатор, добавляем его в поисковый запрос
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
      e.preventDefault()

      // Получаем символ модификатора
      let modifier = ""
      if (e.key === "Meta") modifier = "⌘"
      if (e.key === "Control") modifier = "Ctrl"
      if (e.key === "Alt") modifier = "⌥"
      if (e.key === "Shift") modifier = "⇧"

      // Добавляем модификатор в поисковый запрос, если его еще нет
      if (modifier && !searchQuery.includes(modifier)) {
        setSearchQuery((prev) => prev + modifier)
      }
      return
    }

    // Если нажата комбинация клавиш с модификатором
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
      e.preventDefault()

      // Получаем нажатые модификаторы
      const modifiers = []
      if (e.metaKey) modifiers.push("⌘")
      if (e.ctrlKey) modifiers.push("Ctrl")
      if (e.altKey) modifiers.push("⌥")
      if (e.shiftKey) modifiers.push("⇧")

      // Получаем основную клавишу
      let key = e.key

      // Преобразуем специальные клавиши в более читаемый формат
      if (key === " ") key = "Space"
      if (key === "ArrowUp") key = "↑"
      if (key === "ArrowDown") key = "↓"
      if (key === "ArrowLeft") key = "←"
      if (key === "ArrowRight") key = "→"
      if (key === "Escape") key = "Esc"
      if (key === "Delete") key = "Del"

      // Формируем строку с горячей клавишей
      const keyString = [...modifiers, key].join("")

      // Устанавливаем поисковый запрос
      setSearchQuery(keyString)
    }
  }

  // Обработчик изменения предустановки
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value as PresetType)
  }

  // Прокрутка к категории
  const scrollToCategory = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth" })
  }

  // Начать редактирование горячей клавиши
  const startEditing = (categoryIndex: number, shortcutIndex: number) => {
    setEditingShortcut({ categoryIndex, shortcutIndex })
    setListeningForKeys(true)
  }

  // Обработчик нажатия клавиш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editingShortcut || !listeningForKeys) return

    e.preventDefault()
    e.stopPropagation()

    // Получаем нажатые модификаторы
    const modifiers = []
    if (e.metaKey) modifiers.push("⌘")
    if (e.ctrlKey) modifiers.push("Ctrl")
    if (e.altKey) modifiers.push("⌥")
    if (e.shiftKey) modifiers.push("⇧")

    // Получаем основную клавишу
    let key = e.key

    // Преобразуем специальные клавиши в более читаемый формат
    if (key === " ") key = "Space"
    if (key === "ArrowUp") key = "↑"
    if (key === "ArrowDown") key = "↓"
    if (key === "ArrowLeft") key = "←"
    if (key === "ArrowRight") key = "→"
    if (key === "Escape") key = "Esc"
    if (key === "Delete") key = "Del"

    // Игнорируем нажатия только модификаторов
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
      return
    }

    // Формируем строку с горячей клавишей
    const keyString = [...modifiers, key].join("")

    // Обновляем категории с новой горячей клавишей
    const newCategories = [...categories]
    const { categoryIndex, shortcutIndex } = editingShortcut

    newCategories[categoryIndex].shortcuts[shortcutIndex].keys = keyString

    setCategories(newCategories)
    setEditingShortcut(null)
    setListeningForKeys(false)
  }

  // Отменить редактирование при клике вне
  const cancelEditing = () => {
    if (editingShortcut) {
      setEditingShortcut(null)
      setListeningForKeys(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background h-[max(600px,min(50vh,800px))] max-w-4xl gap-0 overflow-hidden p-0 dark:bg-[#1b1a1f]">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="text-center text-xl">
            {t("dialogs.keyboardShortcuts.title", "Быстрые клавиши")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[calc(max(600px,min(50vh,800px))-56px)] flex-col overflow-hidden p-4">
          {/* Верхняя часть с поиском и выбором предустановки */}
          <div className="flex-shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex w-1/2 items-center space-x-2">
                <label className="text-sm whitespace-nowrap">
                  {t(
                    "dialogs.keyboardShortcuts.switchPreset",
                    "Переключиться на другую предустановку ярлыков:",
                  )}
                </label>
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Timeline">
                      {t("dialogs.keyboardShortcuts.presets.timeline", "Timeline")}
                    </SelectItem>
                    <SelectItem value="Wondershare Filmora">
                      {t("dialogs.keyboardShortcuts.presets.filmora", "Wondershare Filmora")}
                    </SelectItem>
                    <SelectItem value="Adobe Premier Pro">
                      {t("dialogs.keyboardShortcuts.presets.premiere", "Adobe Premier Pro")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-1/3">
                <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder={t(
                    "dialogs.keyboardShortcuts.searchShortcuts",
                    "Поиск сочетаний клавиш",
                  )}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className="pr-8 pl-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label={t("dialogs.keyboardShortcuts.clearSearch", "Очистить поиск")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <p>
                {t(
                  "dialogs.keyboardShortcuts.editHint",
                  "Нажмите на сочетание клавиш, чтобы изменить его. Нажмите нужные клавиши для установки нового сочетания.",
                )}
              </p>
              <p className="mt-1">
                {t(
                  "dialogs.keyboardShortcuts.searchHint",
                  "Вы можете искать по названию или нажать комбинацию клавиш в поле поиска.",
                )}
              </p>
            </div>
          </div>

          {/* Средняя часть с категориями и горячими клавишами */}
          <div className="mt-4 mb-4 flex min-h-0 flex-grow overflow-hidden">
            {/* Левая панель с категориями */}
            <div className="w-1/4 overflow-y-auto border-r border-gray-200 pr-2 dark:border-gray-700">
              <div className="space-y-1">
                {filteredCategories.map((category, index) => (
                  <Button
                    key={category.id}
                    variant={activeSection === index ? "default" : "ghost"}
                    className={`w-full cursor-pointer justify-start ${activeSection === index ? "bg-[#00CCC0] text-black dark:bg-[#00CCC0] dark:text-black" : ""}`}
                    onClick={() => scrollToCategory(index)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Правая панель с горячими клавишами */}
            <div
              className="w-3/4 overflow-y-auto bg-white pl-4 dark:bg-[#1b1a1f]"
              ref={scrollContainerRef}
            >
              {filteredCategories.map((category, index) => {
                return (
                  <div
                    key={category.id}
                    ref={(el) => {
                      if (el) sectionRefs.current[index] = el
                    }}
                    className="mb-6"
                  >
                    <h3 className="mb-2 text-lg font-medium">{category.name}</h3>
                    <div className="space-y-2">
                      {category.shortcuts.map((shortcut, shortcutIndex) => {
                        const isEditing =
                          editingShortcut &&
                          editingShortcut.categoryIndex === index &&
                          editingShortcut.shortcutIndex === shortcutIndex

                        return (
                          <div
                            key={shortcut.id}
                            className={`flex items-center justify-between rounded px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${isEditing ? "ring-2 ring-[#00CCC0]" : ""} cursor-pointer`}
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(index, shortcutIndex)
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation()
                              handleKeyDown(e)
                            }}
                            tabIndex={0}
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{shortcut.name}</span>
                            <div
                              className={`px-3 py-1.5 ${isEditing ? "bg-[#00CCC0] text-black" : "bg-gray-100 dark:bg-gray-700"} min-w-[100px] rounded text-center font-sans text-sm tracking-wide shadow-sm transition-all`}
                            >
                              {isEditing ? (
                                <span className="animate-pulse">
                                  {t("dialogs.keyboardShortcuts.pressKeys", "Нажмите клавиши...")}
                                </span>
                              ) : (
                                <span className="font-medium tracking-wide">{shortcut.keys}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Нижняя часть с кнопками */}
          <div className="mt-auto flex flex-shrink-0 justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="cursor-pointer px-4"
                onClick={() => {
                  // Сбрасываем настройки к значениям по умолчанию
                  const freshPresets = createPresets(t)
                  setCategories(freshPresets[selectedPreset])
                  setEditingShortcut(null)
                  setListeningForKeys(false)
                }}
              >
                {t(
                  "dialogs.keyboardShortcuts.resetDefaults",
                  "Восстановление значений по умолчанию",
                )}
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer px-6"
                onClick={() => onOpenChange(false)}
              >
                {t("dialogs.keyboardShortcuts.cancel", "Отменить")}
              </Button>
            </div>
            <Button
              className="cursor-pointer bg-[#00CCC0] px-6 text-black hover:bg-[#00AAA0]"
              onClick={() => onOpenChange(false)}
            >
              {t("dialogs.keyboardShortcuts.ok", "OK")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
