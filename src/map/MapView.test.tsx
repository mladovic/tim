import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

import { MapView } from './MapView';

describe('MapView', () => {
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
