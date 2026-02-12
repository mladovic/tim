import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children, className }: Record<string, unknown>) => (
    <div data-testid="map-container" className={className as string}>
      {children as React.ReactNode}
    </div>
  )),
  TileLayer: vi.fn(() => <div data-testid="tile-layer" />),
  ZoomControl: vi.fn(() => <div data-testid="zoom-control" />),
}));

vi.mock('./hooks/useMemories', () => ({
  useMemories: vi.fn(() => ({ memories: [], loading: false, error: null })),
}));

import App from './App';

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders AuthGate when not authenticated', () => {
    render(<App />);
    expect(screen.getByText('What is the name of our team?')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders MapView when authenticated via localStorage', () => {
    localStorage.setItem('dtm-auth', 'authenticated');
    render(<App />);
    expect(screen.queryByText('What is the name of our team?')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('transitions from AuthGate to MapView on correct phrase', async () => {
    render(<App />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'The Dream Team{enter}');
    expect(await screen.findByTestId('map-container')).toBeInTheDocument();
  });

  it('stays on AuthGate when wrong phrase is entered', async () => {
    render(<App />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'wrong{enter}');
    expect(screen.getByText('What is the name of our team?')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('wraps the app in AuthProvider so context is available', () => {
    render(<App />);
    expect(screen.getByText('What is the name of our team?')).toBeInTheDocument();
  });
});
