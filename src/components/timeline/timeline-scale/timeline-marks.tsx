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
  console.log('TimelineMarks params:', {
    startTime,
    endTime,
    duration,
    timeStep,
    subStep
  })

  const marks = []
  const level1Step = timeStep
  const level2Step = subStep
  const level3Step = subStep / 5
  const level4Step = subStep / 10

  console.log('TimelineMarks steps:', {
    level1Step,
    level2Step,
    level3Step,
    level4Step
  })

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
      showValue = timeStep <= 10
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

  console.log('TimelineMarks total marks:', marks.length)

  return <div className={`relative w-full h-8 ${isActive ? "" : "bg-muted/50"}`}>{marks}</div>
}
