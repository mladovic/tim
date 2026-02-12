import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { animate?: Record<string, unknown> } & Record<string, unknown>) => {
      const safeProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeProps[key] = value;
        }
      }
      if (animate && typeof animate === 'object' && 'opacity' in animate) {
        safeProps['data-opacity'] = String(animate.opacity);
      }
      return (
        <div data-testid="motion-div" {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

import { LogoOverlay } from './LogoOverlay';

describe('LogoOverlay', () => {
  it('renders "The Dream Team" text', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    expect(screen.getByText(/The Dream/)).toBeInTheDocument();
  });

  it('renders the logo in the serif/display font', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    const logo = screen.getByTestId('logo-text');
    expect(logo.className).toContain('font-display');
  });

  it('highlights "Tea" within "Team" in Rose Pink', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    const teaSpan = screen.getByText('Tea');
    expect(teaSpan.className).toContain('text-primary');
  });

  it('renders "feat. Marin" in the script font', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    const subtitle = screen.getByText('feat. Marin');
    expect(subtitle.className).toContain('font-script');
  });

  it('renders "feat. Marin" at a smaller size', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    const subtitle = screen.getByText('feat. Marin');
    expect(subtitle.className).toContain('text-sm');
  });

  it('is absolutely positioned in the top-left area', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    const overlay = screen.getByTestId('logo-overlay');
    expect(overlay.className).toContain('absolute');
    expect(overlay.className).toContain('top-');
    expect(overlay.className).toContain('left-');
  });

  it('fades out when Story Mode is playing', () => {
    render(<LogoOverlay isStoryPlaying={true} />);
    const overlay = screen.getByTestId('logo-overlay');
    expect(overlay.dataset.opacity).toBe('0');
  });

  it('is fully visible when Story Mode is not playing', () => {
    render(<LogoOverlay isStoryPlaying={false} />);
    const overlay = screen.getByTestId('logo-overlay');
    expect(overlay.dataset.opacity).toBe('1');
  });

  it('applies pointer-events-none when faded during Story Mode', () => {
    render(<LogoOverlay isStoryPlaying={true} />);
    const overlay = screen.getByTestId('logo-overlay');
    expect(overlay.className).toContain('pointer-events-none');
  });
});
