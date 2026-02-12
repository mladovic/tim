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
      className={isStoryPlaying ? 'pointer-events-none' : 'pointer-events-auto'}
    >
      <h1 data-testid="logo-text" className="font-display text-2xl sm:text-3xl lg:text-4xl leading-tight text-body">
        The Dream <span className="text-primary">Tea</span>m
      </h1>
      <p className="font-script text-sm sm:text-base text-body/70">feat. Marin</p>
    </motion.div>
  );
}
