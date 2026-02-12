import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useMemories } from '../hooks/useMemories';

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
}));

vi.mock('../hooks/useMemories', () => ({
  useMemories: vi.fn(),
}));

const mockUseMemories = vi.mocked(useMemories);

import { MapView } from './MapView';

describe('MapView', () => {
  beforeEach(() => {
    mockUseMemories.mockReturnValue({ memories: [], loading: false, error: null });
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
      mockUseMemories.mockReturnValue({
        memories: [{ id: '1', date: '2023-01-01', title: 'Test', description: 'Desc', lat: 48, lng: 2, zoomLevel: 13 }],
        loading: false,
        error: null,
      });
      render(<MapView />);
      expect(screen.queryByTestId('map-loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-empty')).not.toBeInTheDocument();
    });
  });
});
