import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import type { Memory } from '../types';

/* ------------------------------------------------------------------ */
/* Controllable mock Leaflet map                                       */
/* ------------------------------------------------------------------ */
const { mockMap, moveEndHandlers } = vi.hoisted(() => {
  const moveEndHandlers: Array<() => void> = [];
  const mockMap = {
    flyTo: vi.fn(),
    once: vi.fn((_event: string, handler: () => void) => {
      moveEndHandlers.push(handler);
    }),
  };
  return { mockMap, moveEndHandlers };
});

/** Resolve the oldest pending fly animation by firing its moveend handler */
function resolveFly() {
  const handler = moveEndHandlers.shift();
  if (handler) handler();
}

/* ------------------------------------------------------------------ */
/* Module mocks — we mock react-leaflet, leaflet, useMemories, and     */
/* framer-motion but NOT useStoryMode or MapController so the real     */
/* orchestration pipeline is tested end-to-end.                        */
/* ------------------------------------------------------------------ */
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children, className }: Record<string, unknown>) => (
    <div data-testid="map-container" className={className as string}>
      {children as React.ReactNode}
    </div>
  )),
  TileLayer: vi.fn(() => <div data-testid="tile-layer" />),
  ZoomControl: vi.fn(() => <div data-testid="zoom-control" />),
  Marker: vi.fn((props: Record<string, unknown>) => (
    <div
      data-testid="leaflet-marker"
      onClick={() => {
        const handlers = props.eventHandlers as Record<string, () => void> | undefined;
        handlers?.click?.();
      }}
    />
  )),
  useMap: vi.fn(() => mockMap),
}));

vi.mock('leaflet', () => ({
  default: { divIcon: vi.fn((opts: Record<string, unknown>) => opts) },
  divIcon: vi.fn((opts: Record<string, unknown>) => opts),
}));

vi.mock('../hooks/useMemories', () => ({
  useMemories: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      onClick,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeProps[key] = value;
        }
      }
      return (
        <div onClick={onClick} {...safeProps}>
          {children}
        </div>
      );
    },
    button: ({
      children,
      onClick,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => {
      const safeProps: Record<string, string | number | boolean | undefined> = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeProps[key] = value;
        }
      }
      return (
        <button onClick={onClick} {...safeProps}>
          {children}
        </button>
      );
    },
  },
}));

import { useMemories } from '../hooks/useMemories';
import { MapView } from './MapView';

const mockUseMemories = vi.mocked(useMemories);

