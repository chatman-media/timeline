import { useState } from "react"

import { LayoutMode } from "@/components/layout/editor/layouts/layout-previews"
import { useProject } from "@/machines/project-machine"
import { useMediaContext } from "@/providers/media-provider"
import { useSelection } from "@/providers/selection-provider"
import { useTimeline } from "@/providers/timeline-provider"

export function useStore() {
  const media = useMediaContext()
  const project = useProject()
  const selection = useSelection()
  const timeline = useTimeline()
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("default")

  return {
    ...media,
    ...project,
    ...selection,
    ...timeline,
    layoutMode,
    setLayoutMode,
  }
}
