import { useEffect, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useTranslation } from "react-i18next"

import { useModalContext } from "@/media-editor/dialogs/services/modal-provider"

/**
 * Хук для обработки горячих клавиш приложения
 */
export function useAppHotkeys() {
  const { handleOpenModal } = useModalContext()
  const [isEnabled, setIsEnabled] = useState(true)

  // Настройки пользователя (Option+Command+точка)
  useHotkeys(
    "alt+meta+.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (alt+meta+.)")
      handleOpenModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Альтернативный вариант для настроек пользователя
  useHotkeys(
    "option+command+.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (option+command+.)")
      handleOpenModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для настроек пользователя
  useHotkeys(
    "opt+cmd+.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (opt+cmd+.)")
      handleOpenModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для настроек пользователя с символами
  useHotkeys(
    "⌥⌘.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (⌥⌘.)")
      handleOpenModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для настроек пользователя с другим синтаксисом
  useHotkeys(
    "alt+command+period",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (alt+command+period)")
      handleOpenModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Настройки проекта (Option+Command+запятая)
  useHotkeys(
    "alt+meta+,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (alt+meta+,)")
      handleOpenModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Альтернативный вариант для настроек проекта
  useHotkeys(
    "option+command+,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (option+command+,)")
      handleOpenModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для настроек проекта
  useHotkeys(
    "opt+cmd+,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (opt+cmd+,)")
      handleOpenModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для настроек проекта с символами
  useHotkeys(
    "⌥⌘,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (⌥⌘,)")
      handleOpenModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для настроек проекта с другим синтаксисом
  useHotkeys(
    "alt+command+comma",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (alt+command+comma)")
      handleOpenModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Горячие клавиши (Option+Command+K)
  useHotkeys(
    "alt+meta+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (alt+meta+k)")
      handleOpenModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Альтернативный вариант для быстрых клавиш
  useHotkeys(
    "option+command+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (option+command+k)")
      handleOpenModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для быстрых клавиш
  useHotkeys(
    "opt+cmd+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (opt+cmd+k)")
      handleOpenModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для быстрых клавиш с символами
  useHotkeys(
    "⌥⌘k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (⌥⌘k)")
      handleOpenModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Еще один вариант для быстрых клавиш с другим синтаксисом
  useHotkeys(
    "alt+command+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (alt+command+k)")
      handleOpenModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [handleOpenModal, isEnabled]
  )

  // Тестовый обработчик для клавиши запятая
  useHotkeys(
    ",",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (,)")
      alert("Тестовая горячая клавиша сработала! (,)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled]
  )

  // Тестовый обработчик для клавиши k
  useHotkeys(
    "k",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (k)")
      alert("Тестовая горячая клавиша сработала! (k)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled]
  )

  // Тестовый обработчик для клавиши точка
  useHotkeys(
    ".",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (.)")
      alert("Тестовая горячая клавиша сработала! (.)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled]
  )

  // Тестовый обработчик для клавиши alt+k
  useHotkeys(
    "alt+k",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (alt+k)")
      alert("Тестовая горячая клавиша сработала! (alt+k)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled]
  )

  // Отключаем горячие клавиши, когда открыто модальное окно редактирования горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Если открыто модальное окно редактирования горячих клавиш, отключаем горячие клавиши
      if (e.key === "Escape") {
        setIsEnabled(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return null
}
