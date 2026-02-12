import { motion } from 'framer-motion';

export interface PlayStoryButtonProps {
  onStart: () => void;
  isStoryPlaying: boolean;
}

export function PlayStoryButton({ onStart, isStoryPlaying }: PlayStoryButtonProps) {
  return (
    <motion.button
      onClick={onStart}
      disabled={isStoryPlaying}
      animate={{ opacity: isStoryPlaying ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-primary text-white rounded-full px-5 py-2.5 font-sans font-medium text-sm shadow-lg min-h-[44px] min-w-[44px] flex items-center gap-2 hover:bg-primary/90 transition-colors ${isStoryPlaying ? 'pointer-events-none' : ''}`}
    >
      <span>▶</span>
      <span>Play Our Story</span>
    </motion.button>
  );
}
