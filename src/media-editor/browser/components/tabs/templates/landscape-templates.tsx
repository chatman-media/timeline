import { MediaTemplate } from "./templates"

export const landscapeTemplates: MediaTemplate[] = [
  // Шаблоны с 2 экранами (с возможностью изменения размеров)
  {
    id: "split-vertical-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 50, // Позиция разделения в процентах (50% - посередине),
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
    resizable: true,
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
    resizable: true,
    screens: 2,
    splitPoints: [
      { x: 66.67, y: 0 }, // Начальная точка (2/3 от левого края, верх)
      { x: 33.33, y: 100 }, // Конечная точка (1/3 от левого края, низ)
    ],
    render: () => (
      <div className="relative h-full w-full">
        {/* Первый экран (левый) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            clipPath: "polygon(0 0, 66.67% 0, 33.33% 100%, 0 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          <div style={{ position: "relative", left: "-15%" }}>1</div>
        </div>

        {/* Линия разделения */}
        <div
          className="absolute inset-0 z-10 bg-gray-400"
          style={{
            clipPath: "polygon(66.47% 0, 66.87% 0, 33.53% 100%, 33.13% 100%)",
            opacity: 0.3,
          }}
        />

        {/* Второй экран (правый) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            clipPath: "polygon(66.67% 0, 100% 0, 100% 100%, 33.33% 100%)",
            border: "1px solid rgba(156, 163, 175, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", left: "30%" }}>2</div>
        </div>
      </div>
    ),
  },
  // Шаблон с горизонтальным разделением сверху и вертикальным снизу
  {
    id: "split-mixed-1-landscape",
    split: "custom",
    resizable: true,
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
    resizable: true,
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
    resizable: true,
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
    resizable: true,
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
    resizable: true,
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
    resizable: true,
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

  // Шаблоны с 5 экранами - вариант 1 (1 большой слева, 4 маленьких справа)
  {
    id: "split-custom-5-1-landscape",
    split: "custom",
    resizable: true,
    screens: 5,
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

        {/* Нижняя правая секция - верхняя левая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "50%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Нижняя правая секция - верхняя правая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "75%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Вертикальная линия разделения в нижней правой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "50%",
            left: "75%",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальная линия разделения в нижней правой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "75%",
            right: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя правая секция - нижняя */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 2 (4 маленьких слева, 1 большой справа)
  {
    id: "split-custom-5-2-landscape",
    split: "custom",
    resizable: true,
    screens: 5,
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
          5
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
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Горизонтальная линия разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "50%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя левая секция - верхняя левая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "0",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Нижняя левая секция - верхняя правая */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "25%",
          }}
        >
          3
        </div>

        {/* Вертикальная линия разделения в нижней левой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "25%",
            top: "50%",
            left: "25%",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальная линия разделения в нижней левой секции */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "50%",
            height: "1px",
            top: "75%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Нижняя левая секция - нижняя */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>
      </div>
    ),
  },

  // Шаблоны с 5 экранами - вариант 3 (средний на всю ширину, верхний и нижний ряды по 2 экрана)
  {
    id: "split-custom-5-3-landscape",
    split: "custom",
    resizable: true,
    screens: 5,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
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

        {/* Верхний правый экран */}
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

        {/* Средний экран на всю ширину */}
        <div
          className="absolute right-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            height: "33.33%",
            top: "33.33%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Нижний левый экран */}
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
          4
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "50%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Горизонтальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "33.33%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "66.66%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "33.33%",
            top: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "33.33%",
            bottom: "0",
            left: "50%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },
  {
    id: "split-1-3-landscape",
    split: "custom",
    resizable: true,
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
    resizable: true,
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
    resizable: true,
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
    id: "split-3-1-landscape",
    split: "custom",
    resizable: true,
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

  // Шаблон с 6 экранами (3x2)
  {
    id: "split-grid-3x2-landscape",
    split: "custom",
    resizable: true,
    screens: 6,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний левый экран */}
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

        {/* Верхний средний экран */}
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

        {/* Верхний правый экран */}
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

        {/* Нижний левый экран */}
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
          4
        </div>

        {/* Нижний средний экран */}
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
          5
        </div>

        {/* Нижний правый экран */}
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
          6
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

        {/* Вертикальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "33.33%",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия разделения 2 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "66.66%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 9 экранами (3x3)
  {
    id: "split-grid-3x3-landscape",
    split: "custom",
    resizable: true,
    screens: 9,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний ряд */}
        {/* Верхний левый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний средний экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "33.33%",
            left: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Верхний правый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Средний ряд */}
        {/* Средний левый экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "33.33%",
            top: "33.33%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Средний средний экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "33.33%",
            top: "33.33%",
            left: "33.33%",
          }}
        >
          5
        </div>

        {/* Средний правый экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "33.33%",
            top: "33.33%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Нижний ряд */}
        {/* Нижний левый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          7
        </div>

        {/* Нижний средний экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "33.33%",
            height: "33.33%",
            left: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          8
        </div>

        {/* Нижний правый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "33.33%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          9
        </div>

        {/* Горизонтальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "33.33%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "66.66%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "33.33%",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "66.66%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 10 экранами (5x2) для широкоэкранного формата
  {
    id: "split-grid-5x2-landscape",
    split: "custom",
    resizable: true,
    screens: 10,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний ряд */}
        {/* Верхний первый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний второй экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            left: "20%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Верхний третий экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            left: "40%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Верхний четвертый экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            left: "60%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Верхний пятый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Нижний ряд */}
        {/* Нижний первый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Нижний второй экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            left: "20%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          7
        </div>

        {/* Нижний третий экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            left: "40%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          8
        </div>

        {/* Нижний четвертый экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "20%",
            height: "50%",
            left: "60%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          9
        </div>

        {/* Нижний пятый экран */}
        <div
          className="absolute bottom-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "20%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          10
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

        {/* Вертикальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "20%",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "40%",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "60%",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "80%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 12 экранами (4x3) для широкоэкранного формата
  {
    id: "split-grid-4x3-landscape",
    split: "custom",
    resizable: true,
    screens: 12,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний ряд */}
        {/* Верхний первый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний второй экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "33.33%",
            left: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Верхний третий экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "33.33%",
            left: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Верхний четвертый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "33.33%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Средний ряд */}
        {/* Средний первый экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "33.33%",
            top: "33.33%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Средний второй экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "33.33%",
            top: "33.33%",
            left: "25%",
          }}
        >
          6
        </div>

        {/* Средний третий экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "33.33%",
            top: "33.33%",
            left: "50%",
          }}
        >
          7
        </div>

        {/* Средний четвертый экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "33.33%",
            top: "33.33%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          8
        </div>

        {/* Нижний ряд */}
        {/* Нижний первый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          9
        </div>

        {/* Нижний второй экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "33.33%",
            left: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          10
        </div>

        {/* Нижний третий экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "33.33%",
            left: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          11
        </div>

        {/* Нижний четвертый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "33.33%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          12
        </div>

        {/* Горизонтальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "33.33%",
            left: "0",
            opacity: 0.3,
          }}
        />
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "66.66%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "25%",
            opacity: 0.3,
          }}
        />
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
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "75%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 25 экранами (5x5) для широкоэкранного формата
  {
    id: "split-grid-5x5-landscape",
    split: "custom",
    resizable: true,
    screens: 25,
    render: () => (
      <div className="relative h-full w-full">
        {/* Создаем сетку 5x5 */}
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <>
            {Array.from({ length: 5 }).map((_, colIndex) => {
              const cellIndex = rowIndex * 5 + colIndex + 1;
              const isEvenCell = (rowIndex + colIndex) % 2 === 0;
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
                  style={{
                    background: isEvenCell ? "#23262b" : "#2a2e36",
                    width: "20%",
                    height: "20%",
                    top: `${rowIndex * 20}%`,
                    left: `${colIndex * 20}%`,
                    borderTop: rowIndex === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                    borderBottom: rowIndex === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                    borderLeft: colIndex === 0 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                    borderRight: colIndex === 4 ? "1px solid rgba(156, 163, 175, 0.3)" : "none",
                  }}
                >
                  {cellIndex}
                </div>
              );
            })}
          </>
        ))}

        {/* Горизонтальные линии разделения */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`h-line-${i}`}
            className="absolute z-10 bg-gray-400"
            style={{
              width: "100%",
              height: "1px",
              top: `${(i + 1) * 20}%`,
              left: "0",
              opacity: 0.3,
            }}
          />
        ))}

        {/* Вертикальные линии разделения */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`v-line-${i}`}
            className="absolute z-10 bg-gray-400"
            style={{
              width: "1px",
              height: "100%",
              top: "0",
              left: `${(i + 1) * 20}%`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    ),
  },

  // Шаблон с 16 экранами (4x4) для широкоэкранного формата
  {
    id: "split-grid-4x4-landscape",
    split: "custom",
    resizable: true,
    screens: 16,
    render: () => (
      <div className="relative h-full w-full">
        {/* Первый ряд */}
        {/* 1-й экран (верхний левый) */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* 2-й экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            left: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* 3-й экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            left: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* 4-й экран (верхний правый) */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Второй ряд */}
        {/* 5-й экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "25%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* 6-й экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "25%",
            left: "25%",
          }}
        >
          6
        </div>

        {/* 7-й экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "25%",
            left: "50%",
          }}
        >
          7
        </div>

        {/* 8-й экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "25%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          8
        </div>

        {/* Третий ряд */}
        {/* 9-й экран */}
        <div
          className="absolute left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          9
        </div>

        {/* 10-й экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "25%",
          }}
        >
          10
        </div>

        {/* 11-й экран */}
        <div
          className="absolute flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            top: "50%",
            left: "50%",
          }}
        >
          11
        </div>

        {/* 12-й экран */}
        <div
          className="absolute right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            top: "50%",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          12
        </div>

        {/* Четвертый ряд */}
        {/* 13-й экран (нижний левый) */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          13
        </div>

        {/* 14-й экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            left: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          14
        </div>

        {/* 15-й экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "25%",
            left: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          15
        </div>

        {/* 16-й экран (нижний правый) */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          16
        </div>

        {/* Горизонтальные линии разделения */}
        {/* Горизонтальная линия 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "25%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Горизонтальная линия 2 */}
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

        {/* Горизонтальная линия 3 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "100%",
            height: "1px",
            top: "75%",
            left: "0",
            opacity: 0.3,
          }}
        />

        {/* Вертикальные линии разделения */}
        {/* Вертикальная линия 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "25%",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия 2 */}
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

        {/* Вертикальная линия 3 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "75%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },

  // Шаблон с 8 экранами (4x2)
  {
    id: "split-grid-4x2-landscape",
    split: "custom",
    resizable: true,
    screens: 8,
    render: () => (
      <div className="relative h-full w-full">
        {/* Верхний ряд */}
        {/* Верхний первый экран */}
        <div
          className="absolute top-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          1
        </div>

        {/* Верхний второй экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            left: "25%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          2
        </div>

        {/* Верхний третий экран */}
        <div
          className="absolute top-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            left: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          3
        </div>

        {/* Верхний четвертый экран */}
        <div
          className="absolute top-0 right-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            borderTop: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          4
        </div>

        {/* Нижний ряд */}
        {/* Нижний первый экран */}
        <div
          className="absolute bottom-0 left-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderLeft: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          5
        </div>

        {/* Нижний второй экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            left: "25%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          6
        </div>

        {/* Нижний третий экран */}
        <div
          className="absolute bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#2a2e36",
            width: "25%",
            height: "50%",
            left: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          7
        </div>

        {/* Нижний четвертый экран */}
        <div
          className="absolute right-0 bottom-0 flex items-center justify-center text-lg font-normal text-gray-400"
          style={{
            background: "#23262b",
            width: "25%",
            height: "50%",
            borderBottom: "1px solid rgba(156, 163, 175, 0.3)",
            borderRight: "1px solid rgba(156, 163, 175, 0.3)",
          }}
        >
          8
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

        {/* Вертикальная линия разделения 1 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "25%",
            opacity: 0.3,
          }}
        />

        {/* Вертикальная линия разделения 2 */}
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

        {/* Вертикальная линия разделения 3 */}
        <div
          className="absolute z-10 bg-gray-400"
          style={{
            width: "1px",
            height: "100%",
            top: "0",
            left: "75%",
            opacity: 0.3,
          }}
        />
      </div>
    ),
  },
]
