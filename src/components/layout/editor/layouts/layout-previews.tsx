import { Play } from "lucide-react"

interface LayoutPreviewsProps {
  onLayoutChange: (mode: string) => void
  layoutMode: string
  hasExternalDisplay: boolean
}

interface LayoutProps {
  isActive: boolean
  onClick: () => void
}

function DefaultLayout({ isActive, onClick }: LayoutProps) {
  return (
    <div
      className={`flex flex-col items-center cursor-pointer ${
        isActive ? "bg-muted" : "hover:bg-muted"
      } p-2 pb-1`}
      onClick={onClick}
    >
      <div className="w-40 h-24 border-2 border-gray-700 bg-muted flex flex-row mb-1">
        <div className="w-[100%] h-full flex flex-col">
          <div className="h-[60%] w-full flex border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[25%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[75%] bg-primary/70 rounded-xs"></div>
                </div>
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[25%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[75%] bg-primary/70 rounded-xs"></div>
                </div>
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[25%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[75%] bg-primary/70 rounded-xs"></div>
                </div>
              </div>
            </div>
            <div className="w-[70%] flex items-center justify-center border-gray-700">
              <div className="w-[95%] h-[90%] border-2 border-gray-700 bg-muted flex items-center justify-center">
                <Play className="h-3 w-3 text-primary" />
              </div>
            </div>
          </div>
          <div className="h-[40%] w-full flex">
            <div className="w-[10%] border-r-2 border-gray-700 p-1"></div>
            <div className="w-[70%] relative px-2 py-1">
              <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-2 w-[75%] bg-primary/70 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">По умолчанию</span>
    </div>
  )
}

function OptionsLayout({ isActive, onClick }: LayoutProps) {
  return (
    <div
      className={`flex flex-col items-center cursor-pointer ${
        isActive ? "bg-muted" : "hover:bg-muted"
      } p-2 pb-1`}
      onClick={onClick}
    >
      <div className="w-40 h-24 border-2 border-gray-700 bg-muted flex flex-row mb-1">
        <div className="w-[75%] h-full flex flex-col">
          <div className="h-[60%] w-full flex border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[25%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[75%] bg-primary/70 rounded-xs"></div>
                </div>
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[25%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[75%] bg-primary/70 rounded-xs"></div>
                </div>
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[25%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[75%] bg-primary/70 rounded-xs"></div>
                </div>
              </div>
            </div>
            <div className="w-[70%] flex items-center justify-center border-gray-700">
              <div className="w-[90%] h-[90%] border-2 border-gray-700 bg-muted flex items-center justify-center">
                <Play className="h-3 w-3 text-primary" />
              </div>
            </div>
          </div>
          <div className="h-[40%] w-full flex">
            <div className="w-[15%] border-r-2 border-gray-700 p-1"></div>
            <div className="w-[70%] relative px-2 py-1">
              <div className="h-2 w-full bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-2 w-[75%] bg-primary/70 rounded-sm"></div>
            </div>
          </div>
        </div>
        <div className="w-[25%] h-full border-l-2 border-gray-700 p-1">
          <div className="h-1 w-full bg-primary/70 rounded-sm mb-2"></div>
          <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
          <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
          <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
          <div className="h-1 w-full bg-primary/70 rounded-sm"></div>
        </div>
      </div>
      <span className="text-[10px] font-medium">Опции</span>
    </div>
  )
}

function VerticalLayout({ isActive, onClick }: LayoutProps) {
  return (
    <div
      className={`flex flex-col items-center cursor-pointer ${
        isActive ? "bg-muted" : "hover:bg-muted"
      } p-2 pb-1`}
      onClick={onClick}
    >
      <div className="w-40 h-24 border-2 border-gray-700 bg-muted flex flex-row mb-1">
        <div className="w-[70%] h-full flex flex-col">
          <div className="h-[50%] w-full flex border-b-2 border-gray-700">
            <div className="w-[50%] p-1">
              <div className="w-full">
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[35%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[65%] bg-primary/70 rounded-xs"></div>
                </div>
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[35%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[65%] bg-primary/70 rounded-xs"></div>
                </div>
                <div className="flex flex-row flex-2 items-center m-0 p-0 gap-1 mb-1">
                  <div className="h-2 w-[35%] bg-primary/70 rounded-xs"></div>
                  <div className="h-1 w-[65%] bg-primary/70 rounded-xs"></div>
                </div>
              </div>
            </div>
            <div className="w-[50%] border-l-2 border-gray-700 p-1">
              <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-1 w-full bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-1 w-full bg-primary/70 rounded-sm"></div>
            </div>
          </div>
          <div className="h-[50%] w-full flex">
            <div className="w-[14%] border-r-2 border-gray-700 p-1"></div>
            <div className="w-[86%] relative px-2 py-1">
              <div className="h-2 w-[85%] ml-[13%] bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-2 w-[75%] bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-2 w-[75%] ml-[10%] bg-primary/70 rounded-sm"></div>
            </div>
          </div>
        </div>
        <div className="w-[30%] border-l-2 border-gray-700 flex items-center justify-center">
          <div className="w-[85%] h-[95%] border-2 border-gray-700 bg-muted flex items-center justify-center">
            <Play className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">Вертикальное видео</span>
    </div>
  )
}

interface DualLayoutProps extends LayoutProps {
  hasExternalDisplay: boolean
}

function DualLayout({ isActive, onClick, hasExternalDisplay }: DualLayoutProps) {
  return (
    <div
      className={`flex flex-col items-center ${
        hasExternalDisplay ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
      } ${isActive ? "bg-muted" : hasExternalDisplay ? "hover:bg-muted" : ""} p-2 pb-1`}
      onClick={onClick}
      title={hasExternalDisplay ? "Двойной вид" : "Требуется внешний монитор"}
    >
      <div className="w-40 h-24 bg-background flex items-center justify-center mb-1 relative">
        <div className="absolute right-4 translate-y-2 w-24 h-14 border-2 border-gray-700 bg-muted">
          <div className="w-full h-1/2 border-b-2 border-gray-700 flex items-center justify-center">
            <div className="h-2 w-[80%] bg-primary/70 rounded-sm"></div>
          </div>
          <div className="w-full h-1/2 flex items-center justify-center">
            <div className="h-2 w-[60%] bg-primary/70 rounded-sm"></div>
          </div>
        </div>
        <div className="absolute left-4 -translate-y-2 w-24 h-14 border-2 border-gray-700 bg-muted z-10">
          <div className="flex h-full">
            <div className="w-[70%] border-r-2 border-gray-700 flex items-center justify-center">
              <div className="w-[90%] h-[90%] border-2 border-gray-700 bg-muted flex items-center justify-center">
                <Play className="w-3 h-3 text-primary" />
              </div>
            </div>
            <div className="w-[30%] p-1">
              <div className="h-1.5 w-full bg-primary/70 rounded-sm mb-1"></div>
              <div className="h-1.5 w-[80%] bg-primary/70 rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">Два окна</span>
      {!hasExternalDisplay && (
        <span className="text-[9px] text-muted-foreground">Нужен внешний монитор</span>
      )}
    </div>
  )
}

export function LayoutPreviews({
  onLayoutChange,
  layoutMode,
  hasExternalDisplay,
}: LayoutPreviewsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <DefaultLayout
          isActive={layoutMode === "default"}
          onClick={() => onLayoutChange("default")}
        />
        <OptionsLayout
          isActive={layoutMode === "classic"}
          onClick={() => onLayoutChange("classic")}
        />
      </div>
      <div className="flex justify-around gap-2">
        <VerticalLayout
          isActive={layoutMode === "vertical"}
          onClick={() => onLayoutChange("vertical")}
        />
        <DualLayout
          isActive={layoutMode === "dual"}
          hasExternalDisplay={hasExternalDisplay}
          onClick={() => hasExternalDisplay && onLayoutChange("dual")}
        />
      </div>
    </div>
  )
}
