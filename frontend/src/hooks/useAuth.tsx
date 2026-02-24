import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';

interface AuthUser {
  userId: string;
  email: string;
  role: 'TRAINER' | 'CLIENT';
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userId: string, email: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (token && userId && role) {
      // Set user immediately from localStorage (instant)
      setUser({
        token,
        userId,
        email: email || '',
        role: role as 'TRAINER' | 'CLIENT',
      });
      // Validate token in background — clear if expired
      api.get('/profiles/me', token).catch((err: any) => {
        if (err?.status === 401) {
          clearAuth();
        }
        // Other errors (network) are fine — token might still be valid
      });
    }
    setIsLoading(false);
  }, [clearAuth]);

  const login = (token: string, userId: string, email: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('email', email);
    localStorage.setItem('role', role);
    setUser({
      token,
      userId,
      email,
      role: role as 'TRAINER' | 'CLIENT',
    });
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
