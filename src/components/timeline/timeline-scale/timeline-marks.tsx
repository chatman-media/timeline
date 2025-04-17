import { TimelineMark } from "."

interface TimelineMarksProps {
  startTime: number
  endTime: number
  duration: number
  timeStep: number
  subStep: number
  isActive: boolean
}

export function TimelineMarks({
  startTime,
  endTime,
  duration,
  timeStep,
  subStep,
  isActive,
}: TimelineMarksProps) {
  const marks = []
  const level1Step = timeStep
  const level2Step = subStep
  const level3Step = subStep / 2
  const level4Step = subStep / 10

  const firstMark = Math.floor(startTime / level4Step) * level4Step

  for (let timestamp = firstMark; timestamp <= endTime; timestamp += level4Step) {
    const position = ((timestamp - startTime) / duration) * 100

    if (position < 0) continue

    let markType: "large" | "medium" | "small" | "smallest"
    let showValue = false

    if (timestamp % level1Step === 0) {
      markType = "large"
      showValue = true
    } else if (timestamp % level2Step === 0) {
      markType = "medium"
    } else if (timestamp % level3Step === 0) {
      markType = "small"
    } else {
      markType = "smallest"
    }

    marks.push(
      <TimelineMark
        key={timestamp}
        timestamp={timestamp}
        position={position}
        markType={markType}
        showValue={showValue}
      />,
    )
  }

  return <div className={`relative w-full h-8 ${isActive ? "" : "bg-muted/50"}`}>{marks}</div>
}
