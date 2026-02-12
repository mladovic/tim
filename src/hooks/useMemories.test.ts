import { describe, it, expect } from 'vitest';
import { validateMemory, applyDefaults, DEFAULT_ZOOM_LEVEL } from './useMemories';

const validEntry = {
  id: 'paris-spring',
  date: '2023-04-15',
  title: 'Our First Trip',
  description: 'A wonderful trip.',
  lat: 48.8566,
  lng: 2.3522,
  imageUrl: '/images/paris.jpg',
  zoomLevel: 14,
};

describe('validateMemory', () => {
  it('returns true for a valid entry with all required fields', () => {
    expect(validateMemory(validEntry)).toBe(true);
  });

  it('returns true for a valid entry without optional fields', () => {
    const { imageUrl, zoomLevel, ...minimal } = validEntry;
    expect(validateMemory(minimal)).toBe(true);
  });

  it('returns false when id is missing', () => {
    const { id, ...entry } = validEntry;
    expect(validateMemory(entry)).toBe(false);
  });

  it('returns false when date is missing', () => {
    const { date, ...entry } = validEntry;
    expect(validateMemory(entry)).toBe(false);
  });

  it('returns false when title is missing', () => {
    const { title, ...entry } = validEntry;
    expect(validateMemory(entry)).toBe(false);
  });

  it('returns false when description is missing', () => {
    const { description, ...entry } = validEntry;
    expect(validateMemory(entry)).toBe(false);
  });

  it('returns false when lat is missing', () => {
    const { lat, ...entry } = validEntry;
    expect(validateMemory(entry)).toBe(false);
  });

  it('returns false when lng is missing', () => {
    const { lng, ...entry } = validEntry;
    expect(validateMemory(entry)).toBe(false);
  });

  it('returns false when id has wrong type', () => {
    expect(validateMemory({ ...validEntry, id: 123 })).toBe(false);
  });

  it('returns false when lat has wrong type', () => {
    expect(validateMemory({ ...validEntry, lat: '48.8566' })).toBe(false);
  });

  it('returns false when lng has wrong type', () => {
    expect(validateMemory({ ...validEntry, lng: null })).toBe(false);
  });

  it('returns false for null input', () => {
    expect(validateMemory(null)).toBe(false);
  });

  it('returns false for non-object input', () => {
    expect(validateMemory('string')).toBe(false);
    expect(validateMemory(42)).toBe(false);
    expect(validateMemory(undefined)).toBe(false);
  });

  it('returns true for entries with extra fields', () => {
    expect(validateMemory({ ...validEntry, extra: 'field' })).toBe(true);
  });
});

describe('applyDefaults', () => {
  it('applies default zoom level of 13 when zoomLevel is absent', () => {
    const { imageUrl, zoomLevel, ...raw } = validEntry;
    const result = applyDefaults(raw);
    expect(result.zoomLevel).toBe(DEFAULT_ZOOM_LEVEL);
    expect(DEFAULT_ZOOM_LEVEL).toBe(13);
  });

  it('preserves provided zoomLevel without modification', () => {
    const result = applyDefaults(validEntry);
    expect(result.zoomLevel).toBe(14);
  });

  it('leaves imageUrl as undefined when not present', () => {
    const { imageUrl, ...raw } = validEntry;
    const result = applyDefaults(raw);
    expect(result.imageUrl).toBeUndefined();
  });

  it('preserves provided imageUrl', () => {
    const result = applyDefaults(validEntry);
    expect(result.imageUrl).toBe('/images/paris.jpg');
  });

  it('returns a Memory object with all required fields', () => {
    const result = applyDefaults(validEntry);
    expect(result.id).toBe('paris-spring');
    expect(result.date).toBe('2023-04-15');
    expect(result.title).toBe('Our First Trip');
    expect(result.description).toBe('A wonderful trip.');
    expect(result.lat).toBe(48.8566);
    expect(result.lng).toBe(2.3522);
  });
});
