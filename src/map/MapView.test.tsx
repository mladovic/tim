import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemories } from '../hooks/useMemories';
import { useStoryMode } from '../hooks/useStoryMode';
import type { Memory } from '../types';

const { mockMarker, mockDivIcon } = vi.hoisted(() => ({
  mockMarker: vi.fn(),
  mockDivIcon: vi.fn((opts: Record<string, unknown>) => opts),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children, className, zoomControl }: Record<string, unknown>) => (
    <div
      data-testid="map-container"
      className={className as string}
      data-zoom-control={String(zoomControl)}
    >
      {children as React.ReactNode}
    </div>
  )),
  TileLayer: vi.fn((props: Record<string, unknown>) => (
    <div
      data-testid="tile-layer"
      data-url={props.url as string}
      data-attribution={props.attribution as string}
    />
  )),
  ZoomControl: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="zoom-control" data-position={props.position as string} />
  )),
  Marker: (props: Record<string, unknown>) => {
    mockMarker(props);
    return (
      <div
        data-testid="leaflet-marker"
        onClick={() => {
          const handlers = props.eventHandlers as Record<string, () => void> | undefined;
          handlers?.click?.();
        }}
      />
    );
  },
}));

vi.mock('leaflet', () => ({
  default: { divIcon: mockDivIcon },
  divIcon: mockDivIcon,
}));

vi.mock('../hooks/useMemories', () => ({
  useMemories: vi.fn(),
}));

vi.mock('../hooks/useStoryMode', () => ({
  useStoryMode: vi.fn(),
}));

vi.mock('./MapController', () => ({
  MapController: vi.fn(() => <div data-testid="map-controller" />),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeProps[key] = value;
        }
      }
      return <div onClick={onClick} {...safeProps}>{children}</div>;
    },
    button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => {
      const safeProps: Record<string, string | number | boolean | undefined> = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeProps[key] = value;
        }
      }
      return <button onClick={onClick} {...safeProps}>{children}</button>;
    },
  },
}));

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matches && query === '(min-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

const mockUseMemories = vi.mocked(useMemories);
const mockUseStoryMode = vi.mocked(useStoryMode);

import { MapView } from './MapView';

