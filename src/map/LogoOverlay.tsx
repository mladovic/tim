import { motion } from 'framer-motion';

export interface LogoOverlayProps {
  isStoryPlaying: boolean;
}

export function LogoOverlay({ isStoryPlaying }: LogoOverlayProps) {
  return (
    <motion.div
      data-testid="logo-overlay"
      animate={{ opacity: isStoryPlaying ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className={`absolute top-4 left-4 z-[1000] ${isStoryPlaying ? 'pointer-events-none' : ''}`}
    >
      <h1 data-testid="logo-text" className="font-display text-2xl sm:text-3xl leading-tight text-body">
        The Dream <span className="text-primary">Tea</span>m
      </h1>
      <p className="font-script text-sm text-body/70">feat. Marin</p>
    </motion.div>
  );
}
