import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      animate,
      onClick,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { animate?: Record<string, unknown> } & Record<string, unknown>) => {
      const safeProps: Record<string, string | number | boolean | undefined> = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeProps[key] = value;
        }
      }
      if (animate && typeof animate === 'object' && 'opacity' in animate) {
        safeProps['data-opacity'] = String(animate.opacity);
      }
      return (
        <button data-testid="motion-button" onClick={onClick} {...safeProps}>
          {children}
        </button>
      );
    },
  },
}));

import { PlayStoryButton } from './PlayStoryButton';

describe('PlayStoryButton', () => {
  it('renders the "Play Our Story" text', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={false} />);
    expect(screen.getByText(/Play Our Story/)).toBeInTheDocument();
  });

  it('renders a play icon', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={false} />);
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('uses rose pink background color', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={false} />);
    const button = screen.getByTestId('motion-button');
    expect(button.className).toContain('bg-primary');
  });

  it('is pill-shaped with rounded-full', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={false} />);
    const button = screen.getByTestId('motion-button');
    expect(button.className).toContain('rounded-full');
  });

  it('has a minimum tap target of 44x44 pixels', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={false} />);
    const button = screen.getByTestId('motion-button');
    expect(button.className).toContain('min-h-[44px]');
    expect(button.className).toContain('min-w-[44px]');
  });

  it('invokes onStart when clicked', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<PlayStoryButton onStart={onStart} isStoryPlaying={false} />);
    await user.click(screen.getByTestId('motion-button'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('is disabled when Story Mode is playing', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={true} />);
    const button = screen.getByTestId('motion-button');
    expect(button).toBeDisabled();
  });

  it('fades out when Story Mode is playing', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={true} />);
    const button = screen.getByTestId('motion-button');
    expect(button.dataset.opacity).toBe('0');
  });

  it('is fully visible when Story Mode is not playing', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={false} />);
    const button = screen.getByTestId('motion-button');
    expect(button.dataset.opacity).toBe('1');
  });

  it('applies pointer-events-none when faded during Story Mode', () => {
    render(<PlayStoryButton onStart={vi.fn()} isStoryPlaying={true} />);
    const button = screen.getByTestId('motion-button');
    expect(button.className).toContain('pointer-events-none');
  });

  it('does not call onStart when disabled and clicked', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<PlayStoryButton onStart={onStart} isStoryPlaying={true} />);
    await user.click(screen.getByTestId('motion-button'));
    expect(onStart).not.toHaveBeenCalled();
  });
});
