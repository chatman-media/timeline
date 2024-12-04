export interface ThumbnailParams {
  videoDuration: number
  containerWidth: number
  scale: number
  trackHeight: number
  segmentWidth: number
}

export function calculateThumbnailRequirements(params: ThumbnailParams) {
  const { videoDuration, segmentWidth, trackHeight } = params

  // Рассчитываем оптимальное количество миниатюр на основе ширины сегмента
  const optimalCount = Math.max(1, Math.ceil(segmentWidth / trackHeight))

  // Интервал времени между миниатюрами
  const timeStep = videoDuration / optimalCount

  return {
    count: optimalCount,
    timeStep,
  }
}
