import { useState, useRef, useCallback, useEffect } from 'react';
import type { Memory } from '../types';

const DEFAULT_ZOOM = 13;
const READING_PAUSE_MS = 5500;
const FLY_TIMEOUT_MS = 10000;

export interface UseStoryModeParams {
  memories: Memory[];
  flyToMemory: ((lat: number, lng: number, zoom: number, duration?: number) => Promise<void>) | null;
  showCard: (memory: Memory) => void;
  hideCard: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onTransitionStart?: (fromIndex: number, toIndex: number) => void;
  onTransitionComplete?: (index: number) => void;
  getMemoryDuration?: (memory: Memory) => Promise<number>;
}

export interface UseStoryModeReturn {
  isPlaying: boolean;
  currentMemory: Memory | null;
  currentIndex: number;
  totalMemories: number;
  isEmpty: boolean;
  start: () => void;
  stop: () => void;
}

export function useStoryMode(params: UseStoryModeParams): UseStoryModeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMemory, setCurrentMemory] = useState<Memory | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const playingRef = useRef(false);
  const runIdRef = useRef(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const totalMemories = params.memories.length;
  const isEmpty = totalMemories === 0;

  const resetState = useCallback(() => {
    playingRef.current = false;
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = null;
    setIsPlaying(false);
    setCurrentMemory(null);
    setCurrentIndex(0);
  }, []);

  const start = useCallback(() => {
    if (playingRef.current) return;

    const { memories, flyToMemory, showCard, hideCard, onPlaybackStart, onPlaybackEnd, onTransitionStart, onTransitionComplete, getMemoryDuration } =
      paramsRef.current;

    if (!flyToMemory || memories.length === 0) return;

    const myRunId = ++runIdRef.current;
    playingRef.current = true;
    setIsPlaying(true);
    onPlaybackStart?.();

    const isCancelled = () => runIdRef.current !== myRunId;

    (async () => {
      for (let i = 0; i < memories.length; i++) {
        if (isCancelled()) break;

        const memory = memories[i];
        setCurrentIndex(i);
        setCurrentMemory(memory);

        // Call onTransitionStart before flying to memory
        const fromIndex = i > 0 ? i - 1 : -1;
        onTransitionStart?.(fromIndex, i);

        // Fly to memory with timeout guard
        let flyTimedOut = false;
        await Promise.race([
          flyToMemory(memory.lat, memory.lng, memory.zoomLevel ?? DEFAULT_ZOOM),
          new Promise<void>((resolve) => {
            timeoutIdRef.current = setTimeout(() => {
              flyTimedOut = true;
              resolve();
            }, FLY_TIMEOUT_MS);
          }),
        ]);

        // Clear the fly timeout if flyToMemory won the race
        if (timeoutIdRef.current !== null) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        if (flyTimedOut) {
          console.warn(`flyToMemory timed out for memory "${memory.title}", advancing`);
        }

        if (isCancelled()) break;

        // Call onTransitionComplete after flying to memory
        onTransitionComplete?.(i);

        showCard(memory);

        // Get dynamic duration for this memory (video duration or default reading pause)
        const duration = getMemoryDuration ? await getMemoryDuration(memory) : READING_PAUSE_MS;

        await new Promise<void>((resolve) => {
          timeoutIdRef.current = setTimeout(resolve, duration);
        });

        if (isCancelled()) break;

        hideCard();
      }

      if (!isCancelled()) {
        onPlaybackEnd?.();
        resetState();
      }
    })();
  }, [resetState]);

  const stop = useCallback(() => {
    if (!playingRef.current) return;
    runIdRef.current++;
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    paramsRef.current.hideCard();
    resetState();
  }, [resetState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      runIdRef.current++;
      playingRef.current = false;
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    currentMemory,
    currentIndex,
    totalMemories,
    isEmpty,
    start,
    stop,
  };
}
