import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi } from '../services/api/auth';
import { setUnauthorizedHandler } from '../services/api/client';
import { tokenStorage } from '../services/auth/tokenStorage';
import { lobbySocket } from '../services/realtime/lobbySocket';
import type {
  LoginDto,
  RegisterDto,
  User,
  VerifyOtpDto,
} from '../types/api';

export interface AuthState {
  user: User | null;
  loading: boolean; // initial hydrate
  signingIn: boolean;
}

export interface AuthContextValue extends AuthState {
  register: (dto: RegisterDto) => Promise<{ phone: string }>;
  verifyOtp: (dto: VerifyOtpDto) => Promise<User>;
  login: (dto: LoginDto) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const hydrate = useCallback(async () => {
    const token = await tokenStorage.getAccess();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      await tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const logout = useCallback(async (): Promise<void> => {
    await tokenStorage.clear();
    lobbySocket.disconnect();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const afterTokens = useCallback(
    async (accessToken: string, refreshToken?: string): Promise<User> => {
      await tokenStorage.save(accessToken, refreshToken);
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    [],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      setSigningIn(true);
      try {
        await authApi.register(dto);
        return { phone: dto.phone };
      } finally {
        setSigningIn(false);
      }
    },
    [],
  );

  const verifyOtp = useCallback(
    async (dto: VerifyOtpDto) => {
      setSigningIn(true);
      try {
        const tokens = await authApi.verifyOtp(dto);
        return afterTokens(tokens.accessToken, tokens.refreshToken);
      } finally {
        setSigningIn(false);
      }
    },
    [afterTokens],
  );

  const login = useCallback(
    async (dto: LoginDto) => {
      setSigningIn(true);
      try {
        const tokens = await authApi.login(dto);
        return afterTokens(tokens.accessToken, tokens.refreshToken);
      } finally {
        setSigningIn(false);
      }
    },
    [afterTokens],
  );

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signingIn,
      register,
      verifyOtp,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, signingIn, register, verifyOtp, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
