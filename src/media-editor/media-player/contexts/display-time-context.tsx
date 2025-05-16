import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

interface DisplayTimeContextType {
  displayTime: number
  setDisplayTime: (time: number) => void
}

const DisplayTimeContext = createContext<DisplayTimeContextType | undefined>(undefined)

export function DisplayTimeProvider({ children }: { children: ReactNode }) {
  const [displayTime, setDisplayTime] = useState(0)

  // Используем ref для хранения последнего запрошенного времени
  // Это позволит нам избежать множественных обновлений состояния
  const requestedTimeRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lastUpdateTimeRef = useRef<number>(0)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef<boolean>(false)

  // Функция для фактического обновления состояния
  const updateDisplayTime = useCallback(() => {
    // Если нет запрошенного времени или уже идет обновление, выходим
    if (requestedTimeRef.current === null || isUpdatingRef.current) return

    // Устанавливаем флаг, что идет обновление
    isUpdatingRef.current = true

    // Получаем запрошенное время
    const time = requestedTimeRef.current

    // Сбрасываем запрошенное время
    requestedTimeRef.current = null

    // Проверяем, изменилось ли время существенно (более 0.5 секунды)
    const timeDiff = Math.abs(time - lastTimeRef.current)

    if (timeDiff > 0.5) {
      // Обновляем последнее время
      lastTimeRef.current = time

      // Логируем только в режиме разработки и только при значительных изменениях
      if (process.env.NODE_ENV === "development" && timeDiff > 1) {
        console.log(
          `[DisplayTimeProvider] Обновление displayTime: ${time.toFixed(3)} (разница: ${timeDiff.toFixed(3)})`,
        )
      }

      // Обновляем состояние
      setDisplayTime(time)
    }

    // Сбрасываем флаг обновления после небольшой задержки
    setTimeout(() => {
      isUpdatingRef.current = false

      // Если за это время появилось новое запрошенное время, запускаем обновление
      if (requestedTimeRef.current !== null) {
        updateDisplayTime()
      }
    }, 100)
  }, [])

  // Функция для запроса обновления времени с увеличенным дебаунсингом
  const setDisplayTimeWithDebounce = useCallback(
    (time: number) => {
      // Сохраняем запрошенное время
      requestedTimeRef.current = time

      // Проверяем, прошло ли достаточно времени с последнего обновления (минимум 300мс)
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current

      // Если уже идет обновление или прошло мало времени, не запускаем новое обновление
      if (isUpdatingRef.current || timeSinceLastUpdate < 300) return

      // Проверяем, изменилось ли время существенно (более 0.5 секунды)
      const lastTime = lastTimeRef.current || 0
      const timeDiff = Math.abs(time - lastTime)

      // Если время изменилось незначительно, пропускаем обновление
      if (timeDiff < 0.5) return

      // Обновляем время последнего обновления
      lastUpdateTimeRef.current = now

      // Очищаем предыдущий таймаут, если он был
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      // Запускаем обновление с увеличенной задержкой
      updateTimeoutRef.current = setTimeout(() => {
        updateDisplayTime()
        updateTimeoutRef.current = null
      }, 200) // Увеличиваем задержку до 200мс
    },
    [updateDisplayTime],
  )

  // Очищаем таймаут при размонтировании компонента
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  return (
    <DisplayTimeContext.Provider
      value={{ displayTime, setDisplayTime: setDisplayTimeWithDebounce }}
    >
      {children}
    </DisplayTimeContext.Provider>
  )
}

export function useDisplayTime() {
  const context = useContext(DisplayTimeContext)
  if (context === undefined) {
    throw new Error("useDisplayTime must be used within a DisplayTimeProvider")
  }
  return context
}
