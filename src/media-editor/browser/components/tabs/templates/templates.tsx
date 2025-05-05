import { JSX } from "react"

export interface SplitPoint {
  x: number // Координата X точки разделения (в процентах от 0 до 100)
  y: number // Координата Y точки разделения (в процентах от 0 до 100)
}

export interface MediaTemplate {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "custom"
  screens: number // Количество экранов/секций в шаблоне
  splitPoints?: SplitPoint[] // Координаты точек разделения (для нестандартных разделений)
  splitPosition?: number // Позиция разделения в процентах (от 0 до 100)
  render: () => JSX.Element
}

export const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: [
    // Шаблоны с 2 экранами
    {
      id: "split-vertical-landscape",
      split: "vertical",
      screens: 2,
      splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-600" />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-landscape",
      split: "horizontal",
      screens: 2,
      splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-600" />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
        </div>
      ),
    },
    // Диагональное разделение
    {
      id: "split-diagonal-landscape",
      split: "diagonal",
      screens: 2,
      splitPoints: [
        { x: 60, y: 0 }, // Начальная точка (60% от левого края, верх)
        { x: 40, y: 100 }, // Конечная точка (40% от левого края, низ)
      ],
      render: () => (
        <div className="relative h-full w-full">
          {/* Первый экран (левый) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 60% 0, 40% 100%, 0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", left: "-25%" }}>1</div>
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(59.8% 0, 60.2% 0, 40.2% 100%, 39.8% 100%)",
              opacity: 0.3,
            }}
          />

          {/* Второй экран (правый) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(60% 0, 100% 0, 100% 100%, 40% 100%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", left: "25%" }}>2</div>
          </div>
        </div>
      ),
    },
    // Шаблон с горизонтальным разделением сверху и вертикальным снизу
    {
      id: "split-mixed-1-landscape",
      split: "custom",
      screens: 3,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя секция */}
          <div
            className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблон с вертикальным разделением слева и двумя секциями справа
    {
      id: "split-mixed-2-landscape",
      split: "custom",
      screens: 3,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая секция */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "50%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблоны с 3 экранами
    {
      id: "split-vertical-3-landscape",
      split: "vertical",
      screens: 3,
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-3-landscape",
      split: "horizontal",
      screens: 3,
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              width: "100%",
              height: "33.33%",
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              height: "33.33%",
              background: "#2a2e36",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              height: "33.33%",
              background: "#23262b",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблоны с 4 экранами
    {
      id: "split-grid-2x2-landscape",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхний левый экран */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Верхний правый экран */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Нижний левый экран */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Нижний правый экран */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />
        </div>
      ),
    },
    {
      id: "split-vertical-4-landscape",
      split: "vertical",
      screens: 4,
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-1-3-landscape",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая большая секция */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "33.33%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Средняя правая секция */}
          <div
            className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              top: "33.33%",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Горизонтальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "66.66%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-3-1-right-landscape",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Правая большая секция */}
          <div
            className="absolute top-0 right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя левая секция */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "33.33%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Средняя левая секция */}
          <div
            className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              top: "33.33%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "66.66%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-1-3-bottom-landscape",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя секция */}
          <div
            className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "33.33%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя средняя секция */}
          <div
            className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              left: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Вертикальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "66.66%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-diagonal-cross-landscape",
      split: "diagonal",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя левая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 100% 0, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "5%", left: "calc(50% - 4px)" }}>1</div>
          </div>

          {/* Нижняя секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 100%, 100% 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", bottom: "5%", left: "calc(50% - 4px)" }}>2</div>
          </div>

          {/* Левая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(0 0, 0 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "35%", left: "15%" }}>3</div>
          </div>

          {/* Правая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(100% 0, 100% 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "35%", right: "15%" }}>4</div>
          </div>

          {/* Диагональная линия разделения 1 (верх-лево -> низ-право) */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(0 0, 1% 0, 100% 99%, 100% 100%, 99% 100%, 0 1%)",
              opacity: 0.3,
            }}
          />

          {/* Диагональная линия разделения 2 (верх-право -> низ-лево) */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(99% 0, 100% 0, 100% 1%, 1% 100%, 0 100%, 0 99%)",
              opacity: 0.3,
            }}
          />
        </div>
      ),
    },
    {
      id: "split-3-1-landscape",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя левая секция */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "0",
              left: "33.33%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя средняя секция */}
          <div
            className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              left: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "0",
              left: "66.66%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя секция */}
          <div
            className="absolute right-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
  ],
  portrait: [
    // Шаблоны с 2 экранами
    {
      id: "split-vertical-portrait",
      split: "vertical",
      screens: 2,
      splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-portrait",
      split: "horizontal",
      screens: 2,
      splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
        </div>
      ),
    },
    // Диагональное разделение
    {
      id: "split-diagonal-portrait",
      split: "diagonal",
      screens: 2,
      splitPoints: [
        { x: 0, y: 40 }, // Начальная точка (левый край, 40% от верха)
        { x: 100, y: 60 }, // Конечная точка (правый край, 60% от верха)
      ],
      render: () => (
        <div className="relative h-full w-full">
          {/* Первый экран (верхний) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 40%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", top: "-25%" }}>1</div>
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(0 39.8%, 0 40.2%, 100% 60.2%, 100% 59.8%)",
              opacity: 0.3,
            }}
          />

          {/* Второй экран (нижний) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(0 40%, 100% 60%, 100% 100%, 0 100%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", top: "25%" }}>2</div>
          </div>
        </div>
      ),
    },
    // Шаблон с горизонтальным разделением сверху и вертикальным снизу
    {
      id: "split-mixed-1-portrait",
      split: "custom",
      screens: 3,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя секция */}
          <div
            className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблон с вертикальным разделением слева и двумя секциями справа
    {
      id: "split-mixed-2-portrait",
      split: "custom",
      screens: 3,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая секция */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "50%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблоны с 3 экранами
    {
      id: "split-vertical-3-portrait",
      split: "vertical",
      screens: 3,
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-3-portrait",
      split: "horizontal",
      screens: 3,
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблоны с 4 экранами
    {
      id: "split-grid-2x2-portrait",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхний левый экран */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Верхний правый экран */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Нижний левый экран */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Нижний правый экран */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />
        </div>
      ),
    },
    {
      id: "split-horizontal-4-portrait",
      split: "horizontal",
      screens: 4,
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "25%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "25%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "25%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "25%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-1-3-portrait",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя большая секция */}
          <div
            className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "33.33%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя средняя секция */}
          <div
            className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              left: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Вертикальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "66.66%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-3-1-portrait",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая верхняя секция */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "33.33%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Левая средняя секция */}
          <div
            className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              top: "33.33%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "66.66%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Левая нижняя секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Правая секция */}
          <div
            className="absolute top-0 right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },

    // Перевернутые шаблоны с 4 экранами
    {
      id: "split-3-1-right-portrait",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая секция */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Правая верхняя секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "33.33%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Правая средняя секция */}
          <div
            className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              top: "33.33%",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "66.66%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Правая нижняя секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-1-3-bottom-portrait",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Нижняя большая секция */}
          <div
            className="absolute right-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Верхняя левая секция */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "0",
              left: "33.33%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя средняя секция */}
          <div
            className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              left: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "0",
              left: "66.66%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-diagonal-cross-portrait",
      split: "diagonal",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя левая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 100% 0, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "10%", left: "calc(50% - 4px)" }}>1</div>
          </div>

          {/* Нижняя секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 100%, 100% 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", bottom: "10%", left: "calc(50% - 4px)" }}>2</div>
          </div>

          {/* Левая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(0 0, 0 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "calc(50%-12px)", left: "15%" }}>3</div>
          </div>

          {/* Правая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(100% 0, 100% 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "calc(50%-12px)", right: "15%" }}>4</div>
          </div>

          {/* Диагональная линия разделения 1 (верх-лево -> низ-право) */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(0 0, 0.5% 0, 100% 99.5%, 100% 100%, 99.5% 100%, 0 0.5%)",
              opacity: 0.3,
            }}
          />

          {/* Диагональная линия разделения 2 (верх-право -> низ-лево) */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(99.5% 0, 100% 0, 100% 0.5%, 0.5% 100%, 0 100%, 0 99.5%)",
              opacity: 0.3,
            }}
          />
        </div>
      ),
    },
  ],
  square: [
    // Шаблоны с 2 экранами
    {
      id: "split-vertical-square",
      split: "vertical",
      screens: 2,
      splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-square",
      split: "horizontal",
      screens: 2,
      splitPosition: 50, // Позиция разделения в процентах (50% - посередине)
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
        </div>
      ),
    },
    // Диагональное разделение (горизонтальная ось)
    {
      id: "split-diagonal-square",
      split: "diagonal",
      screens: 2,
      splitPoints: [
        { x: 0, y: 35 }, // Начальная точка (левый край, 35% от верха)
        { x: 100, y: 65 }, // Конечная точка (правый край, 65% от верха)
      ],
      render: () => (
        <div className="relative h-full w-full">
          {/* Первый экран (верхний) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 100% 0, 100% 65%, 0 35%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", top: "-25%" }}>1</div>
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(0 34.8%, 0 35.2%, 100% 65.2%, 100% 64.8%)",
              opacity: 0.3,
            }}
          />

          {/* Второй экран (нижний) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(0 35%, 100% 65%, 100% 100%, 0 100%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", top: "25%" }}>2</div>
          </div>
        </div>
      ),
    },
    // Диагональное разделение (вертикальная ось)
    {
      id: "split-diagonal-vertical-square",
      split: "diagonal",
      screens: 2,
      splitPoints: [
        { x: 65, y: 0 }, // Начальная точка (65% от левого края, верх)
        { x: 35, y: 100 }, // Конечная точка (35% от левого края, низ)
      ],
      render: () => (
        <div className="relative h-full w-full">
          {/* Первый экран (левый) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 65% 0, 35% 100%, 0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", left: "-25%" }}>1</div>
          </div>

          {/* Линия разделения */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(64.8% 0, 65.2% 0, 35.2% 100%, 34.8% 100%)",
              opacity: 0.3,
            }}
          />

          {/* Второй экран (правый) */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(65% 0, 100% 0, 100% 100%, 35% 100%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", left: "25%" }}>2</div>
          </div>
        </div>
      ),
    },
    // Четвертное разделение (крестом)
    {
      id: "split-quad-square",
      split: "diagonal",
      screens: 4,
      splitPoints: [
        { x: 50, y: 0 }, // Верхняя точка
        { x: 50, y: 100 }, // Нижняя точка
        { x: 0, y: 50 }, // Левая точка
        { x: 100, y: 50 }, // Правая точка
      ],
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхний левый экран */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 50% 0, 50% 50%, 0 50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", left: "-25%", top: "-25%" }}>1</div>
          </div>

          {/* Верхний правый экран */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(50% 0, 100% 0, 100% 50%, 50% 50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", left: "25%", top: "-25%" }}>2</div>
          </div>

          {/* Нижний левый экран */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 50%, 50% 50%, 50% 100%, 0 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", left: "-25%", top: "25%" }}>3</div>
          </div>

          {/* Нижний правый экран */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            <div style={{ position: "relative", left: "25%", top: "25%" }}>4</div>
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />
        </div>
      ),
    },
    // Шаблон с горизонтальным разделением сверху и вертикальным снизу
    {
      id: "split-mixed-1-square",
      split: "custom",
      screens: 3,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя секция */}
          <div
            className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблон с вертикальным разделением слева и двумя секциями справа
    {
      id: "split-mixed-2-square",
      split: "custom",
      screens: 3,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая секция */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "50%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблоны с 3 экранами
    {
      id: "split-vertical-3-square",
      split: "vertical",
      screens: 3,
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-3-square",
      split: "horizontal",
      screens: 3,
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },

    // Шаблоны с 4 экранами
    {
      id: "split-vertical-4-square",
      split: "vertical",
      screens: 4,
      render: () => (
        <div className="flex h-full w-full">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
          <div className="h-full w-px bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-horizontal-4-square",
      split: "horizontal",
      screens: 4,
      render: () => (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "25%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "25%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "25%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
          <div className="h-px w-full bg-gray-400" style={{ opacity: 0.3 }} />
          <div
            className="flex flex-1 items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "25%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-1-3-square",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Левая большая секция */}
          <div
            className="absolute top-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "33.33%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Средняя правая секция */}
          <div
            className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              top: "33.33%",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Горизонтальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "66.66%",
              right: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-3-1-square",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя левая секция */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Вертикальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "0",
              left: "33.33%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя средняя секция */}
          <div
            className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              left: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "0",
              left: "66.66%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя правая секция */}
          <div
            className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя секция */}
          <div
            className="absolute right-0 bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },

    // Перевернутые шаблоны с 4 экранами
    {
      id: "split-3-1-right-square",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Правая большая секция */}
          <div
            className="absolute top-0 right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>

          {/* Вертикальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: "50%",
              opacity: 0.3,
            }}
          />

          {/* Верхняя левая секция */}
          <div
            className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "33.33%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Средняя левая секция */}
          <div
            className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "50%",
              height: "33.33%",
              top: "33.33%",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Горизонтальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "50%",
              height: "1px",
              top: "66.66%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "50%",
              height: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>
        </div>
      ),
    },
    {
      id: "split-1-3-bottom-square",
      split: "custom",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя секция */}
          <div
            className="absolute top-0 right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              height: "50%",
              borderTop: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            1
          </div>

          {/* Горизонтальная линия разделения */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: "50%",
              left: "0",
              opacity: 0.3,
            }}
          />

          {/* Нижняя левая секция */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            2
          </div>

          {/* Вертикальная линия разделения 1 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "33.33%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя средняя секция */}
          <div
            className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              width: "33.33%",
              height: "50%",
              left: "33.33%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            3
          </div>

          {/* Вертикальная линия разделения 2 */}
          <div
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "50%",
              top: "50%",
              left: "66.66%",
              opacity: 0.3,
            }}
          />

          {/* Нижняя правая секция */}
          <div
            className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              width: "33.33%",
              height: "50%",
              borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
              borderRight: "1px solid rgba(156, 163, 175, 0.3)",
            }}
          >
            4
          </div>
        </div>
      ),
    },
    {
      id: "split-diagonal-cross-square",
      split: "diagonal",
      screens: 4,
      render: () => (
        <div className="relative h-full w-full">
          {/* Верхняя левая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(0 0, 100% 0, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "10%", left: "calc(50% - 4px)" }}>1</div>
          </div>

          {/* Нижняя секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#2a2e36",
              clipPath: "polygon(0 100%, 100% 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", bottom: "10%", left: "calc(50% - 4px)" }}>2</div>
          </div>

          {/* Левая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(0 0, 0 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "calc(50%-12px)", left: "15%" }}>3</div>
          </div>

          {/* Правая секция */}
          <div
            className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
            style={{
              background: "#23262b",
              clipPath: "polygon(100% 0, 100% 100%, 50% 50%)",
              border: "1px solid rgba(156, 163, 175, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <div style={{ position: "absolute", top: "calc(50%-12px)", right: "15%" }}>4</div>
          </div>

          {/* Диагональная линия разделения 1 (верх-лево -> низ-право) */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(0 0, 1% 0, 100% 99%, 100% 100%, 99% 100%, 0 1%)",
              opacity: 0.3,
            }}
          />

          {/* Диагональная линия разделения 2 (верх-право -> низ-лево) */}
          <div
            className="absolute inset-0 z-10 bg-gray-400"
            style={{
              clipPath: "polygon(99% 0, 100% 0, 100% 1%, 1% 100%, 0 100%, 0 99%)",
              opacity: 0.3,
            }}
          />
        </div>
      ),
    },
  ],
}
