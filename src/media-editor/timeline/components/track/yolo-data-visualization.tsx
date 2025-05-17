import * as d3 from "d3"
import React, { useEffect, useRef, useState } from "react"

import { useYoloData } from "@/media-editor/hooks/use-yolo-data"
import { YoloFrame,YoloVideoData } from "@/media-editor/services/yolo-data-service"
import { MediaFile } from "@/types/media"

interface YoloDataVisualizationProps {
  video: MediaFile
  width: number
  height: number
  className?: string
}

interface GraphDataPoint {
  timestamp: number
  totalObjects: number
  dominantObjects: number
  dominantClasses: string[]
}

/**
 * Компонент для визуализации данных YOLO на сегменте видео
 */
export function YoloDataVisualization({
  video,
  width,
  height,
  className = "",
}: YoloDataVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { loadYoloDataForVideo } = useYoloData()

  const [yoloData, setYoloData] = useState<YoloVideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [allFramesProcessed, setAllFramesProcessed] = useState(false)

  // Загружаем данные YOLO при монтировании компонента
  useEffect(() => {
    if (!video || !video.id) return

    const loadData = async () => {
      setLoading(true)

      try {
        // Загружаем данные YOLO
        const data = await loadYoloDataForVideo(video.id)
        setYoloData(data)

        // Проверяем, все ли кадры обработаны
        if (data && data.frames && data.frames.length > 0) {
          // Предполагаем, что все кадры обработаны, если есть хотя бы один кадр
          setAllFramesProcessed(true)
        } else {
          setAllFramesProcessed(false)
        }
      } catch (err) {
        console.error(`[YoloDataVisualization] Ошибка при загрузке данных YOLO:`, err)
        setAllFramesProcessed(false)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [video, loadYoloDataForVideo])

  // Создаем график при изменении данных или размеров
  useEffect(() => {
    if (
      !svgRef.current ||
      !yoloData ||
      !yoloData.frames ||
      yoloData.frames.length === 0 ||
      !allFramesProcessed
    ) {
      return
    }

    // Подготавливаем данные для графика
    const graphData = prepareGraphData(yoloData.frames)

    // Создаем график
    createGraph(svgRef.current, graphData, width, height)
  }, [yoloData, width, height, allFramesProcessed])

  // Если данные загружаются или не все кадры обработаны, не отображаем график
  if (loading || !allFramesProcessed || !yoloData) {
    return null
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  )
}

/**
 * Подготовить данные для графика
 * @param frames Кадры с данными YOLO
 * @returns Данные для графика
 */
function prepareGraphData(frames: YoloFrame[]): GraphDataPoint[] {
  return frames.map((frame) => {
    // Считаем общее количество объектов
    const totalObjects = frame.detections.length

    // Считаем количество объектов каждого класса
    const classCounts: Record<string, number> = {}
    frame.detections.forEach((detection) => {
      const className = detection.class_name || `Class ${detection.class_id}`
      classCounts[className] = (classCounts[className] || 0) + 1
    })

    // Находим доминирующие классы (до 3 классов с наибольшим количеством объектов)
    const sortedClasses = Object.entries(classCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([className]) => className)

    // Считаем количество доминирующих объектов
    const dominantObjects = sortedClasses.reduce(
      (sum, className) => sum + (classCounts[className] || 0),
      0,
    )

    return {
      timestamp: frame.timestamp,
      totalObjects,
      dominantObjects,
      dominantClasses: sortedClasses,
    }
  })
}

/**
 * Создать график с помощью D3
 * @param svgElement SVG-элемент
 * @param data Данные для графика
 * @param width Ширина графика
 * @param height Высота графика
 */
function createGraph(
  svgElement: SVGSVGElement,
  data: GraphDataPoint[],
  width: number,
  height: number,
): void {
  // Очищаем SVG
  d3.select(svgElement).selectAll("*").remove()

  // Если данных нет, не создаем график
  if (data.length === 0) return

  // Находим минимальное и максимальное время
  const minTime = d3.min(data, (d) => d.timestamp) || 0
  const maxTime = d3.max(data, (d) => d.timestamp) || 1

  // Создаем шкалы
  const xScale = d3.scaleLinear().domain([minTime, maxTime]).range([0, width])

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.totalObjects) || 10])
    .range([height, 0])

  // Создаем линии
  const totalLine = d3
    .line<GraphDataPoint>()
    .x((d) => xScale(d.timestamp))
    .y((d) => yScale(d.totalObjects))
    .curve(d3.curveBasis) // Используем сглаженную кривую

  const dominantLine = d3
    .line<GraphDataPoint>()
    .x((d) => xScale(d.timestamp))
    .y((d) => yScale(d.dominantObjects))
    .curve(d3.curveBasis) // Используем сглаженную кривую

  // Создаем группу для графика
  const svg = d3.select(svgElement)

  // Добавляем область под линией общего количества объектов
  svg
    .append("path")
    .datum(data)
    .attr("fill", "#55AAFF")
    .attr("fill-opacity", 0.3)
    .attr(
      "d",
      d3
        .area<GraphDataPoint>()
        .x((d) => xScale(d.timestamp))
        .y0(height)
        .y1((d) => yScale(d.totalObjects))
        .curve(d3.curveBasis),
    )

  // Добавляем область под линией доминирующих объектов
  svg
    .append("path")
    .datum(data)
    .attr("fill", "#FF5555")
    .attr("fill-opacity", 0.3)
    .attr(
      "d",
      d3
        .area<GraphDataPoint>()
        .x((d) => xScale(d.timestamp))
        .y0(height)
        .y1((d) => yScale(d.dominantObjects))
        .curve(d3.curveBasis),
    )

  // Добавляем линию для общего количества объектов
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#55AAFF")
    .attr("stroke-width", 1.5)
    .attr("d", totalLine)

  // Добавляем линию для доминирующих объектов
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#FF5555")
    .attr("stroke-width", 1.5)
    .attr("d", dominantLine)
}
