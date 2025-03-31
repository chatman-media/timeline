import { useVideoStore } from './useVideoStore';

export function useMedia() {
  const {
    videos,
    media,
    isLoading,
    hasMedia,
    isPlaying,
    currentTime,
    tracks,
    videoRefs,
    activeVideo,
    activeTrackId,
    setVideos,
    setMedia,
    setActiveTrack,
    setActiveVideo,
    setIsPlaying,
    setCurrentTime,
    fetchVideos,
    setTracks,
    addNewTracks,
    isChangingCamera,
    hasFetched,
    metadataCache,
    thumbnailCache
  } = useVideoStore();

  const play = () => {
    setIsPlaying(!isPlaying);
  };

  return {
    videos,
    media,
    isLoading,
    hasMedia,
    isPlaying,
    currentTime,
    tracks,
    videoRefs,
    activeVideo,
    activeTrackId,
    setVideos,
    setMedia,
    setActiveTrack,
    setActiveVideo,
    setIsPlaying,
    setCurrentTime,
    fetchVideos,
    setTracks,
    addNewTracks,
    play,
    isChangingCamera,
    hasFetched,
    metadataCache,
    thumbnailCache
  };
} 