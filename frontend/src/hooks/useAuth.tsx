import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (token && userId && role) {
      setUser({
        token,
        userId,
        email: email || '',
        role: role as 'TRAINER' | 'CLIENT',
      });
    }
    setIsLoading(false);
  }, []);

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
    localStorage.clear();
    setUser(null);
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
