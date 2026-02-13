import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { MapControllerHandle } from './MapController';

type EventHandler = () => void;

const mockMap = {
  flyTo: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  panTo: vi.fn(),
  getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
  getZoom: vi.fn(() => 3),
};

vi.mock('react-leaflet', () => ({
  useMap: vi.fn(() => mockMap),
}));

import { MapController } from './MapController';

describe('MapController', () => {
  let capturedHandle: MapControllerHandle | null;
  let moveEndHandler: EventHandler | null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandle = null;
    moveEndHandler = null;

    mockMap.once.mockImplementation((event: string, handler: EventHandler) => {
      if (event === 'moveend') moveEndHandler = handler;
    });
    mockMap.getCenter.mockReturnValue({ lat: 0, lng: 0 });
    mockMap.getZoom.mockReturnValue(3);
  });

  function renderController() {
    render(
      <MapController onReady={(handle) => { capturedHandle = handle; }} />
    );
  }

  it('calls onReady with a handle containing flyToMemory on mount', () => {
    renderController();
    expect(capturedHandle).not.toBeNull();
    expect(typeof capturedHandle!.flyToMemory).toBe('function');
  });

  it('calls onReady with a handle containing followPosition and stopFollowing', () => {
    renderController();
    expect(capturedHandle).not.toBeNull();
    expect(typeof capturedHandle!.followPosition).toBe('function');
    expect(typeof capturedHandle!.stopFollowing).toBe('function');
    expect(typeof capturedHandle!.isFlyingTo).toBe('function');
  });

  it('calls map.flyTo with target coordinates, zoom, and default 3s duration', () => {
    renderController();
    capturedHandle!.flyToMemory(48.8566, 2.3522, 14);
    expect(mockMap.flyTo).toHaveBeenCalledWith([48.8566, 2.3522], 14, { duration: 3 });
  });

  it('uses a custom duration when provided', () => {
    renderController();
    capturedHandle!.flyToMemory(35, 135, 12, 5);
    expect(mockMap.flyTo).toHaveBeenCalledWith([35, 135], 12, { duration: 5 });
  });

  it('returns a Promise that resolves when moveend fires', async () => {
    renderController();
    const promise = capturedHandle!.flyToMemory(48, 2, 14);
    expect(moveEndHandler).not.toBeNull();
    moveEndHandler!();
    await expect(promise).resolves.toBeUndefined();
  });

  it('registers a moveend listener via map.once', () => {
    renderController();
    capturedHandle!.flyToMemory(48, 2, 14);
    expect(mockMap.once).toHaveBeenCalledWith('moveend', expect.any(Function));
  });

  it('ignores subsequent flyToMemory calls while an animation is in progress', () => {
    renderController();
    capturedHandle!.flyToMemory(48, 2, 14);
    capturedHandle!.flyToMemory(35, 135, 12);
    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
  });

  it('allows a new flyToMemory call after the previous animation completes', async () => {
    renderController();

    const first = capturedHandle!.flyToMemory(48, 2, 14);
    moveEndHandler!();
    await first;

    capturedHandle!.flyToMemory(35, 135, 12);
    expect(mockMap.flyTo).toHaveBeenCalledTimes(2);
  });

  it('guards against multiple moveend fires resolving the Promise more than once', async () => {
    renderController();
    let resolveCount = 0;
    const promise = capturedHandle!.flyToMemory(48, 2, 14).then(() => { resolveCount++; });
    moveEndHandler!();
    moveEndHandler!();
    await promise;
    expect(resolveCount).toBe(1);
  });

  it('followPosition pans to correct coordinates', () => {
    renderController();
    capturedHandle!.followPosition(41.9028, 12.4964);
    expect(mockMap.panTo).toHaveBeenCalledWith([41.9028, 12.4964], { animate: false });
  });

  it('followPosition pans immediately without animation', () => {
    renderController();
    capturedHandle!.followPosition(35.6762, 139.6503);
    expect(mockMap.panTo).toHaveBeenCalledWith([35.6762, 139.6503], { animate: false });
  });

  it('stopFollowing can be called without errors', () => {
    renderController();
    expect(() => capturedHandle!.stopFollowing()).not.toThrow();
  });

  it('followPosition can be called multiple times', () => {
    renderController();
    capturedHandle!.followPosition(40.7128, -74.0060);
    capturedHandle!.followPosition(51.5074, -0.1278);
    expect(mockMap.panTo).toHaveBeenCalledTimes(2);
    expect(mockMap.panTo).toHaveBeenNthCalledWith(1, [40.7128, -74.0060], { animate: false });
    expect(mockMap.panTo).toHaveBeenNthCalledWith(2, [51.5074, -0.1278], { animate: false });
  });

  it('isFlyingTo returns false when no animation is in progress', () => {
    renderController();
    expect(capturedHandle!.isFlyingTo()).toBe(false);
  });

  it('isFlyingTo returns true during flyTo animation', () => {
    renderController();
    capturedHandle!.flyToMemory(48, 2, 14);
    expect(capturedHandle!.isFlyingTo()).toBe(true);
  });

  it('isFlyingTo returns false after flyTo animation completes', async () => {
    renderController();
    const promise = capturedHandle!.flyToMemory(48, 2, 14);
    expect(capturedHandle!.isFlyingTo()).toBe(true);
    moveEndHandler!();
    await promise;
    expect(capturedHandle!.isFlyingTo()).toBe(false);
  });

  it('followPosition does not pan during flyTo animation', () => {
    renderController();
    capturedHandle!.flyToMemory(48, 2, 14);
    capturedHandle!.followPosition(41.9028, 12.4964);
    expect(mockMap.panTo).not.toHaveBeenCalled();
  });

  it('followPosition works after flyTo animation completes', async () => {
    renderController();
    const promise = capturedHandle!.flyToMemory(48, 2, 14);
    moveEndHandler!();
    await promise;
    capturedHandle!.followPosition(41.9028, 12.4964);
    expect(mockMap.panTo).toHaveBeenCalledWith([41.9028, 12.4964], { animate: false });
  });
});
