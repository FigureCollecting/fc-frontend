/**
 * Enhanced AuthStore Tests - covers updateTokens and recordActivity
 */
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import { User } from '../../types';

describe('authStore - enhanced coverage', () => {
  const mockUser: User = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    token: 'initial-token',
    refreshToken: 'initial-refresh',
    tokenExpiresAt: 1700000000000,
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastActivity: 0,
    });
  });

  describe('updateTokens', () => {
    it('should update token when user exists', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      act(() => {
        result.current.updateTokens('new-token', 'new-refresh', 1800000000000);
      });

      expect(result.current.user?.token).toBe('new-token');
      expect(result.current.user?.refreshToken).toBe('new-refresh');
      expect(result.current.user?.tokenExpiresAt).toBe(1800000000000);
    });

    it('should keep existing refreshToken when not provided', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      act(() => {
        result.current.updateTokens('new-token');
      });

      expect(result.current.user?.token).toBe('new-token');
      expect(result.current.user?.refreshToken).toBe('initial-refresh');
    });

    it('should keep existing tokenExpiresAt when not provided', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      act(() => {
        result.current.updateTokens('new-token', undefined, undefined);
      });

      expect(result.current.user?.tokenExpiresAt).toBe(1700000000000);
    });

    it('should update lastActivity on token update', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      const beforeUpdate = Date.now();

      act(() => {
        result.current.updateTokens('new-token');
      });

      expect(result.current.lastActivity).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should do nothing when no user is set', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateTokens('new-token', 'new-refresh', 9999);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('recordActivity', () => {
    it('should update lastActivity timestamp', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial state with lastActivity = 0
      act(() => {
        useAuthStore.setState({ lastActivity: 0 });
      });

      const beforeRecord = Date.now();

      act(() => {
        result.current.recordActivity();
      });

      expect(result.current.lastActivity).toBeGreaterThanOrEqual(beforeRecord);
    });

    it('should update lastActivity on each call', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.recordActivity();
      });

      const firstActivity = result.current.lastActivity;

      // Small delay
      act(() => {
        result.current.recordActivity();
      });

      expect(result.current.lastActivity).toBeGreaterThanOrEqual(firstActivity);
    });
  });

  describe('setUser with lastActivity', () => {
    it('should update lastActivity when setting user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ lastActivity: 0 });
      });

      const beforeSet = Date.now();

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.lastActivity).toBeGreaterThanOrEqual(beforeSet);
    });
  });

  describe('logout clears lastActivity', () => {
    it('should set lastActivity to 0 on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.lastActivity).toBeGreaterThan(0);

      act(() => {
        result.current.logout();
      });

      expect(result.current.lastActivity).toBe(0);
    });
  });
});
