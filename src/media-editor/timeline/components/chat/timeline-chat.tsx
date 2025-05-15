import { Bot, Send, StopCircle, User } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTimeline } from "@/media-editor/timeline/services"
import { ChatMessage } from "@/media-editor/timeline/services/timeline-machine"

// Список доступных моделей ИИ (заглушка)
const AVAILABLE_AGENTS = [
  { id: "agent-1", name: "Claude 3.7 Sonnet" },
  { id: "agent-2", name: "GPT-4" },
  { id: "agent-3", name: "Claude 3 Opus" },
  { id: "agent-4", name: "Gemini 1.5 Pro" },
  { id: "agent-5", name: "Claude 3 Haiku" },
]

export function TimelineChat() {
  const { t } = useTranslation()
  const { chatMessages, sendChatMessage, receiveChatMessage, selectedAgentId, selectAgent } =
    useTimeline()
  const [message, setMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Прокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Функция для автоматического изменения высоты textarea
  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      // Сбрасываем высоту до минимальной
      inputRef.current.style.height = "auto"
      // Устанавливаем высоту по содержимому (scrollHeight)
      const newHeight = Math.min(Math.max(40, inputRef.current.scrollHeight), 120) // Минимум 40px, максимум 120px
      inputRef.current.style.height = `${newHeight}px`
    }
  }, [inputRef])

  // Прокрутка при добавлении новых сообщений
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, scrollToBottom])

  // Инициализация автоматического изменения высоты textarea
  useEffect(() => {
    // Вызываем функцию при монтировании компонента
    autoResizeTextarea()
  }, [autoResizeTextarea])

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isProcessing) return

    // Отправляем сообщение пользователя
    sendChatMessage(message)
    setMessage("")
    setIsProcessing(true)

    // Сбрасываем высоту textarea после очистки
    setTimeout(autoResizeTextarea, 0)

    // Фокус на поле ввода
    inputRef.current?.focus()

    // Имитация ответа от агента (в реальном приложении здесь будет запрос к API)
    const timeoutId = setTimeout(() => {
      // Получаем название выбранного языка для логирования (если нужно)
      // const agentName = AVAILABLE_AGENTS.find(a => a.id === selectedAgentId)?.name || "Русский"

      // Генерируем ответ в зависимости от выбранного языка
      let responseText = "Это ответ на ваше сообщение."

      switch (selectedAgentId) {
      case "agent-1":
        responseText = "Я Claude 3.7 Sonnet. Чем могу помочь вам сегодня?"
        break
      case "agent-2":
        responseText = "Я GPT-4. Готов ответить на ваши вопросы и помочь с задачами."
        break
      case "agent-3":
        responseText = "Я Claude 3 Opus, самая мощная модель от Anthropic. Как я могу вам помочь?"
        break
      case "agent-4":
        responseText = "Я Gemini 1.5 Pro от Google. Чем могу быть полезен?"
        break
      case "agent-5":
        responseText = "Я Claude 3 Haiku, быстрая и эффективная модель для простых задач."
        break
      default:
        responseText = "Готов помочь вам с вашими задачами."
      }

      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: responseText,
        sender: "agent",
        agentId: selectedAgentId || undefined,
        timestamp: new Date().toISOString(),
      }

      receiveChatMessage(agentMessage)
      setIsProcessing(false)
    }, 2000)

    // Возвращаем функцию для остановки обработки
    return () => clearTimeout(timeoutId)
  }, [
    message,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    isProcessing,
    autoResizeTextarea,
  ])

  // Обработчик остановки обработки
  const handleStopProcessing = useCallback(() => {
    setIsProcessing(false)
  }, [])

  // Обработчик нажатия Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  // Форматирование времени
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <TooltipProvider>
      <div className="relative z-50 flex h-full min-h-[200px] flex-col bg-[#1a1a1a] text-white">
        {/* Сообщения */}
        <div className="scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent max-h-[calc(100%-80px)] flex-1 overflow-y-auto p-2">
          {chatMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              {t("timeline.chat.noMessages", "Нет сообщений. Начните диалог.")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group flex max-w-[90%] flex-col rounded-lg p-2.5 ${
                    msg.sender === "user"
                      ? "ml-auto bg-[#2563eb] text-white"
                      : "bg-[#2a2a2a] text-white"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      {msg.sender === "user" ? (
                        <User className="h-3.5 w-3.5 text-white/80" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-white/80" />
                      )}
                    </div>
                    <div className="text-sm leading-relaxed">{msg.text}</div>
                  </div>
                  <div className="mt-1.5 text-right text-[10px] text-gray-300 opacity-0 transition-opacity group-hover:opacity-100">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex max-w-[90%] flex-col rounded-lg bg-[#2a2a2a] p-2.5 text-white">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white/80" />
                    </div>
                    <div className="text-sm">
                      <span className="inline-block animate-pulse">
                        {t("timeline.chat.processing", "Обработка...")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Ввод сообщения и выбор агента */}
        <div className="sticky bottom-0 border-t border-[#333] bg-[#1a1a1a] p-1.5">
          <div className="relative">
            {/* Интегрированное поле ввода с селектором модели */}
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    // Вызываем функцию изменения высоты при изменении текста
                    setTimeout(autoResizeTextarea, 0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("timeline.chat.messagePlaceholder", "Type your message here...")}
                  className="min-h-[40px] w-full resize-none rounded-md border border-[#444] bg-[#2a2a2a] py-2 pr-10 pl-3 text-sm text-white focus:outline-none"
                  disabled={isProcessing}
                  rows={1}
                />

                {/* Кнопка отправки/остановки (внутри поля ввода) */}
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                  {isProcessing ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleStopProcessing}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-full p-0 text-gray-400 hover:bg-[#444] hover:text-white"
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{t("timeline.chat.stop", "Остановить")}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim()}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 rounded-full p-0 text-gray-400 hover:bg-[#444] hover:text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{t("timeline.chat.send", "Отправить")}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {/* Селектор модели (под полем ввода) - в виде textarea */}
            <div className="mt-1.5 flex items-center">
              <div className="relative w-full">
                <textarea
                  readOnly
                  onClick={() => {
                    // Открываем выпадающий список при клике
                    const nextAgentIndex =
                      AVAILABLE_AGENTS.findIndex((a) => a.id === selectedAgentId) + 1
                    const nextAgent =
                      AVAILABLE_AGENTS[
                        nextAgentIndex >= AVAILABLE_AGENTS.length ? 0 : nextAgentIndex
                      ]
                    selectAgent(nextAgent.id)
                  }}
                  className="h-10 w-full resize-none rounded-md border border-[#444] bg-[#2a2a2a] px-3 py-2 text-sm text-white hover:bg-[#333] focus:outline-none"
                  value={
                    selectedAgentId
                      ? AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.name
                      : AVAILABLE_AGENTS[0].name
                  }
                />
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="#888"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
