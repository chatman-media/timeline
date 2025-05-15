import { Bot, Send, StopCircle, User } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AiMessage } from "@/media-editor/ai/services/ai-service"
// Список доступных моделей ИИ
import { AI_MODELS } from "@/media-editor/ai/services/ai-service"
import { ClaudeEditSchemaService } from "@/media-editor/ai/services/claude-edit-schema-service"
import { CLAUDE_MODELS } from "@/media-editor/ai/services/claude-service"
import { ClaudeToolsHandler } from "@/media-editor/ai/services/claude-tools-handler"
import { EditSchemaAiService } from "@/media-editor/ai/services/edit-schema-ai-service"
import { useUserSettings } from "@/media-editor/browser/providers/user-settings-provider"
import { useModalContext } from "@/media-editor/dialogs/services/modal-provider"
import { useTimeline } from "@/media-editor/timeline/services"
import { ChatMessage } from "@/media-editor/timeline/services/timeline-machine"

const AVAILABLE_AGENTS = [
  { id: CLAUDE_MODELS.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", useTools: true },
  { id: CLAUDE_MODELS.CLAUDE_3_SONNET, name: "Claude 3 Sonnet", useTools: true },
  { id: CLAUDE_MODELS.CLAUDE_3_HAIKU, name: "Claude 3 Haiku", useTools: false },
  { id: CLAUDE_MODELS.CLAUDE_3_OPUS, name: "Claude 3 Opus", useTools: true },
  { id: AI_MODELS.GPT_4, name: "GPT-4", useTools: false },
  { id: AI_MODELS.GPT_3_5, name: "GPT-3.5 Turbo", useTools: false },
]

export function TimelineChat() {
  const { t } = useTranslation()
  const {
    chatMessages,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    selectAgent,
    editSegments,
  } = useTimeline()
  const { aiApiKey } = useUserSettings()
  const { handleOpenModal } = useModalContext()

  const [message, setMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const aiServiceRef = useRef<EditSchemaAiService>(EditSchemaAiService.getInstance())
  const claudeServiceRef = useRef<ClaudeEditSchemaService>(ClaudeEditSchemaService.getInstance())
  const toolsHandlerRef = useRef<ClaudeToolsHandler>(ClaudeToolsHandler.getInstance())

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

  // Обновляем API ключ при его изменении
  useEffect(() => {
    if (aiApiKey) {
      aiServiceRef.current.setApiKey(aiApiKey)
      claudeServiceRef.current.setApiKey(aiApiKey)
    }
  }, [aiApiKey])

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isProcessing) return

    // Проверяем, установлен ли API ключ
    if (!aiApiKey) {
      // Если API ключ не установлен, показываем диалог настроек
      handleOpenModal("user-settings")
      return
    }

    // Отправляем сообщение пользователя
    sendChatMessage(message)
    const userMessageText = message
    setMessage("")
    setIsProcessing(true)

    // Сбрасываем высоту textarea после очистки
    setTimeout(autoResizeTextarea, 0)

    // Фокус на поле ввода
    inputRef.current?.focus()

    // Получаем выбранную модель и проверяем, поддерживает ли она инструменты
    const modelId = selectedAgentId || CLAUDE_MODELS.CLAUDE_3_5_SONNET
    const selectedAgent = AVAILABLE_AGENTS.find((agent) => agent.id === modelId)
    const useTools = selectedAgent?.useTools || false

    // Определяем, какой сервис использовать
    const isClaudeModel = modelId.startsWith("claude")

    // Создаем обработчик ошибок
    const handleError = (error: any) => {
      // В случае ошибки показываем сообщение об ошибке
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: `Ошибка: ${error.message}`,
        sender: "agent",
        agentId: selectedAgentId || undefined,
        timestamp: new Date().toISOString(),
      }

      receiveChatMessage(errorMessage)
      setIsProcessing(false)
    }

    // Создаем обработчик завершения
    const handleComplete = () => {
      setIsProcessing(false)
    }

    if (isClaudeModel && useTools) {
      // Используем Claude с инструментами
      claudeServiceRef.current
        .sendRequestWithTools(userMessageText, editSegments, modelId)
        .then((response) => {
          let responseText = response.text

          // Если был использован инструмент, обрабатываем его
          if (response.toolUse) {
            // Добавляем информацию об использовании инструмента
            responseText = `${responseText}\n\n[Использован инструмент: ${response.toolUse.name}]\nПараметры: ${JSON.stringify(response.toolUse.input, null, 2)}`

            // Обрабатываем инструмент
            toolsHandlerRef.current
              .handleToolUse(response.toolUse, editSegments)
              .then((result) => {
                // Если есть обновленные сегменты, обновляем их в контексте
                if (result.updatedSegments) {
                  // Отправляем дополнительное сообщение с результатом
                  const resultMessage: ChatMessage = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    text: `[Результат выполнения инструмента]\n${JSON.stringify(result.result, null, 2)}`,
                    sender: "agent",
                    agentId: selectedAgentId || undefined,
                    timestamp: new Date().toISOString(),
                  }

                  // Обновляем сегменты в контексте
                  // TODO: Добавить метод для обновления сегментов в timeline-provider
                  // updateEditSegments(result.updatedSegments)

                  // Отправляем сообщение с результатом
                  setTimeout(() => {
                    receiveChatMessage(resultMessage)
                  }, 500)
                }
              })
              .catch((error) => {
                // Отправляем сообщение с ошибкой
                const errorMessage: ChatMessage = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  text: `[Ошибка при выполнении инструмента]\n${error.message}`,
                  sender: "agent",
                  agentId: selectedAgentId || undefined,
                  timestamp: new Date().toISOString(),
                }

                setTimeout(() => {
                  receiveChatMessage(errorMessage)
                }, 500)
              })
          }

          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: responseText,
            sender: "agent",
            agentId: selectedAgentId || undefined,
            timestamp: new Date().toISOString(),
          }

          receiveChatMessage(agentMessage)
        })
        .catch(handleError)
        .finally(handleComplete)
    } else if (isClaudeModel) {
      // Используем Claude без инструментов
      claudeServiceRef.current
        .sendRequest(userMessageText, editSegments, modelId)
        .then((responseText) => {
          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: responseText,
            sender: "agent",
            agentId: selectedAgentId || undefined,
            timestamp: new Date().toISOString(),
          }

          receiveChatMessage(agentMessage)
        })
        .catch(handleError)
        .finally(handleComplete)
    } else {
      // Используем обычный сервис для других моделей
      aiServiceRef.current
        .sendRequest(userMessageText, editSegments, modelId)
        .then((responseText) => {
          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            text: responseText,
            sender: "agent",
            agentId: selectedAgentId || undefined,
            timestamp: new Date().toISOString(),
          }

          receiveChatMessage(agentMessage)
        })
        .catch(handleError)
        .finally(handleComplete)
    }

    // Возвращаем пустую функцию для остановки обработки
    return () => {}
  }, [
    message,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    isProcessing,
    autoResizeTextarea,
    aiApiKey,
    handleOpenModal,
    editSegments,
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
                    // Если API ключ не установлен, показываем диалог настроек
                    if (!aiApiKey) {
                      handleOpenModal("user-settings")
                      return
                    }

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
                      ? `${AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.name}${
                        AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.useTools
                          ? " (с инструментами)"
                          : ""
                      }`
                      : `${AVAILABLE_AGENTS[0].name}${AVAILABLE_AGENTS[0].useTools ? " (с инструментами)" : ""}`
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
