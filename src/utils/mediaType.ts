import type { Memory } from '../types/memory';

export type MediaType = 'video' | 'image' | null;

/**
 * Determines the media type based on file extension
 * @param url - The media URL to analyze
 * @returns 'video', 'image', or null if unrecognized or undefined
 */
export function getMediaType(url: string | undefined): MediaType {
  if (!url) return null;
  
  const extension = url.split('.').pop()?.toLowerCase();
  
  const videoExtensions = ['mp4', 'webm', 'mov', 'ogg'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  
  if (videoExtensions.includes(extension || '')) return 'video';
  if (imageExtensions.includes(extension || '')) return 'image';
  
  return null;
}

/**
 * Gets the media URL from a memory, prioritizing videoUrl over imageUrl
 * @param memory - The memory object
 * @returns The video URL if present, otherwise the image URL, or undefined
 */
export function getMediaUrl(memory: Memory): string | undefined {
  return memory.videoUrl || memory.imageUrl;
}
