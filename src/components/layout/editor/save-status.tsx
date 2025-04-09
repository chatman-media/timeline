import { Check, Loader2 } from "lucide-react"

import { useRootStore } from "@/hooks/use-root-store"

export function SaveStatus() {
  const { isLoading, isDirty } = useRootStore()

  let status: "saving" | "saved" | "unsaved" | "idle" = "idle"
  if (isLoading) {
    status = "saving"
  } else if (!isDirty) {
    status = "saved"
  } else {
    status = "unsaved"
  }

  return (
    <div className="relative flex items-center text-xs text-muted-foreground">
      {status === "saving" && (
        <>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Сохранение...
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="mr-1 h-3 w-3 text-green-500" /> Сохранено
        </>
      )}
      {status === "unsaved" && <span>Не сохранено</span>}
    </div>
  )
}
