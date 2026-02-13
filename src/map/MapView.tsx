import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { useMemories } from '../hooks/useMemories';
import { useStoryMode } from '../hooks/useStoryMode';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import type { Memory } from '../types';
import type { MapControllerHandle } from './MapController';
import { MapController } from './MapController';
import { HeartMarker } from './HeartMarker';
import { MemoryCard } from './MemoryCard';
import { LogoOverlay } from './LogoOverlay';
import { PlayStoryButton } from './PlayStoryButton';
import { StoryModeOverlay } from './StoryModeOverlay';
import { StoryPathLayer } from './StoryPathLayer';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_CENTER: [number, number] = [44, 15];
const DEFAULT_ZOOM = 3;

export function MapView() {
  const { memories, loading, error } = useMemories();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [mapHandle, setMapHandle] = useState<MapControllerHandle | null>(null);

  const handleMarkerClick = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setIsCardOpen(true);
  }, []);

  const handleCardClose = useCallback(() => {
    setIsCardOpen(false);
    setSelectedMemory(null);
  }, []);

  const showCard = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setIsCardOpen(true);
  }, []);

  const hideCard = useCallback(() => {
    setIsCardOpen(false);
    setSelectedMemory(null);
  }, []);

  const {
    isPlaying,
    currentIndex,
    totalMemories,
    start,
    stop,
  } = useStoryMode({
    memories,
    flyToMemory: mapHandle?.flyToMemory ?? null,
    showCard,
    hideCard,
    onTransitionStart: (fromIndex, toIndex) => {
      // Transition callbacks are handled by StoryPathLayer
      // This allows the airplane animation to coordinate with story mode
    },
    onTransitionComplete: (index) => {
      // Transition complete callback
      // StoryPathLayer uses this to know when to stop following
    },
  });

  useBackgroundMusic({
    isPlaying,
    audioUrl: '/music/fall-in-love.mp3',
  });

  const hasMemories = !loading && !error && memories.length > 0;

  return (
    <div className={`relative h-dvh${isPlaying ? ' story-playing' : ''}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="pink-tint-tiles h-dvh w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ZoomControl position="bottomleft" />
        <MapController onReady={setMapHandle} />

        {/* StoryPathLayer renders below markers for proper z-index */}
        <StoryPathLayer
          isPlaying={isPlaying}
          currentIndex={currentIndex}
          memories={memories}
          mapHandle={mapHandle}
        />

        {hasMemories &&
          memories.map((memory) => (
            <HeartMarker
              key={memory.id}
              memory={memory}
              isActive={selectedMemory?.id === memory.id}
              onClick={isPlaying ? () => {} : handleMarkerClick}
            />
          ))}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000] flex flex-col items-start gap-3 pointer-events-none sm:flex-row sm:items-start sm:justify-between sm:right-4">
        <LogoOverlay isStoryPlaying={isPlaying} />
        {hasMemories && (
          <div className="pointer-events-auto">
            <PlayStoryButton onStart={start} isStoryPlaying={isPlaying} />
          </div>
        )}
      </div>

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

      <MemoryCard memory={selectedMemory} isOpen={isCardOpen} onClose={handleCardClose} isStoryMode={isPlaying} />

      <StoryModeOverlay
        isPlaying={isPlaying}
        currentIndex={currentIndex}
        totalMemories={totalMemories}
        onStop={stop}
      />
    </div>
  );
}
