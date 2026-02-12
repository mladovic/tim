import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders MapView placeholder when authenticated via localStorage', () => {
    localStorage.setItem('dtm-auth', 'authenticated');
    render(<App />);
    expect(screen.queryByText('What is the name of our team?')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-view-placeholder')).toBeInTheDocument();
  });

  it('transitions from AuthGate to MapView on correct phrase', async () => {
    render(<App />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'The Dream Team{enter}');
    expect(await screen.findByTestId('map-view-placeholder')).toBeInTheDocument();
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
    // If AuthProvider wasn't wrapping, useAuth() in AuthGate would throw
    // The fact that AuthGate renders without error proves the provider is present
    expect(screen.getByText('What is the name of our team?')).toBeInTheDocument();
  });
});
