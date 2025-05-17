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
  // Добавляем sectorDisplayTimes для хранения отдельных значений для каждого сектора
  sectorDisplayTimes: Record<string, number>
  setDisplayTime: (time: number, isActiveOnly?: boolean, sectorId?: string) => void
}

const DisplayTimeContext = createContext<DisplayTimeContextType | undefined>(undefined)

export function DisplayTimeProvider({ children }: { children: ReactNode }) {
  const [displayTime, setDisplayTime] = useState(0)

  // Добавляем состояние для хранения отдельных значений displayTime для каждого сектора
  const [sectorDisplayTimes, setSectorDisplayTimes] = useState<Record<string, number>>({})

  // Используем ref для хранения последнего запрошенного времени, флага isActiveOnly и sectorId
  // Это позволит нам избежать множественных обновлений состояния
  const requestedTimeRef = useRef<{
    time: number
    isActiveOnly: boolean
    sectorId?: string
  } | null>(null)
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

    // Получаем запрошенное время, флаг isActiveOnly и sectorId
    const { time, isActiveOnly, sectorId } = requestedTimeRef.current

    // Сбрасываем запрошенное время
    requestedTimeRef.current = null

    // Проверяем, изменилось ли время существенно
    const timeDiff = Math.abs(time - lastTimeRef.current)

    // Логируем обновления displayTime только в 5% случаев для уменьшения спама
    if (Math.random() < 0.05) {
      console.log(
        `[DisplayTimeProvider] Обновление displayTime: ${time.toFixed(3)} (разница: ${timeDiff.toFixed(3)}, isActiveOnly=${isActiveOnly}, sectorId=${sectorId || "не указан"}, stack=${new Error().stack?.split("\n").slice(2, 4).join(" <- ")})`,
      )
    }

    // Если указан sectorId, обновляем только значение для этого сектора
    if (sectorId) {
      // Проверяем, изменилось ли время существенно для этого сектора
      const prevSectorTime = sectorDisplayTimes[sectorId] || 0
      const sectorTimeDiff = Math.abs(time - prevSectorTime)

      // Для активного сектора используем меньший порог изменения времени
      // Это обеспечит плавное движение бара, но предотвратит слишком частые обновления
      const minSectorTimeDiff = isActiveOnly ? 0.02 : 0.1
      if (isActiveOnly || sectorTimeDiff > minSectorTimeDiff) {
        // Обновляем значение displayTime для указанного сектора
        setSectorDisplayTimes((prev) => ({
          ...prev,
          [sectorId]: time,
        }))

        // Логируем только в 5% случаев для уменьшения спама
        if (Math.random() < 0.05) {
          console.log(
            `[DisplayTimeProvider] Обновлено значение displayTime для сектора ${sectorId}: ${time.toFixed(3)}`,
          )
        }

        // Если isActiveOnly=false, также обновляем глобальное значение displayTime
        if (!isActiveOnly) {
          setDisplayTime(time)
          // Логируем только в 5% случаев для уменьшения спама
          if (Math.random() < 0.05) {
            console.log(
              `[DisplayTimeProvider] Обновлено глобальное значение displayTime: ${time.toFixed(3)}`,
            )
          }
        }

        // Отправляем событие для обновления только активного сектора, если isActiveOnly=true
        // и указан sectorId - это гарантирует, что обновление будет только для конкретного сектора
        // Отправляем событие только в 2% случаев для минимизации количества событий
        if (
          isActiveOnly &&
          sectorId &&
          typeof window !== "undefined" &&
          window.dispatchEvent &&
          Math.random() < 0.02
        ) {
          // Отправляем событие display-time-change для обновления только активного сектора
          window.dispatchEvent(
            new CustomEvent("display-time-change", {
              detail: {
                time: time,
                isActiveOnly: true,
                sectorId: sectorId,
              },
            }),
          )

          // Логируем только в 1% случаев для минимизации спама
          if (Math.random() < 0.01) {
            console.log(
              `[DisplayTimeProvider] Отправлено событие display-time-change с временем ${time.toFixed(3)} (isActiveOnly=true, sectorId=${sectorId})`,
            )
          }
        }
      }
    } else {
      // Если sectorId не указан и isActiveOnly=false, обновляем глобальное значение displayTime
      // Для активного сектора используем меньший порог изменения времени
      if (!isActiveOnly && timeDiff > 0.1) {
        setDisplayTime(time)
        // Логируем только в 5% случаев для уменьшения спама
        if (Math.random() < 0.05) {
          console.log(
            `[DisplayTimeProvider] Обновлено только глобальное значение displayTime: ${time.toFixed(3)}`,
          )
        }
      }
    }

    // Сбрасываем флаг обновления после увеличенной задержки
    setTimeout(() => {
      isUpdatingRef.current = false

      // Если за это время появилось новое запрошенное время, запускаем обновление
      if (requestedTimeRef.current !== null) {
        updateDisplayTime()
      }
    }, 300) // Увеличиваем задержку до 300мс для большего дебаунсинга
  }, [sectorDisplayTimes])

  // Функция для запроса обновления времени с увеличенным дебаунсингом
  const setDisplayTimeWithDebounce = useCallback(
    (time: number, isActiveOnly?: boolean, sectorId?: string) => {
      // Для активного сектора используем меньший порог изменения времени
      const lastTime = lastTimeRef.current || 0
      const timeDiff = Math.abs(time - lastTime)

      // Для активного сектора с isActiveOnly=true используем меньший порог изменения
      // Это обеспечит плавное движение бара, но предотвратит слишком частые обновления
      const minTimeDiff = isActiveOnly ? 0.02 : 0.1
      if (timeDiff < minTimeDiff) return

      // Проверяем, прошло ли достаточно времени с последнего обновления
      // Для активного сектора используем меньший интервал, но не слишком маленький
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current
      const minUpdateInterval = isActiveOnly ? 150 : 300

      // Если уже идет обновление или прошло мало времени, не запускаем новое обновление
      if (isUpdatingRef.current || timeSinceLastUpdate < minUpdateInterval) return

      // Сохраняем запрошенное время, флаг isActiveOnly и sectorId
      requestedTimeRef.current = {
        time,
        isActiveOnly: isActiveOnly === true,
        sectorId,
      }

      // Обновляем время последнего обновления
      lastUpdateTimeRef.current = now

      // Обновляем последнее время
      lastTimeRef.current = time

      // Очищаем предыдущий таймаут, если он был
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      // Запускаем обновление с увеличенной задержкой
      // Для активного сектора используем меньшую задержку, но не слишком маленькую
      const updateDelay = isActiveOnly ? 200 : 400
      updateTimeoutRef.current = setTimeout(() => {
        updateDisplayTime()
        updateTimeoutRef.current = null
      }, updateDelay)
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
      value={{
        displayTime,
        sectorDisplayTimes,
        setDisplayTime: setDisplayTimeWithDebounce,
      }}
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
