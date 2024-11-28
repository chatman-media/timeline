import { AreaClosed, Bar, Line } from "@visx/shape"
import { curveMonotoneX } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { scaleLinear, scaleTime } from "@visx/scale"
import { TooltipWithBounds, withTooltip } from "@visx/tooltip"
import { WithTooltipProvidedProps } from "@visx/tooltip/lib/enhancers/withTooltip"
import { localPoint } from "@visx/event"
import { bisector } from "d3-array"
import { useCallback, useMemo } from "react"

interface BitratePoint {
  timestamp: number
  bitrate: number
}

interface BitrateChartProps {
  data: BitratePoint[]
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
  currentTime?: number
}

const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0 }

// Вспомогательные функции
const getTimestamp = (d: BitratePoint) => new Date(d.timestamp * 1000)
const getBitrate = (d: BitratePoint) => d.bitrate
const bisectDate = bisector<BitratePoint, Date>((d) => new Date(d.timestamp * 1000)).left

const BitrateChart = withTooltip(
  ({
    data,
    width,
    height,
    margin = defaultMargin,
    currentTime,
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  }: BitrateChartProps & WithTooltipProvidedProps<BitratePoint>) => {
    // Вычисляем размеры графика
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Создаем шкалы
    const timeScale = useMemo(
      () =>
        scaleTime({
          range: [0, innerWidth],
          domain: [
            Math.min(...data.map((d) => d.timestamp)),
            Math.max(...data.map((d) => d.timestamp)),
          ],
        }),
      [data, innerWidth],
    )

    const bitrateScale = useMemo(
      () =>
        scaleLinear({
          range: [innerHeight, 0],
          domain: [0, Math.max(...data.map((d) => d.bitrate)) * 1.1],
          nice: true,
        }),
      [data, innerHeight],
    )

    // Обработчик наведения
    const handleTooltip = useCallback(
      (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
        const { x } = localPoint(event) || { x: 0 }
        const x0 = timeScale.invert(x - margin.left)
        const index = bisectDate(data, x0, 1)
        const d0 = data[index - 1]
        const d1 = data[index]
        let d = d0
        if (d1 && getTimestamp(d1)) {
          d = x0.valueOf() - getTimestamp(d0).valueOf() > getTimestamp(d1).valueOf() - x0.valueOf()
            ? d1
            : d0
        }
        showTooltip({
          tooltipData: d,
          tooltipLeft: x,
          tooltipTop: bitrateScale(d.bitrate),
        })
      },
      [showTooltip, bitrateScale, timeScale, data, margin.left],
    )

    // Обновляем позицию линии текущего времени
    const currentTimePosition = useMemo(() => {
      if (!currentTime) return 0
      const firstTimestamp = Math.min(...data.map((d) => d.timestamp))
      const relativeTime = currentTime - firstTimestamp
      return timeScale(firstTimestamp + relativeTime)
    }, [currentTime, data, timeScale])

    return (
      <div className="relative">
        <svg width={width} height={height}>
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="var(--background)"
            // rx={14}
          />
          <GridRows
            scale={bitrateScale}
            width={innerWidth}
            height={innerHeight}
            stroke="var(--border)"
            strokeOpacity={0.2}
            pointerEvents="none"
            numTicks={5}
          />
          <GridColumns
            scale={timeScale}
            width={innerWidth}
            height={innerHeight}
            stroke="var(--border)"
            strokeOpacity={0.2}
            pointerEvents="none"
            numTicks={width > 520 ? 10 : 5}
          />
          <AreaClosed<BitratePoint>
            data={data}
            x={(d) => timeScale(d.timestamp) ?? 0}
            y={(d) => bitrateScale(d.bitrate) ?? 0}
            yScale={bitrateScale}
            strokeWidth={1}
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.2}
            curve={curveMonotoneX}
          />
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            // rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft, y: margin.top }}
                to={{ x: tooltipLeft, y: innerHeight + margin.top }}
                stroke="var(--border)"
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + margin.top}
                r={4}
                fill="var(--primary)"
                stroke="white"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
          {/* Обновляем линию текущего времени */}
          {currentTime !== undefined && currentTimePosition >= 0 &&
            currentTimePosition <= innerWidth && (
            <line
              x1={currentTimePosition}
              x2={currentTimePosition}
              y1={0}
              y2={height}
              stroke="#FFEB3B"
              strokeWidth={1}
            />
          )}
        </svg>
        {tooltipData && (
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop + margin.top}
            left={tooltipLeft}
          >
            {`${getBitrate(tooltipData).toFixed(2)} Mbps`}
            <br />
            {`${new Date(getTimestamp(tooltipData)).toLocaleTimeString()}`}
          </TooltipWithBounds>
        )}
      </div>
    )
  },
)

export default BitrateChart
