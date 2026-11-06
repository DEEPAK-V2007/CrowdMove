import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  quickLoginAs: (role: 'admin' | 'driver' | 'passenger') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.me(token)
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const quickLoginAs = async (role: 'admin' | 'driver' | 'passenger') => {
    const creds = {
      admin: { email: 'admin@crowdmove.in', password: 'test123' },
      driver: { email: 'rajesh@crowdmove.in', password: 'test123' },
      passenger: { email: 'priya@gmail.com', password: 'test123' },
    }[role];
    if (creds) {
      await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, quickLoginAs, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
