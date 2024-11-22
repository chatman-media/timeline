export interface VideoFormat {
  filename: string /** Имя файла */
  format_name: string /** Короткое имя формата (mp4, mov и т.д.) */
  format_long_name: string /** Полное название формата контейнера */
  duration: number /** Длительность в секундах */
  size: number /** Размер файла в байтах */
  bit_rate: number /** Общий битрейт в bits/s */
  start_time?: number /** Временная метка начала в секундах */
  nb_streams?: number /** Количество потоков в файле */
  probe_score?: number /** Оценка достоверности определения формата (0-100) */
}
