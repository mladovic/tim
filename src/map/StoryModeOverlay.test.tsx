import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock translations for tests
const mockTranslations = {
  'story.memoryOf': 'Memory {current} of {total}',
  'story.stopButton': 'Stop Story Mode',
};

vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key,
    locale: 'hr',
    setLocale: vi.fn(),
    formatDate: (date: Date) => date.toLocaleDateString(),
    isLoading: false,
  }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          safeProps[key] = value;
        }
      }
      return (
        <div data-testid="motion-div" {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

import { StoryModeOverlay } from './StoryModeOverlay';

describe('StoryModeOverlay', () => {
  const defaultProps = {
    isPlaying: true,
    currentIndex: 1,
    totalMemories: 5,
    onStop: vi.fn(),
  };

  describe('when playing', () => {
    it('renders the overlay when isPlaying is true', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      expect(screen.getByTestId('story-mode-overlay')).toBeInTheDocument();
    });

    it('wraps content in AnimatePresence for mount/unmount transitions', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });

    it('renders a stop button', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    it('displays an X icon in the stop button', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('calls onStop when the stop button is clicked', async () => {
      const onStop = vi.fn();
      const user = userEvent.setup();
      render(<StoryModeOverlay {...defaultProps} onStop={onStop} />);
      await user.click(screen.getByRole('button', { name: /stop/i }));
      expect(onStop).toHaveBeenCalledOnce();
    });

    it('displays the progress indicator with current position', () => {
      render(<StoryModeOverlay {...defaultProps} currentIndex={1} totalMemories={5} />);
      expect(screen.getByText(/2.*5/i)).toBeInTheDocument();
    });

    it('displays correct progress for the first memory', () => {
      render(<StoryModeOverlay {...defaultProps} currentIndex={0} totalMemories={3} />);
      expect(screen.getByText(/1.*3/i)).toBeInTheDocument();
    });

    it('displays correct progress for the last memory', () => {
      render(<StoryModeOverlay {...defaultProps} currentIndex={4} totalMemories={5} />);
      expect(screen.getByText(/5.*5/i)).toBeInTheDocument();
    });

    it('uses the sans-serif font for the progress text', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      const progress = screen.getByTestId('story-progress');
      expect(progress.className).toContain('font-sans');
    });
  });

  describe('positioning and z-index', () => {
    it('is positioned above all other map overlays at z-[1001]', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      const overlay = screen.getByTestId('story-mode-overlay');
      expect(overlay.className).toContain('z-[1001]');
    });

    it('uses pointer-events-none on the container', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      const overlay = screen.getByTestId('story-mode-overlay');
      expect(overlay.className).toContain('pointer-events-none');
    });

    it('uses pointer-events-auto on the stop button', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      const button = screen.getByRole('button', { name: /stop/i });
      expect(button.className).toContain('pointer-events-auto');
    });
  });

  describe('accessibility', () => {
    it('stop button meets 44x44px minimum tap target', () => {
      render(<StoryModeOverlay {...defaultProps} />);
      const button = screen.getByRole('button', { name: /stop/i });
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });
  });

  describe('when not playing', () => {
    it('does not render overlay content when isPlaying is false', () => {
      render(<StoryModeOverlay {...defaultProps} isPlaying={false} />);
      expect(screen.queryByTestId('story-mode-overlay')).not.toBeInTheDocument();
    });

    it('does not render the stop button when not playing', () => {
      render(<StoryModeOverlay {...defaultProps} isPlaying={false} />);
      expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument();
    });

    it('does not render progress text when not playing', () => {
      render(<StoryModeOverlay {...defaultProps} isPlaying={false} />);
      expect(screen.queryByTestId('story-progress')).not.toBeInTheDocument();
    });
  });
});
