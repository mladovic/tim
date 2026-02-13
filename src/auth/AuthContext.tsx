import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'dtm-auth';
const AUTH_TOKEN_VALUE = 'authenticated';
const TARGET_PHRASE = 'tea i marin';

interface AuthState {
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  validatePhrase: (input: string) => boolean;
  logout: () => void;
}

interface AuthContextValue extends AuthState, AuthActions {}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === AUTH_TOKEN_VALUE;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => readToken());
  const [error, setError] = useState<string | null>(null);

  const validatePhrase = useCallback((input: string): boolean => {
    const normalized = input.trim().toLowerCase();
    if (normalized === TARGET_PHRASE) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, AUTH_TOKEN_VALUE);
      } catch {
        // localStorage unavailable — session-only auth
      }
      setIsAuthenticated(true);
      setError(null);
      return true;
    }
    setError("That's not quite right. Try again!");
    return false;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, error, validatePhrase, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
