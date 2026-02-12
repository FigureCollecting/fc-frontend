import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { clearSessionCookies } from '../utils/crypto';
import { useThemeStore } from './themeStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  lastActivity: number;
  setUser: (user: User | null) => void;
  updateTokens: (token: string, refreshToken?: string, tokenExpiresAt?: number) => void;
  recordActivity: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
      setUser: (user) => {
        // Sync colorProfile to theme store if user has one
        if (user?.colorProfile) {
          useThemeStore.getState().setColorProfile(user.colorProfile);
        }
        set({ user, isAuthenticated: !!user, lastActivity: Date.now() });
      },
      updateTokens: (token, refreshToken, tokenExpiresAt) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              token,
              refreshToken: refreshToken || user.refreshToken,
              tokenExpiresAt: tokenExpiresAt || user.tokenExpiresAt,
            },
            lastActivity: Date.now(),
          });
        }
      },
      recordActivity: () => {
        set({ lastActivity: Date.now() });
      },
      logout: () => {
        // Get userId before clearing user state
        const { user } = get();
        const userId = user?._id;
        // Clear session cookies on logout (preserves persistent cookies)
        clearSessionCookies(userId);
        set({ user: null, isAuthenticated: false, lastActivity: 0 });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
