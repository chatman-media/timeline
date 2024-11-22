export interface VideoStream {
  codec_type: string /** Тип кодека (video/audio) */
  codec_name: string /** Короткое имя кодека (h264, aac и т.д.) */
  codec_long_name: string /** Полное название кодека */
  width?: number /** Ширина видео в пикселях */
  height?: number /** Высота видео в пикселях */
  display_aspect_ratio?: string /** Соотношение сторон (например, 16:9) */
  r_frame_rate?: string /** Частота кадров (например, 30/1) */
  bit_rate?: string /** Битрейт в bits/s */
  sample_rate?: string /** Частота дискретизации для аудио (Hz) */
  channels?: number /** Количество аудио каналов */
  color_space?: string /** Цветовое пространство (bt709, bt2020 и т.д.) */
  color_range?: string /** Диапазон цвета (tv, pc, limited и т.д.) */
  level?: number /** Уровень кодека (например, H.264 level) */
  is_avc?: boolean /** Флаг AVC/H.264 формата */
  pix_fmt?: string /** Формат пикселей (yuv420p и т.д.) */
  nb_frames?: string /** Количество кадров в потоке */
}