const sampleMemories: Memory[] = [
  { id: '1', date: '2023-01-01', title: 'Memory One', description: 'Desc 1', lat: 48, lng: 2, zoomLevel: 13 },
  { id: '2', date: '2023-06-15', title: 'Memory Two', description: 'Desc 2', lat: 45, lng: 14, zoomLevel: 14 },
  { id: '3', date: '2023-12-25', title: 'Memory Three', description: 'Desc 3', lat: 40, lng: -74, zoomLevel: 12 },
];

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe('Story Mode integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    moveEndHandlers.length = 0;
    mockMatchMedia();
    mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays through the full sequence: fly -> card -> pause -> hide -> next -> ... -> end -> UI restored', async () => {
    render(<MapView />);

    // Play button visible, overlay not shown
    expect(screen.getByText(/Play Our Story/)).toBeInTheDocument();
    expect(screen.queryByTestId('story-mode-overlay')).not.toBeInTheDocument();

    // Start playback
    await act(async () => {
      fireEvent.click(screen.getByText(/Play Our Story/));
      await vi.advanceTimersByTimeAsync(0);
    });

    // Overlay appears, wrapper has story-playing class
    expect(screen.getByTestId('story-mode-overlay')).toBeInTheDocument();
    const wrapper = screen.getByTestId('map-container').parentElement!;
    expect(wrapper.className).toContain('story-playing');

    // Fly to memory 1 in progress
    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
    expect(mockMap.flyTo).toHaveBeenCalledWith([48, 2], 13, { duration: 3 });
    expect(screen.getByTestId('story-progress')).toHaveTextContent('Memory 1 of 3');

    // Card not shown yet (still flying)
    expect(screen.queryByText('Memory One')).not.toBeInTheDocument();

    // Complete fly 1
    await act(async () => {
      resolveFly();
      await vi.advanceTimersByTimeAsync(0);
    });

    // Card shown for memory 1
    expect(screen.getByText('Memory One')).toBeInTheDocument();

    // Advance reading pause (5500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5500);
    });

    // Card hidden, flying to memory 2
    expect(screen.queryByText('Memory One')).not.toBeInTheDocument();
    expect(mockMap.flyTo).toHaveBeenCalledTimes(2);
    expect(mockMap.flyTo).toHaveBeenCalledWith([45, 14], 14, { duration: 3 });
    expect(screen.getByTestId('story-progress')).toHaveTextContent('Memory 2 of 3');

    // Complete fly 2
    await act(async () => {
      resolveFly();
      await vi.advanceTimersByTimeAsync(0);
    });

    // Card shown for memory 2
    expect(screen.getByText('Memory Two')).toBeInTheDocument();

    // Advance reading pause
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5500);
    });

    // Flying to memory 3
    expect(screen.queryByText('Memory Two')).not.toBeInTheDocument();
    expect(mockMap.flyTo).toHaveBeenCalledTimes(3);
    expect(mockMap.flyTo).toHaveBeenCalledWith([40, -74], 12, { duration: 3 });
    expect(screen.getByTestId('story-progress')).toHaveTextContent('Memory 3 of 3');

    // Complete fly 3
    await act(async () => {
      resolveFly();
      await vi.advanceTimersByTimeAsync(0);
    });

    // Card shown for memory 3
    expect(screen.getByText('Memory Three')).toBeInTheDocument();

    // Advance last reading pause
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5500);
    });

    // Playback complete: overlay gone, story-playing class removed, play button restored
    expect(screen.queryByTestId('story-mode-overlay')).not.toBeInTheDocument();
    expect(wrapper.className).not.toContain('story-playing');
    expect(screen.getByText(/Play Our Story/)).toBeInTheDocument();
  });

  it('stops mid-sequence: start -> fly -> card -> stop -> card closed -> UI restored', async () => {
    render(<MapView />);

    // Start playback
    await act(async () => {
      fireEvent.click(screen.getByText(/Play Our Story/));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByTestId('story-mode-overlay')).toBeInTheDocument();

    // Complete fly 1
    await act(async () => {
      resolveFly();
      await vi.advanceTimersByTimeAsync(0);
    });

    // Card visible
    expect(screen.getByText('Memory One')).toBeInTheDocument();

    // Click the stop button
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /stop story mode/i }));
      await vi.advanceTimersByTimeAsync(0);
    });

    // Card hidden, overlay gone, UI restored
    expect(screen.queryByText('Memory One')).not.toBeInTheDocument();
    expect(screen.queryByTestId('story-mode-overlay')).not.toBeInTheDocument();
    const wrapper = screen.getByTestId('map-container').parentElement!;
    expect(wrapper.className).not.toContain('story-playing');
    expect(screen.getByText(/Play Our Story/)).toBeInTheDocument();

    // No further fly calls after stop
    const flyCallCount = mockMap.flyTo.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(mockMap.flyTo).toHaveBeenCalledTimes(flyCallCount);
  });

  it('shows empty state and does not render Play button when no memories exist', () => {
    mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
    render(<MapView />);

    expect(screen.getByTestId('map-empty')).toBeInTheDocument();
    expect(screen.getByTestId('map-empty').textContent).toContain('No memories yet');
    expect(screen.queryByText(/Play Our Story/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('story-mode-overlay')).not.toBeInTheDocument();
  });
});
