import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Memory } from '../types';

const { capturedMotionProps } = vi.hoisted(() => ({
  capturedMotionProps: { current: {} as Record<string, unknown> },
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
      capturedMotionProps.current = props;
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
      if (props.drag) {
        safeProps['data-drag'] = String(props.drag);
      }
      return (
        <div data-testid="motion-div" {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

import { MemoryCard } from './MemoryCard';

const sampleMemory: Memory = {
  id: 'paris',
  date: '2023-04-15',
  title: 'Our First Trip',
  description: 'The most magical week of our lives.',
  lat: 48.8566,
  lng: 2.3522,
  imageUrl: '/images/paris.jpg',
  zoomLevel: 14,
};

const memoryWithoutImage: Memory = {
  id: 'home',
  date: '2023-01-01',
  title: 'Movie Night',
  description: 'Our cozy evening in.',
  lat: 45.0,
  lng: 14.0,
  zoomLevel: 13,
};

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matches && query === '(min-width: 1024px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe('MemoryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false); // Default to mobile
  });

  describe('when closed', () => {
    it('does not render card content when isOpen is false', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByText('Our First Trip')).not.toBeInTheDocument();
    });

    it('does not render card content when memory is null', () => {
      render(<MemoryCard memory={null} isOpen={true} onClose={vi.fn()} />);
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });

  describe('when open with memory', () => {
    it('renders the memory title', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Our First Trip')).toBeInTheDocument();
    });

    it('renders the title in the script/handwritten font', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const title = screen.getByText('Our First Trip');
      expect(title.className).toContain('font-script');
    });

    it('renders the memory date', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });

    it('renders the memory description', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('The most magical week of our lives.')).toBeInTheDocument();
    });

    it('uses a cream/beige surface background', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const card = screen.getByRole('article');
      expect(card.className).toContain('bg-surface');
    });

    it('displays an X close button', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('invokes onClose when the X button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={onClose} />);
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('wraps the card with AnimatePresence', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });
  });

  describe('photo rendering', () => {
    it('renders the photo when memory has an imageUrl', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/images/paris.jpg');
    });

    it('sets loading="lazy" on the photo for deferred loading', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('does not render an image when memory has no imageUrl', () => {
      render(<MemoryCard memory={memoryWithoutImage} isOpen={true} onClose={vi.fn()} />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('click-outside dismissal', () => {
    it('renders a backdrop overlay when the card is open', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByTestId('memory-card-backdrop')).toBeInTheDocument();
    });

    it('invokes onClose when the backdrop is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={onClose} />);
      await user.click(screen.getByTestId('memory-card-backdrop'));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not render a backdrop when the card is closed', () => {
      render(<MemoryCard memory={sampleMemory} isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByTestId('memory-card-backdrop')).not.toBeInTheDocument();
    });
  });

  describe('responsive variants', () => {
    it('renders a desktop popup layout when viewport is above 1024px', () => {
      mockMatchMedia(true);
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const card = screen.getByRole('article');
      expect(card.className).toContain('popup');
      expect(card.className).not.toContain('bottom-sheet');
    });

    it('positions the desktop popup as an absolute overlay centered on the map', () => {
      mockMatchMedia(true);
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const card = screen.getByRole('article');
      expect(card.className).toContain('absolute');
      expect(card.className).toContain('top-1/2');
      expect(card.className).toContain('left-1/2');
    });

    it('renders a mobile bottom sheet layout when viewport is below 1024px', () => {
      mockMatchMedia(false);
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const card = screen.getByRole('article');
      expect(card.className).toContain('bottom-sheet');
      expect(card.className).not.toContain('popup');
    });
  });

  describe('swipe-to-dismiss', () => {
    it('enables vertical drag on the mobile bottom sheet', () => {
      mockMatchMedia(false);
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(capturedMotionProps.current.drag).toBe('y');
    });

    it('constrains drag to downward direction only', () => {
      mockMatchMedia(false);
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      const constraints = capturedMotionProps.current.dragConstraints as { top: number };
      expect(constraints.top).toBe(0);
    });

    it('does not enable drag on the desktop popup variant', () => {
      mockMatchMedia(true);
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={vi.fn()} />);
      expect(capturedMotionProps.current.drag).toBeFalsy();
    });

    it('calls onClose when swipe exceeds the dismissal threshold', () => {
      mockMatchMedia(false);
      const onClose = vi.fn();
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={onClose} />);
      const onDragEnd = capturedMotionProps.current.onDragEnd as (
        event: unknown,
        info: { offset: { y: number }; velocity: { y: number } },
      ) => void;
      expect(onDragEnd).toBeTypeOf('function');
      onDragEnd(null, { offset: { y: 150 }, velocity: { y: 0 } });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when swipe velocity exceeds the threshold', () => {
      mockMatchMedia(false);
      const onClose = vi.fn();
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={onClose} />);
      const onDragEnd = capturedMotionProps.current.onDragEnd as (
        event: unknown,
        info: { offset: { y: number }; velocity: { y: number } },
      ) => void;
      onDragEnd(null, { offset: { y: 50 }, velocity: { y: 600 } });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not call onClose when swipe is below the threshold', () => {
      mockMatchMedia(false);
      const onClose = vi.fn();
      render(<MemoryCard memory={sampleMemory} isOpen={true} onClose={onClose} />);
      const onDragEnd = capturedMotionProps.current.onDragEnd as (
        event: unknown,
        info: { offset: { y: number }; velocity: { y: number } },
      ) => void;
      onDragEnd(null, { offset: { y: 30 }, velocity: { y: 100 } });
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
