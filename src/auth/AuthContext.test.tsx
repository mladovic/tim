import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('sets isAuthenticated to false when no token in localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets isAuthenticated to true when token exists in localStorage', () => {
      localStorage.setItem('dtm-auth', 'authenticated');
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('validatePhrase', () => {
    it('returns true and authenticates for exact match "Tea i Marin"', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        const success = result.current.validatePhrase('Tea i Marin');
        expect(success).toBe(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(localStorage.getItem('dtm-auth')).toBe('authenticated');
    });

    it('returns true for case variation "tea i marin"', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        const success = result.current.validatePhrase('tea i marin');
        expect(success).toBe(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns true for case variation "TEA I MARIN"', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        const success = result.current.validatePhrase('TEA I MARIN');
        expect(success).toBe(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns true for whitespace-padded input "  Tea i Marin  "', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        const success = result.current.validatePhrase('  Tea i Marin  ');
        expect(success).toBe(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('dtm-auth')).toBe('authenticated');
    });

    it('returns false and sets error for incorrect phrase', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        const success = result.current.validatePhrase('wrong answer');
        expect(success).toBe(false);
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(localStorage.getItem('dtm-auth')).toBeNull();
    });

    it('error message does not reveal the correct answer', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        result.current.validatePhrase('wrong answer');
      });
      const error = result.current.error!.toLowerCase();
      expect(error).not.toContain('dream team');
    });

    it('clears previous error on successful validation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        result.current.validatePhrase('wrong');
      });
      expect(result.current.error).not.toBeNull();
      act(() => {
        result.current.validatePhrase('Tea i Marin');
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears isAuthenticated and removes token from localStorage', () => {
      localStorage.setItem('dtm-auth', 'authenticated');
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAuthenticated).toBe(true);
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('dtm-auth')).toBeNull();
    });
  });

  describe('context API', () => {
    it('provides all required fields: isAuthenticated, error, validatePhrase, logout', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(typeof result.current.isAuthenticated).toBe('boolean');
      expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
      expect(typeof result.current.validatePhrase).toBe('function');
      expect(typeof result.current.logout).toBe('function');
    });
  });
});