const sampleMemories: Memory[] = [
  { id: '1', date: '2023-01-01', title: 'Memory One', description: 'Desc 1', lat: 48, lng: 2, zoomLevel: 13 },
  { id: '2', date: '2023-06-15', title: 'Memory Two', description: 'Desc 2', lat: 45, lng: 14, imageUrl: '/images/two.jpg', zoomLevel: 14 },
  { id: '3', date: '2023-12-25', title: 'Memory Three', description: 'Desc 3', lat: 40, lng: -74, zoomLevel: 12 },
];

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
    mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
    mockUseStoryMode.mockReturnValue({
      isPlaying: false,
      currentMemory: null,
      currentIndex: 0,
      totalMemories: 0,
      isEmpty: false,
      start: vi.fn(),
      stop: vi.fn(),
    });
  });

  describe('map surface', () => {
    it('renders a Leaflet MapContainer', () => {
      render(<MapView />);
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('applies the pink-tint-tiles CSS class to the map container', () => {
      render(<MapView />);
      const container = screen.getByTestId('map-container');
      expect(container.className).toContain('pink-tint-tiles');
    });

    it('renders the map container at full viewport height', () => {
      render(<MapView />);
      const container = screen.getByTestId('map-container');
      expect(container.className).toContain('h-dvh');
    });

    it('uses CartoDB Positron as the tile layer source', () => {
      render(<MapView />);
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer.dataset.url).toContain('basemaps.cartocdn.com');
      expect(tileLayer.dataset.url).toContain('light_all');
    });

    it('includes OpenStreetMap and CARTO attribution on the tile layer', () => {
      render(<MapView />);
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer.dataset.attribution).toContain('OpenStreetMap');
      expect(tileLayer.dataset.attribution).toContain('CARTO');
    });

    it('disables the default zoom control on MapContainer', () => {
      render(<MapView />);
      const container = screen.getByTestId('map-container');
      expect(container.dataset.zoomControl).toBe('false');
    });

    it('renders a ZoomControl positioned on the left side', () => {
      render(<MapView />);
      const zoomControl = screen.getByTestId('zoom-control');
      expect(zoomControl.dataset.position).toBe('bottomleft');
    });

    it('wraps MapContainer in a relative parent div', () => {
      render(<MapView />);
      const container = screen.getByTestId('map-container');
      const wrapper = container.parentElement!;
      expect(wrapper.className).toContain('relative');
      expect(wrapper.className).toContain('h-dvh');
    });
  });

  describe('data loading states', () => {
    it('displays a loading indicator while memory data is being fetched', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: true, error: null });
      render(<MapView />);
      expect(screen.getByTestId('map-loading')).toBeInTheDocument();
    });

    it('does not display loading indicator after data has loaded', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
      render(<MapView />);
      expect(screen.queryByTestId('map-loading')).not.toBeInTheDocument();
    });

    it('displays an error message when the data fetch fails', () => {
      mockUseMemories.mockReturnValue({
        memories: [],
        loading: false,
        error: 'Failed to load memories. Please check your connection and try again.',
      });
      render(<MapView />);
      const errorEl = screen.getByTestId('map-error');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl.textContent).toContain('Failed to load memories');
    });

    it('does not display error message when there is no error', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
      render(<MapView />);
      expect(screen.queryByTestId('map-error')).not.toBeInTheDocument();
    });

    it('displays a "No memories yet" message when memories array is empty', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
      render(<MapView />);
      expect(screen.getByTestId('map-empty')).toBeInTheDocument();
      expect(screen.getByTestId('map-empty').textContent).toContain('No memories yet');
    });

    it('does not display empty message while still loading', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: true, error: null });
      render(<MapView />);
      expect(screen.queryByTestId('map-empty')).not.toBeInTheDocument();
    });

    it('does not display empty message when there is an error', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: 'Some error' });
      render(<MapView />);
      expect(screen.queryByTestId('map-empty')).not.toBeInTheDocument();
    });

    it('does not display any overlay when memories are loaded successfully', () => {
      mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
      render(<MapView />);
      expect(screen.queryByTestId('map-loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-empty')).not.toBeInTheDocument();
    });
  });

  describe('logo overlay', () => {
    it('always renders the LogoOverlay after authentication', () => {
      render(<MapView />);
      expect(screen.getByTestId('logo-overlay')).toBeInTheDocument();
    });

    it('renders the logo even while loading', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: true, error: null });
      render(<MapView />);
      expect(screen.getByTestId('logo-overlay')).toBeInTheDocument();
    });

    it('renders the logo when memories are empty', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
      render(<MapView />);
      expect(screen.getByTestId('logo-overlay')).toBeInTheDocument();
    });
  });

  describe('heart markers', () => {
    it('renders one HeartMarker per memory when loaded', () => {
      mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
      render(<MapView />);
      const markers = screen.getAllByTestId('leaflet-marker');
      expect(markers).toHaveLength(3);
    });

    it('does not render HeartMarkers while loading', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: true, error: null });
      render(<MapView />);
      expect(screen.queryAllByTestId('leaflet-marker')).toHaveLength(0);
    });

    it('does not render HeartMarkers when there is an error', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: 'Error' });
      render(<MapView />);
      expect(screen.queryAllByTestId('leaflet-marker')).toHaveLength(0);
    });

    it('does not render HeartMarkers when memories is empty', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
      render(<MapView />);
      expect(screen.queryAllByTestId('leaflet-marker')).toHaveLength(0);
    });
  });

  describe('play story button', () => {
    it('renders the PlayStoryButton when memories are loaded', () => {
      mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
      render(<MapView />);
      expect(screen.getByText(/Play Our Story/)).toBeInTheDocument();
    });

    it('does not render PlayStoryButton while loading', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: true, error: null });
      render(<MapView />);
      expect(screen.queryByText(/Play Our Story/)).not.toBeInTheDocument();
    });

    it('does not render PlayStoryButton when memories is empty', () => {
      mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
      render(<MapView />);
      expect(screen.queryByText(/Play Our Story/)).not.toBeInTheDocument();
    });
  });

  describe('marker click and memory card', () => {
    it('opens the MemoryCard when a HeartMarker is clicked', async () => {
      mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
      const user = userEvent.setup();
      render(<MapView />);
      const markers = screen.getAllByTestId('leaflet-marker');
      await user.click(markers[1]);
      expect(screen.getByText('Memory Two')).toBeInTheDocument();
    });

    it('closes the MemoryCard when the close button is clicked', async () => {
      mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
      const user = userEvent.setup();
      render(<MapView />);
      await user.click(screen.getAllByTestId('leaflet-marker')[0]);
      expect(screen.getByText('Memory One')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByText('Memory One')).not.toBeInTheDocument();
    });
  });

  describe('story mode integration', () => {
    const mockStart = vi.fn();
    const mockStop = vi.fn();

    beforeEach(() => {
      mockUseMemories.mockReturnValue({ memories: sampleMemories, loading: false, error: null });
      mockUseStoryMode.mockReturnValue({
        isPlaying: false,
        currentMemory: null,
        currentIndex: 0,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
    });

    it('renders MapController inside the map container', () => {
      render(<MapView />);
      const mapContainer = screen.getByTestId('map-container');
      const mapController = screen.getByTestId('map-controller');
      expect(mapContainer).toContainElement(mapController);
    });

    it('calls useStoryMode with the memories array', () => {
      render(<MapView />);
      expect(mockUseStoryMode).toHaveBeenCalledWith(
        expect.objectContaining({
          memories: sampleMemories,
        }),
      );
    });

    it('wires the start action to PlayStoryButton', async () => {
      const user = userEvent.setup();
      render(<MapView />);
      await user.click(screen.getByText(/Play Our Story/));
      expect(mockStart).toHaveBeenCalledOnce();
    });

    it('passes real isPlaying state to LogoOverlay instead of hardcoded false', () => {
      mockUseStoryMode.mockReturnValue({
        isPlaying: true,
        currentMemory: sampleMemories[0],
        currentIndex: 0,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
      render(<MapView />);
      const logo = screen.getByTestId('logo-overlay');
      expect(logo.className).toContain('pointer-events-none');
    });

    it('passes real isPlaying state to PlayStoryButton instead of hardcoded false', () => {
      mockUseStoryMode.mockReturnValue({
        isPlaying: true,
        currentMemory: sampleMemories[0],
        currentIndex: 0,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
      render(<MapView />);
      const button = screen.getByText(/Play Our Story/).closest('button');
      expect(button).toBeDisabled();
    });

    it('renders StoryModeOverlay with progress during playback', () => {
      mockUseStoryMode.mockReturnValue({
        isPlaying: true,
        currentMemory: sampleMemories[1],
        currentIndex: 1,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
      render(<MapView />);
      expect(screen.getByTestId('story-mode-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('story-progress')).toHaveTextContent('Memory 2 of 3');
    });

    it('wires the stop action to StoryModeOverlay stop button', async () => {
      mockUseStoryMode.mockReturnValue({
        isPlaying: true,
        currentMemory: sampleMemories[0],
        currentIndex: 0,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
      const user = userEvent.setup();
      render(<MapView />);
      await user.click(screen.getByRole('button', { name: /stop story mode/i }));
      expect(mockStop).toHaveBeenCalledOnce();
    });

    it('does not render StoryModeOverlay when not playing', () => {
      render(<MapView />);
      expect(screen.queryByTestId('story-mode-overlay')).not.toBeInTheDocument();
    });

    it('adds story-playing class to the map wrapper when playback is active', () => {
      mockUseStoryMode.mockReturnValue({
        isPlaying: true,
        currentMemory: sampleMemories[0],
        currentIndex: 0,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
      render(<MapView />);
      const wrapper = screen.getByTestId('map-container').parentElement!;
      expect(wrapper.className).toContain('story-playing');
    });

    it('does not add story-playing class when not playing', () => {
      render(<MapView />);
      const wrapper = screen.getByTestId('map-container').parentElement!;
      expect(wrapper.className).not.toContain('story-playing');
    });

    it('suppresses marker clicks during playback so the cinematic sequence is not interrupted', async () => {
      mockUseStoryMode.mockReturnValue({
        isPlaying: true,
        currentMemory: sampleMemories[0],
        currentIndex: 0,
        totalMemories: 3,
        isEmpty: false,
        start: mockStart,
        stop: mockStop,
      });
      const user = userEvent.setup();
      render(<MapView />);
      const markers = screen.getAllByTestId('leaflet-marker');
      await user.click(markers[0]);
      // MemoryCard should NOT open — the card content should not appear
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });
});
