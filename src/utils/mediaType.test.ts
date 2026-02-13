import { describe, it, expect } from 'vitest';
import { getMediaType, getMediaUrl } from './mediaType';
import type { Memory } from '../types/memory';

describe('getMediaType', () => {
  it('should return "video" for .mp4 extension', () => {
    expect(getMediaType('/videos/sample.mp4')).toBe('video');
  });

  it('should return "video" for .webm extension', () => {
    expect(getMediaType('/videos/sample.webm')).toBe('video');
  });

  it('should return "video" for .mov extension', () => {
    expect(getMediaType('/videos/sample.mov')).toBe('video');
  });

  it('should return "video" for .ogg extension', () => {
    expect(getMediaType('/videos/sample.ogg')).toBe('video');
  });

  it('should return "image" for .jpg extension', () => {
    expect(getMediaType('/images/photo.jpg')).toBe('image');
  });

  it('should return "image" for .jpeg extension', () => {
    expect(getMediaType('/images/photo.jpeg')).toBe('image');
  });

  it('should return "image" for .png extension', () => {
    expect(getMediaType('/images/photo.png')).toBe('image');
  });

  it('should return "image" for .gif extension', () => {
    expect(getMediaType('/images/photo.gif')).toBe('image');
  });

  it('should return "image" for .webp extension', () => {
    expect(getMediaType('/images/photo.webp')).toBe('image');
  });

  it('should return "image" for .svg extension', () => {
    expect(getMediaType('/images/icon.svg')).toBe('image');
  });

  it('should be case-insensitive', () => {
    expect(getMediaType('/videos/sample.MP4')).toBe('video');
    expect(getMediaType('/images/photo.JPG')).toBe('image');
  });

  it('should return null for undefined', () => {
    expect(getMediaType(undefined)).toBe(null);
  });

  it('should return null for unrecognized extension', () => {
    expect(getMediaType('/files/document.pdf')).toBe(null);
  });

  it('should return null for URL without extension', () => {
    expect(getMediaType('/files/noextension')).toBe(null);
  });
});

describe('getMediaUrl', () => {
  it('should return videoUrl when present', () => {
    const memory: Memory = {
      id: '1',
      date: '2024-01-01',
      title: 'Test',
      description: 'Test memory',
      lat: 0,
      lng: 0,
      videoUrl: '/videos/test.mp4'
    };
    expect(getMediaUrl(memory)).toBe('/videos/test.mp4');
  });

  it('should return imageUrl when videoUrl is not present', () => {
    const memory: Memory = {
      id: '1',
      date: '2024-01-01',
      title: 'Test',
      description: 'Test memory',
      lat: 0,
      lng: 0,
      imageUrl: '/images/test.jpg'
    };
    expect(getMediaUrl(memory)).toBe('/images/test.jpg');
  });

  it('should prioritize videoUrl over imageUrl when both are present', () => {
    const memory: Memory = {
      id: '1',
      date: '2024-01-01',
      title: 'Test',
      description: 'Test memory',
      lat: 0,
      lng: 0,
      videoUrl: '/videos/test.mp4',
      imageUrl: '/images/test.jpg'
    };
    expect(getMediaUrl(memory)).toBe('/videos/test.mp4');
  });

  it('should return undefined when neither videoUrl nor imageUrl is present', () => {
    const memory: Memory = {
      id: '1',
      date: '2024-01-01',
      title: 'Test',
      description: 'Test memory',
      lat: 0,
      lng: 0
    };
    expect(getMediaUrl(memory)).toBe(undefined);
  });
});
