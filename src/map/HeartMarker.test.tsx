import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Memory } from '../types';

const { mockMarker, mockDivIcon } = vi.hoisted(() => ({
  mockMarker: vi.fn(),
  mockDivIcon: vi.fn((opts: Record<string, unknown>) => opts),
}));

vi.mock('react-leaflet', () => ({
  Marker: (props: Record<string, unknown>) => {
    mockMarker(props);
    return (
      <div
        data-testid="leaflet-marker"
        data-position={JSON.stringify(props.position)}
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

import { HeartMarker } from './HeartMarker';

const sampleMemory: Memory = {
  id: 'paris',
  date: '2023-04-15',
  title: 'Our First Trip',
  description: 'The most magical week.',
  lat: 48.8566,
  lng: 2.3522,
  zoomLevel: 14,
};

describe('HeartMarker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a Leaflet Marker at the memory coordinates', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
    expect(mockMarker).toHaveBeenCalledWith(
      expect.objectContaining({
        position: [48.8566, 2.3522],
      }),
    );
  });

  it('creates a DivIcon with an inline SVG heart path', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    expect(mockDivIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('<svg'),
      }),
    );
    expect(mockDivIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('<path'),
      }),
    );
  });

  it('fills the heart SVG with Rose Pink (#fb7185)', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    const call = mockDivIcon.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toContain('#fb7185');
  });

  it('applies a white stroke to the heart SVG', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    const call = mockDivIcon.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toContain('white');
  });

  it('sets the icon size to at least 44x44 pixels for mobile tap targets', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    expect(mockDivIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        iconSize: [44, 44],
      }),
    );
  });

  it('sets the icon anchor to bottom-center so the heart tip aligns with coordinates', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    expect(mockDivIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        iconAnchor: [22, 44],
      }),
    );
  });

  it('sets className to empty string to prevent Leaflet default icon styles', () => {
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    expect(mockDivIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        className: '',
      }),
    );
  });

  it('invokes the onClick callback with the associated memory when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={onClick} />,
    );
    await user.click(screen.getByTestId('leaflet-marker'));
    expect(onClick).toHaveBeenCalledWith(sampleMemory);
  });

  it('does not recreate the DivIcon when re-rendered with the same props', () => {
    const { rerender } = render(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    mockDivIcon.mockClear();
    rerender(
      <HeartMarker memory={sampleMemory} isActive={false} onClick={vi.fn()} />,
    );
    expect(mockDivIcon).not.toHaveBeenCalled();
  });
});
