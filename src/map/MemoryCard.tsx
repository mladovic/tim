import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { Memory } from '../types';
import { getMediaType, getMediaUrl } from '../utils/mediaType';

export interface MemoryCardProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  onVideoEnd?: () => void;
}

const popupVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const bottomSheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

const SWIPE_OFFSET_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function MemoryCard({ memory, isOpen, onClose, onVideoEnd }: MemoryCardProps) {
  const isDesktop = useIsDesktop();
  const variant = isDesktop ? 'popup' : 'bottom-sheet';
  const variants = isDesktop ? popupVariants : bottomSheetVariants;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  const mediaUrl = memory ? getMediaUrl(memory) : undefined;
  const mediaType = getMediaType(mediaUrl);

  // Debug logging
  useEffect(() => {
    if (memory) {
      console.log('MemoryCard Debug:', {
        memoryId: memory.id,
        videoUrl: memory.videoUrl,
        imageUrl: memory.imageUrl,
        mediaUrl,
        mediaType,
        isOpen
      });
    }
  }, [memory, mediaUrl, mediaType, isOpen]);

  // Autoplay video when card opens and handle lifecycle
  useEffect(() => {
    if (isOpen && videoRef.current && mediaType === 'video') {
      // Reset error and loading states
      setVideoError(false);
      setIsVideoLoading(true);
      
      // Attempt to play video
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoLoading(false);
          })
          .catch((error) => {
            console.error('Video autoplay failed:', error);
            setIsVideoLoading(false);
          });
      }
    } else if (!isOpen && videoRef.current) {
      // Pause and reset video when card closes
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setVideoError(false);
      setIsVideoLoading(false);
    }
  }, [isOpen, memory, mediaType]);

  const handleDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      if (
        info.offset.y > SWIPE_OFFSET_THRESHOLD ||
        info.velocity.y > SWIPE_VELOCITY_THRESHOLD
      ) {
        onClose();
      }
    },
    [onClose],
  );

  const dragProps = !isDesktop
    ? {
        drag: 'y' as const,
        dragConstraints: { top: 0 },
        onDragEnd: handleDragEnd,
      }
    : {};

  return (
    <AnimatePresence>
      {isOpen && memory && (
        <>
          <div
            key="memory-card-backdrop"
            data-testid="memory-card-backdrop"
            onClick={onClose}
            className="fixed inset-0 z-[999]"
          />
          <motion.div
            key="memory-card"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25 }}
            role="article"
            {...dragProps}
            className={
              variant === 'popup'
                ? 'popup bg-surface rounded-2xl shadow-xl overflow-hidden max-w-md w-full z-[1000] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : 'bottom-sheet bg-surface rounded-t-2xl shadow-xl overflow-y-auto w-full z-[1000] fixed bottom-0 left-0 right-0 h-[75vh]'
            }
          >
            <div className={variant === 'popup' ? 'relative flex' : 'relative'}>
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-body hover:bg-white transition-colors"
              >
                &times;
              </button>

              {mediaType === 'video' && mediaUrl && (
                <div className="relative">
                  {!videoError ? (
                    <>
                      <video
                        ref={videoRef}
                        src={mediaUrl}
                        controls
                        autoPlay
                        playsInline
                        preload="auto"
                        aria-label={`Video: ${memory.title}`}
                        onLoadStart={() => setIsVideoLoading(true)}
                        onLoadedMetadata={() => setIsVideoLoading(false)}
                        onEnded={() => onVideoEnd?.()}
                        onError={(e) => {
                          console.error('Video error:', e, 'URL:', mediaUrl);
                          setIsVideoLoading(false);
                          setVideoError(true);
                        }}
                        className={
                          variant === 'popup'
                            ? 'h-48 w-40 object-cover flex-shrink-0'
                            : 'w-full h-[50vh] object-cover'
                        }
                      >
                        <source src={mediaUrl} type="video/mp4" />
                        Your browser does not support video playback.
                      </video>
                      {isVideoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className={
                        variant === 'popup'
                          ? 'h-48 w-40 flex items-center justify-center bg-gray-100 text-gray-600 text-sm p-4 text-center flex-shrink-0'
                          : 'w-full h-[50vh] flex items-center justify-center bg-gray-100 text-gray-600 text-sm p-4 text-center'
                      }
                    >
                      Unable to load video. The video file may be unavailable or in an unsupported format.
                    </div>
                  )}
                </div>
              )}

              {mediaType === 'image' && mediaUrl && (
                <img
                  src={mediaUrl}
                  alt={memory.title}
                  loading="lazy"
                  className={
                    variant === 'popup'
                      ? 'h-48 w-40 object-cover flex-shrink-0'
                      : 'w-full h-[50vh] object-cover'
                  }
                />
              )}

              <div className="p-4">
                <h3 className="font-script text-2xl text-body">{memory.title}</h3>
                <time className="text-sm text-body/60">{memory.date}</time>
                <p className="mt-2 text-body font-sans text-sm leading-relaxed">
                  {memory.description}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
