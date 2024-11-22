export interface AudioStream {
  codec_name: string /** Короткое имя аудиокодека (aac, mp3 и т.д.) */
  codec_long_name: string /** Полное название аудиокодека */
  sample_rate: string /** Частота дискретизации в Hz */
  channels: number /** Количество аудиоканалов (1=mono, 2=stereo) */
  bit_rate: number /** Битрейт аудио в bits/s */
}
