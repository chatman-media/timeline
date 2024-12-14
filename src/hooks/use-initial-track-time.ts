import { useEffect } from 'react'
import { useMedia } from '@/hooks/use-media'
import { Track } from '@/types/videos'

interface UseInitialTrackTimeProps {
  tracks: Track[]
  sectionStartTime: number
  sectionDuration: number
}

export function useInitialTrackTime({ tracks, sectionStartTime, sectionDuration }: UseInitialTrackTimeProps) {
  const { setCurrentTime } = useMedia()
  
  useEffect(() => {
    if (tracks.length > 0) {
      const firstTrack = tracks[0]
      if (firstTrack.videos.length > 0) {
        const firstVideo = firstTrack.videos[0]
        const videoStartTime = firstVideo.startTime || 0
        
        // Проверяем, что время видео находится в пределах секции
        if (videoStartTime >= sectionStartTime && 
            videoStartTime <= sectionStartTime + sectionDuration) {
          setCurrentTime(videoStartTime)
        }
      }
    }
  }, [tracks, sectionStartTime, sectionDuration])
} 