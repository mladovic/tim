import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_CENTER: [number, number] = [44, 15];
const DEFAULT_ZOOM = 3;

export function MapView() {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className="pink-tint-tiles h-dvh w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ZoomControl position="bottomleft" />
    </MapContainer>
  );
}
