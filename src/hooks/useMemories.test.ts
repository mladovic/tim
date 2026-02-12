import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { validateMemory, applyDefaults, DEFAULT_ZOOM_LEVEL, useMemories } from './useMemories';

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

// Sample data for hook tests (deliberately unsorted)
const sampleMemories = [
  {
    id: 'new-york',
    date: '2024-12-31',
    title: 'Midnight in Manhattan',
    description: 'New Year in NYC.',
    lat: 40.7128,
    lng: -74.006,
    zoomLevel: 13,
  },
  {
    id: 'paris-spring',
    date: '2023-04-15',
    title: 'Our First Trip',
    description: 'A wonderful trip.',
    lat: 48.8566,
    lng: 2.3522,
    imageUrl: '/images/paris.jpg',
    zoomLevel: 14,
  },
  {
    id: 'kyoto-autumn',
    date: '2023-11-03',
    title: 'Temples & Tea',
    description: 'Golden leaves.',
    lat: 35.0116,
    lng: 135.7681,
  },
];

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

function mockFetchMalformedJson() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  });
}

function mockFetchHttpError(status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

describe('useMemories', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchSuccess(sampleMemories));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading true, empty memories, and null error', () => {
      // Use a never-resolving fetch to capture initial state
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
      const { result } = renderHook(() => useMemories());
      expect(result.current.loading).toBe(true);
      expect(result.current.memories).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('success path', () => {
    it('fetches from /moments.json on mount', async () => {
      renderHook(() => useMemories());
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
      expect(fetch).toHaveBeenCalledWith('/moments.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    });

    it('sets loading to false and error to null after successful fetch', async () => {
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBeNull();
    });

    it('returns memories sorted by date ascending', async () => {
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.memories.length).toBe(3);
      });
      expect(result.current.memories[0].id).toBe('paris-spring');   // 2023-04-15
      expect(result.current.memories[1].id).toBe('kyoto-autumn');   // 2023-11-03
      expect(result.current.memories[2].id).toBe('new-york');       // 2024-12-31
    });

    it('applies default zoomLevel of 13 to entries without zoomLevel', async () => {
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.memories.length).toBe(3);
      });
      const kyoto = result.current.memories.find(m => m.id === 'kyoto-autumn');
      expect(kyoto?.zoomLevel).toBe(13);
    });

    it('fetches exactly once per mount cycle', async () => {
      const { result, rerender } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      rerender();
      rerender();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('sets error message on network failure', async () => {
      vi.stubGlobal('fetch', mockFetchNetworkError());
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Failed to load memories. Please check your connection and try again.');
      expect(result.current.memories).toEqual([]);
    });

    it('sets error message on malformed JSON', async () => {
      vi.stubGlobal('fetch', mockFetchMalformedJson());
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Memory data is corrupted. Please try refreshing the page.');
      expect(result.current.memories).toEqual([]);
    });

    it('sets error message on HTTP error response', async () => {
      vi.stubGlobal('fetch', mockFetchHttpError(404));
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Failed to load memories. Please check your connection and try again.');
      expect(result.current.memories).toEqual([]);
    });

    it('sets corrupted data error when response is valid JSON but not an array', async () => {
      vi.stubGlobal('fetch', mockFetchSuccess({ not: 'an array' }));
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe('Memory data is corrupted. Please try refreshing the page.');
      expect(result.current.memories).toEqual([]);
    });

    it('uses different error messages for network vs parse errors', async () => {
      vi.stubGlobal('fetch', mockFetchNetworkError());
      const { result: networkResult } = renderHook(() => useMemories());
      await waitFor(() => expect(networkResult.current.loading).toBe(false));

      vi.stubGlobal('fetch', mockFetchMalformedJson());
      const { result: parseResult } = renderHook(() => useMemories());
      await waitFor(() => expect(parseResult.current.loading).toBe(false));

      expect(networkResult.current.error).not.toBe(parseResult.current.error);
    });

    it('does not throw exceptions on any error', async () => {
      vi.stubGlobal('fetch', mockFetchNetworkError());
      expect(() => {
        renderHook(() => useMemories());
      }).not.toThrow();
    });
  });

  describe('validation filtering', () => {
    it('excludes invalid entries and keeps valid ones', async () => {
      const mixedData = [
        sampleMemories[0],
        { id: 'broken', title: 'No coords' }, // invalid — missing required fields
        sampleMemories[1],
      ];
      vi.stubGlobal('fetch', mockFetchSuccess(mixedData));
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.memories.length).toBe(2);
      });
      expect(result.current.memories.every(m => m.id !== 'broken')).toBe(true);
    });

    it('returns empty array with no error when all entries are invalid', async () => {
      const allInvalid = [
        { id: 'bad1' },
        { title: 'bad2' },
      ];
      vi.stubGlobal('fetch', mockFetchSuccess(allInvalid));
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.memories).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('returns empty array with no error when response is empty array', async () => {
      vi.stubGlobal('fetch', mockFetchSuccess([]));
      const { result } = renderHook(() => useMemories());
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.memories).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('unmount cleanup', () => {
    it('aborts the fetch signal on unmount', () => {
      // Use a never-resolving fetch to keep the request in-flight
      let capturedSignal: AbortSignal | undefined;
      vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        capturedSignal = init?.signal;
        return new Promise(() => {}); // never resolves
      }));

      const { unmount } = renderHook(() => useMemories());
      expect(capturedSignal?.aborted).toBe(false);
      unmount();
      expect(capturedSignal?.aborted).toBe(true);
    });
  });
});
