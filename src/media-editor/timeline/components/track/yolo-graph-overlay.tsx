import * as d3 from "d3"
import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useYoloData } from "@/media-editor/hooks/use-yolo-data"
import { MediaFile } from "@/types/media"
import { YoloFrameData,YoloVideoData } from "@/types/yolo"

interface YoloGraphOverlayProps {
  video: MediaFile
  sectionStart: number
  sectionEnd: number
  width: number
  height: number
}

interface GraphDataPoint {
  timestamp: number
  totalObjects: number
  dominantObjects: number
  dominantClasses: string[]
}

/**
 * Компонент для отображения графика данных YOLO на дорожке таймлайна
 */
export function YoloGraphOverlay({
  video,
  sectionStart,
  sectionEnd,
  width,
  height,
}: YoloGraphOverlayProps) {
  const { t } = useTranslation()
  const { loadYoloDataForVideo } = useYoloData()
  const svgRef = useRef<SVGSVGElement>(null)

  const [yoloData, setYoloData] = useState<YoloVideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allFramesProcessed, setAllFramesProcessed] = useState(false)

  // Загружаем данные YOLO при монтировании компонента
  useEffect(() => {
    if (!video || !video.id) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      console.log(`[YoloGraphOverlay] Начинаем загрузку данных YOLO для видео ${video.id}`)

      try {
        // Загружаем данные YOLO
        const data = await loadYoloDataForVideo(video.id)
        console.log(
          `[YoloGraphOverlay] Получены данные YOLO для видео ${video.id}:`,
          data ? `${data.frames?.length || 0} кадров` : "нет данных",
        )

        setYoloData(data)

        // Проверяем, все ли кадры обработаны
        if (data && data.frames && data.frames.length > 0) {
          // Предполагаем, что все кадры обработаны, если есть хотя бы один кадр
          // В реальном приложении здесь должна быть более сложная логика
          console.log(
            `[YoloGraphOverlay] Данные YOLO для видео ${video.id} содержат ${data.frames.length} кадров`,
          )
          setAllFramesProcessed(true)
        } else {
          console.warn(`[YoloGraphOverlay] Нет данных YOLO для видео ${video.id}`)
          setError("Нет данных YOLO для этого видео")
          setAllFramesProcessed(false)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка"
        setError(errorMessage)
        console.error(`[YoloGraphOverlay] Ошибка при загрузке данных YOLO:`, err)
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
      console.log(`[YoloGraphOverlay] Не создаем график:`, {
        hasSvgRef: !!svgRef.current,
        hasYoloData: !!yoloData,
        framesCount: yoloData?.frames?.length || 0,
        allFramesProcessed,
      })
      return
    }

    // Подготавливаем данные для графика
    const graphData = prepareGraphData(yoloData.frames)
    console.log(`[YoloGraphOverlay] Подготовлены данные для графика:`, {
      dataPoints: graphData.length,
      firstPoint: graphData.length > 0 ? graphData[0] : null,
      lastPoint: graphData.length > 0 ? graphData[graphData.length - 1] : null,
    })

    // Создаем график
    console.log(`[YoloGraphOverlay] Создаем график с параметрами:`, {
      sectionStart,
      sectionEnd,
      width,
      height,
    })
    createGraph(svgRef.current, graphData, sectionStart, sectionEnd, width, height)
  }, [yoloData, sectionStart, sectionEnd, width, height, allFramesProcessed])

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-sm text-white">{t("Загрузка данных YOLO...")}</div>
      </div>
    )
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return (
      <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-sm text-red-500">{t(error)}</div>
      </div>
    )
  }

  // Если не все кадры обработаны, не отображаем график
  if (!allFramesProcessed) {
    return (
      <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black">
        <div className="text-sm text-yellow-500">{t("Обработка данных YOLO не завершена")}</div>
      </div>
    )
  }

  // Если нет данных YOLO, не отображаем ничего
  if (!yoloData) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg ref={svgRef} width={width} height={height} className="absolute inset-0" />
    </div>
  )
}

/**
 * Подготовить данные для графика
 * @param frames Кадры с данными YOLO
 * @returns Данные для графика
 */
function prepareGraphData(frames: YoloFrameData[]): GraphDataPoint[] {
  return frames.map((frame) => {
    // Считаем общее количество объектов
    const totalObjects = frame.detections.length

    // Считаем количество объектов каждого класса
    const classCounts: Record<string, number> = {}
    frame.detections.forEach((detection) => {
      classCounts[detection.class] = (classCounts[detection.class] || 0) + 1
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
 * @param sectionStart Начало секции
 * @param sectionEnd Конец секции
 * @param width Ширина графика
 * @param height Высота графика
 */
function createGraph(
  svgElement: SVGSVGElement,
  data: GraphDataPoint[],
  sectionStart: number,
  sectionEnd: number,
  width: number,
  height: number,
): void {
  console.log(
    `[YoloGraphOverlay:createGraph] Начинаем создание графика с ${data.length} точками данных`,
  )

  // Очищаем SVG
  d3.select(svgElement).selectAll("*").remove()

  // Проверяем, что у нас есть данные
  if (data.length === 0) {
    console.warn(`[YoloGraphOverlay:createGraph] Нет данных для создания графика`)
    return
  }

  // Проверяем, что данные находятся в пределах секции
  const dataInSection = data.filter((d) => d.timestamp >= sectionStart && d.timestamp <= sectionEnd)
  console.log(
    `[YoloGraphOverlay:createGraph] Данные в пределах секции: ${dataInSection.length} из ${data.length}`,
  )

  if (dataInSection.length === 0) {
    console.warn(
      `[YoloGraphOverlay:createGraph] Нет данных в пределах секции [${sectionStart}, ${sectionEnd}]`,
    )
    // Добавляем текст с предупреждением
    d3.select(svgElement)
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text("Нет данных YOLO в этом диапазоне времени")
    return
  }

  // Создаем шкалы
  const xScale = d3.scaleLinear().domain([sectionStart, sectionEnd]).range([0, width])

  const maxObjects = d3.max(dataInSection, (d) => d.totalObjects) || 10
  console.log(`[YoloGraphOverlay:createGraph] Максимальное количество объектов: ${maxObjects}`)

  const yScale = d3.scaleLinear().domain([0, maxObjects]).range([height, 0])

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

  // Добавляем линию для общего количества объектов
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#55AAFF")
    .attr("stroke-width", 2)
    .attr("d", totalLine)

  // Добавляем линию для доминирующих объектов
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#FF5555")
    .attr("stroke-width", 2)
    .attr("d", dominantLine)

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

  // Добавляем легенду
  const legend = svg.append("g").attr("transform", `translate(10, 10)`)

  // Легенда для общего количества объектов
  legend.append("rect").attr("width", 10).attr("height", 10).attr("fill", "#55AAFF")

  legend
    .append("text")
    .attr("x", 15)
    .attr("y", 9)
    .attr("font-size", "10px")
    .attr("fill", "white")
    .text("Все объекты")

  // Легенда для доминирующих объектов
  legend.append("rect").attr("width", 10).attr("height", 10).attr("y", 15).attr("fill", "#FF5555")

  legend
    .append("text")
    .attr("x", 15)
    .attr("y", 24)
    .attr("font-size", "10px")
    .attr("fill", "white")
    .text("Доминирующие объекты")
}
