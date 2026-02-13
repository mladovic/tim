import { useEffect, useRef, useState } from 'react';

interface UseBackgroundMusicParams {
  isPlaying: boolean;
  audioUrl: string;
}

interface UseBackgroundMusicReturn {
  isLoaded: boolean;
  error: string | null;
}

export function useBackgroundMusic({
  isPlaying,
  audioUrl,
}: UseBackgroundMusicParams): UseBackgroundMusicReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element on mount
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';

    const handleCanPlayThrough = () => setIsLoaded(true);
    const handleError = () => {
      console.error('Failed to load background music');
      setError('Failed to load music');
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Control playback based on isPlaying
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      // Handle browsers/environments where play() returns a Promise
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Failed to play background music:', err);
          setError('Failed to play music');
        });
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  return { isLoaded, error };
}
