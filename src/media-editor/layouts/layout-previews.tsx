import { Play } from "lucide-react"
import { useTranslation } from "react-i18next"

// Создаем тип для макетов
export type LayoutMode = "default" | "options" | "vertical" | "dual"

interface LayoutPreviewsProps {
  onLayoutChange: (mode: LayoutMode) => void
  layoutMode: LayoutMode
  hasExternalDisplay: boolean
}

interface LayoutProps {
  isActive: boolean
  onClick: () => void
}

function DefaultLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${
        isActive ? "bg-muted" : "hover:bg-muted"
      } p-2 pb-1`}
      onClick={onClick}
    >
      <div className="bg-muted mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[100%] flex-col">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs"></div>
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs"></div>
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs"></div>
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700">
              <div className="bg-muted flex h-[90%] w-[95%] items-center justify-center border-2 border-gray-700">
                <Play className="text-primary h-3 w-3" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full">
            <div className="w-[10%] border-r-2 border-gray-700 p-1"></div>
            <div className="relative w-[70%] px-2 py-1">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm"></div>
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topNavBar.layouts.default")}</span>
    </div>
  )
}

function OptionsLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${
        isActive ? "bg-muted" : "hover:bg-muted"
      } p-2 pb-1`}
      onClick={onClick}
    >
      <div className="bg-muted mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[75%] flex-col">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700">
            <div className="w-[30%] border-r-2 border-gray-700 p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs"></div>
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs"></div>
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs"></div>
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700">
              <div className="bg-muted flex h-[90%] w-[90%] items-center justify-center border-2 border-gray-700">
                <Play className="text-primary h-3 w-3" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full">
            <div className="w-[15%] border-r-2 border-gray-700 p-1"></div>
            <div className="relative w-[70%] px-2 py-1">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm"></div>
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm"></div>
            </div>
          </div>
        </div>
        <div className="h-full w-[25%] border-l-2 border-gray-700 p-1">
          <div className="bg-primary/70 mb-2 h-1 w-full rounded-sm"></div>
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm"></div>
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm"></div>
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm"></div>
          <div className="bg-primary/70 h-1 w-full rounded-sm"></div>
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topNavBar.layouts.options")}</span>
    </div>
  )
}

function VerticalLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${
        isActive ? "bg-muted" : "hover:bg-muted"
      } p-2 pb-1`}
      onClick={onClick}
    >
      <div className="bg-muted mb-1 flex h-24 w-40 flex-row border-2 border-gray-700">
        <div className="flex h-full w-[70%] flex-col">
          <div className="flex h-[50%] w-full border-b-2 border-gray-700">
            <div className="w-[50%] p-1">
              <div className="w-full">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[35%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[65%] rounded-xs"></div>
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[35%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[65%] rounded-xs"></div>
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0">
                  <div className="bg-primary/70 h-2 w-[35%] rounded-xs"></div>
                  <div className="bg-primary/70 h-1 w-[65%] rounded-xs"></div>
                </div>
              </div>
            </div>
            <div className="w-[50%] border-l-2 border-gray-700 p-1">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm"></div>
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm"></div>
              <div className="bg-primary/70 h-1 w-full rounded-sm"></div>
            </div>
          </div>
          <div className="flex h-[50%] w-full">
            <div className="w-[14%] border-r-2 border-gray-700 p-1"></div>
            <div className="relative w-[86%] px-2 py-1">
              <div className="bg-primary/70 mb-1 ml-[13%] h-2 w-[85%] rounded-sm"></div>
              <div className="bg-primary/70 mb-1 h-2 w-[75%] rounded-sm"></div>
              <div className="bg-primary/70 ml-[10%] h-2 w-[75%] rounded-sm"></div>
            </div>
          </div>
        </div>
        <div className="flex w-[30%] items-center justify-center border-l-2 border-gray-700">
          <div className="bg-muted flex h-[95%] w-[85%] items-center justify-center border-2 border-gray-700">
            <Play className="text-primary h-4 w-4" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topNavBar.layouts.vertical")}</span>
    </div>
  )
}

interface DualLayoutProps extends LayoutProps {
  hasExternalDisplay: boolean
}

function DualLayout({ isActive, onClick, hasExternalDisplay }: DualLayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex flex-col items-center ${
        hasExternalDisplay ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      } ${isActive ? "bg-muted" : hasExternalDisplay ? "hover:bg-muted" : ""} p-2 pb-1`}
      onClick={onClick}
      title={
        hasExternalDisplay
          ? t("topNavBar.layouts.dual")
          : t("topNavBar.layouts.externalDisplayRequired")
      }
    >
      <div className="bg-background relative mb-1 flex h-24 w-40 items-center justify-center">
        <div className="bg-muted absolute right-4 h-14 w-24 translate-y-2 border-2 border-gray-700">
          <div className="flex h-1/2 w-full items-center justify-center border-b-2 border-gray-700">
            <div className="bg-primary/70 h-2 w-[80%] rounded-sm"></div>
          </div>
          <div className="flex h-1/2 w-full items-center justify-center">
            <div className="bg-primary/70 h-2 w-[60%] rounded-sm"></div>
          </div>
        </div>
        <div className="bg-muted absolute left-4 z-10 h-14 w-24 -translate-y-2 border-2 border-gray-700">
          <div className="flex h-full">
            <div className="flex w-[70%] items-center justify-center border-r-2 border-gray-700">
              <div className="bg-muted flex h-[90%] w-[90%] items-center justify-center border-2 border-gray-700">
                <Play className="text-primary h-3 w-3" />
              </div>
            </div>
            <div className="w-[30%] p-1">
              <div className="bg-primary/70 mb-1 h-1.5 w-full rounded-sm"></div>
              <div className="bg-primary/70 h-1.5 w-[80%] rounded-sm"></div>
            </div>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium">{t("topNavBar.layouts.dual")}</span>
      {!hasExternalDisplay && (
        <span className="text-muted-foreground text-[9px]">
          {t("topNavBar.layouts.externalDisplayRequired")}
        </span>
      )}
    </div>
  )
}

export function LayoutPreviews({
  onLayoutChange,
  layoutMode,
  hasExternalDisplay,
}: LayoutPreviewsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <DefaultLayout
          isActive={layoutMode === "default"}
          onClick={() => onLayoutChange("default")}
        />
        <OptionsLayout
          isActive={layoutMode === "options"}
          onClick={() => onLayoutChange("options")}
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
