import { useState, useEffect } from 'react';
import type { Memory } from '../types';

export const DEFAULT_ZOOM_LEVEL = 13;

interface RawMemory {
  id: string;
  date: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  videoUrl?: string;
  zoomLevel?: number;
}

export function validateMemory(entry: unknown): entry is RawMemory {
  if (entry === null || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.date === 'string' &&
    typeof e.title === 'string' &&
    typeof e.description === 'string' &&
    typeof e.lat === 'number' &&
    typeof e.lng === 'number'
  );
}

export function applyDefaults(raw: RawMemory): Memory {
  return {
    id: raw.id,
    date: raw.date,
    title: raw.title,
    description: raw.description,
    lat: raw.lat,
    lng: raw.lng,
    imageUrl: raw.imageUrl,
    videoUrl: raw.videoUrl,
    zoomLevel: raw.zoomLevel ?? DEFAULT_ZOOM_LEVEL,
  };
}

interface UseMemoriesResult {
  memories: Memory[];
  loading: boolean;
  error: string | null;
}

export function useMemories(): UseMemoriesResult {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMemories() {
      try {
        const response = await fetch('/moments.json', { signal: controller.signal });
        if (!response.ok) {
          throw new Error('network');
        }
        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('parse');
        }
        const validated = data
          .filter(validateMemory)
          .map(applyDefaults)
          .sort((a, b) => a.date.localeCompare(b.date));
        setMemories(validated);
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof SyntaxError || (err instanceof Error && err.message === 'parse')) {
          setError('Memory data is corrupted. Please try refreshing the page.');
        } else {
          setError('Failed to load memories. Please check your connection and try again.');
        }
        setMemories([]);
        setLoading(false);
      }
    }

    fetchMemories();
    return () => controller.abort();
  }, []);

  return { memories, loading, error };
}
