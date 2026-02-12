import { AnimatePresence, motion } from 'framer-motion';

export interface StoryModeOverlayProps {
  isPlaying: boolean;
  currentIndex: number;
  totalMemories: number;
  onStop: () => void;
}

export function StoryModeOverlay({
  isPlaying,
  currentIndex,
  totalMemories,
  onStop,
}: StoryModeOverlayProps) {
  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          data-testid="story-mode-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-[1001] pointer-events-none flex flex-col items-center justify-start pt-4 lg:justify-end lg:pt-0 lg:pb-10 gap-3"
        >
          <p
            data-testid="story-progress"
            className="font-sans text-sm text-white drop-shadow-md"
          >
            Memory {currentIndex + 1} of {totalMemories}
          </p>
          <button
            onClick={onStop}
            aria-label="Stop Story Mode"
            className="pointer-events-auto min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white shadow-lg hover:bg-black/70 transition-colors"
          >
            <span className="text-lg">✕</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
