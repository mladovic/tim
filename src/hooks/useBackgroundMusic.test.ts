import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundMusic } from './useBackgroundMusic';

describe('useBackgroundMusic', () => {
  let mockAudio: {
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    currentTime: number;
    preload: string;
  };

  beforeEach(() => {
    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      currentTime: 0,
      preload: '',
    };

    // Mock the Audio constructor
    (window as any).Audio = vi.fn(function (this: any) {
      return mockAudio;
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create audio element with correct URL on mount', () => {
    renderHook(() =>
      useBackgroundMusic({
        isPlaying: false,
        audioUrl: '/music/test.mp3',
      })
    );

    expect((window as any).Audio).toHaveBeenCalledWith('/music/test.mp3');
    expect(mockAudio.preload).toBe('auto');
  });

  it('should add event listeners for canplaythrough and error', () => {
    renderHook(() =>
      useBackgroundMusic({
        isPlaying: false,
        audioUrl: '/music/test.mp3',
      })
    );

    expect(mockAudio.addEventListener).toHaveBeenCalledWith(
      'canplaythrough',
      expect.any(Function)
    );
    expect(mockAudio.addEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );
  });

  it('should call play() when isPlaying becomes true', () => {
    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useBackgroundMusic({
          isPlaying,
          audioUrl: '/music/test.mp3',
        }),
      { initialProps: { isPlaying: false } }
    );

    expect(mockAudio.play).not.toHaveBeenCalled();

    rerender({ isPlaying: true });

    expect(mockAudio.play).toHaveBeenCalledTimes(1);
  });

  it('should call pause() and reset currentTime when isPlaying becomes false', () => {
    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useBackgroundMusic({
          isPlaying,
          audioUrl: '/music/test.mp3',
        }),
      { initialProps: { isPlaying: true } }
    );

    mockAudio.currentTime = 30;

    rerender({ isPlaying: false });

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
  });

  it('should set isLoaded to true when canplaythrough event fires', () => {
    const { result } = renderHook(() =>
      useBackgroundMusic({
        isPlaying: false,
        audioUrl: '/music/test.mp3',
      })
    );

    expect(result.current.isLoaded).toBe(false);

    // Simulate canplaythrough event
    const canPlayThroughHandler = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === 'canplaythrough'
    )?.[1];
    
    act(() => {
      canPlayThroughHandler?.();
    });

    expect(result.current.isLoaded).toBe(true);
  });

  it('should set error when audio loading fails', () => {
    const { result } = renderHook(() =>
      useBackgroundMusic({
        isPlaying: false,
        audioUrl: '/music/test.mp3',
      })
    );

    expect(result.current.error).toBe(null);

    // Simulate error event
    const errorHandler = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === 'error'
    )?.[1];
    
    act(() => {
      errorHandler?.();
    });

    expect(result.current.error).toBe('Failed to load music');
  });

  it('should handle play() promise rejection', async () => {
    const playError = new Error('Autoplay blocked');
    mockAudio.play.mockRejectedValueOnce(playError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useBackgroundMusic({
        isPlaying: true,
        audioUrl: '/music/test.mp3',
      })
    );

    // Wait for promise rejection to be handled
    await vi.waitFor(() => {
      expect(result.current.error).toBe('Failed to play music');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to play background music:',
      playError
    );

    consoleErrorSpy.mockRestore();
  });

  it('should cleanup audio element on unmount', () => {
    const { unmount } = renderHook(() =>
      useBackgroundMusic({
        isPlaying: false,
        audioUrl: '/music/test.mp3',
      })
    );

    unmount();

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith(
      'canplaythrough',
      expect.any(Function)
    );
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );
  });

  it('should handle multiple play/pause cycles correctly', () => {
    const { rerender } = renderHook(
      ({ isPlaying }) =>
        useBackgroundMusic({
          isPlaying,
          audioUrl: '/music/test.mp3',
        }),
      { initialProps: { isPlaying: false } }
    );

    // First play
    rerender({ isPlaying: true });
    expect(mockAudio.play).toHaveBeenCalledTimes(1);

    // Stop
    mockAudio.currentTime = 30; // Simulate playback
    rerender({ isPlaying: false });
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);

    // Reset mock counts for next cycle
    mockAudio.play.mockClear();
    mockAudio.pause.mockClear();

    // Play again
    rerender({ isPlaying: true });
    expect(mockAudio.play).toHaveBeenCalledTimes(1);

    // Stop again
    mockAudio.currentTime = 45;
    rerender({ isPlaying: false });
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
  });
});
