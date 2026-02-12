import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { useMemories } from '../hooks/useMemories';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_CENTER: [number, number] = [44, 15];
const DEFAULT_ZOOM = 3;

export function MapView() {
  const { memories, loading, error } = useMemories();

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className="pink-tint-tiles h-dvh w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ZoomControl position="bottomleft" />

      {loading && (
        <div data-testid="map-loading" className="absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="rounded-xl bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
            <p className="text-body text-lg">Loading memories...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div data-testid="map-error" className="absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="rounded-xl bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
            <p className="text-primary text-lg">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && memories.length === 0 && (
        <div data-testid="map-empty" className="absolute inset-0 z-[1000] flex items-center justify-center">
          <div className="rounded-xl bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
            <p className="text-body/70 text-lg">No memories yet</p>
          </div>
        </div>
      )}
    </MapContainer>
  );
}
