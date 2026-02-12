import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { useMemories } from '../hooks/useMemories';
import type { Memory } from '../types';
import { HeartMarker } from './HeartMarker';
import { MemoryCard } from './MemoryCard';
import { LogoOverlay } from './LogoOverlay';
import { PlayStoryButton } from './PlayStoryButton';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_CENTER: [number, number] = [44, 15];
const DEFAULT_ZOOM = 3;

export function MapView() {
  const { memories, loading, error } = useMemories();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);

  const handleMarkerClick = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setIsCardOpen(true);
  }, []);

  const handleCardClose = useCallback(() => {
    setIsCardOpen(false);
    setSelectedMemory(null);
  }, []);

  const hasMemories = !loading && !error && memories.length > 0;

  return (
    <div className="relative h-dvh">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="pink-tint-tiles h-dvh w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ZoomControl position="bottomleft" />

        {hasMemories &&
          memories.map((memory) => (
            <HeartMarker
              key={memory.id}
              memory={memory}
              isActive={selectedMemory?.id === memory.id}
              onClick={handleMarkerClick}
            />
          ))}
      </MapContainer>

      <LogoOverlay isStoryPlaying={false} />

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

      {hasMemories && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <PlayStoryButton onStart={() => {}} isStoryPlaying={false} />
        </div>
      )}

      <MemoryCard memory={selectedMemory} isOpen={isCardOpen} onClose={handleCardClose} />
    </div>
  );
}
