/**
 * Tests for useSessionValidator hook
 */
import { renderHook, act } from '@testing-library/react';

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock API
jest.mock('../../api', () => ({
  getUserProfile: jest.fn(),
}));

// Mock the navigation boundary (jsdom >= 21 makes window.location unforgeable)
jest.mock('../../utils/navigation', () => ({
  redirectTo: jest.fn(),
  reloadPage: jest.fn(),
}));

import { useAuthStore } from '../../stores/authStore';
import { getUserProfile } from '../../api';
import { useSessionValidator } from '../useSessionValidator';
import { redirectTo } from '../../utils/navigation';

const mockedGetUserProfile = jest.mocked(getUserProfile);
const mockedRedirectTo = jest.mocked(redirectTo);

const authedUser = {
  _id: '1', username: 'test', email: 'test@test.com', isAdmin: false,
  token: 'tok', refreshToken: 'ref', tokenExpiresAt: Date.now() + 60000,
};

const flush = () => act(async () => {});

describe('useSessionValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not validate when not authenticated', async () => {
    const { unmount } = renderHook(() => useSessionValidator());
    await flush();

    expect(mockedGetUserProfile).not.toHaveBeenCalled();
    unmount();
  });

  it('validates on mount and keeps the session when the profile call succeeds', async () => {
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });
    mockedGetUserProfile.mockResolvedValue({} as any);

    const { unmount } = renderHook(() => useSessionValidator());
    await flush();

    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockedRedirectTo).not.toHaveBeenCalled();
    unmount();
  });

  it('logs out, clears persisted auth, and redirects to /login on 401', async () => {
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });
    localStorage.setItem('auth-storage', JSON.stringify({ state: { isAuthenticated: true } }));
    mockedGetUserProfile.mockRejectedValue({ response: { status: 401 } });

    const { unmount } = renderHook(() => useSessionValidator());
    await flush();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    // The setupTests localStorage shim returns undefined (not null) for absent keys
    expect(localStorage.getItem('auth-storage')).toBeFalsy();
    expect(mockedRedirectTo).toHaveBeenCalledWith('/login');
    unmount();
  });

  it('does not log out on network error (no response)', async () => {
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });
    mockedGetUserProfile.mockRejectedValue(new Error('network down'));

    const { unmount } = renderHook(() => useSessionValidator());
    await flush();

    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockedRedirectTo).not.toHaveBeenCalled();
    unmount();
  });

  it('does not log out on non-401 server error', async () => {
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });
    mockedGetUserProfile.mockRejectedValue({ response: { status: 500 } });

    const { unmount } = renderHook(() => useSessionValidator());
    await flush();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockedRedirectTo).not.toHaveBeenCalled();
    unmount();
  });

  it('debounces focus revalidation within 30s, revalidates after', async () => {
    jest.useFakeTimers();
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });
    mockedGetUserProfile.mockResolvedValue({} as any);

    const { unmount } = renderHook(() => useSessionValidator());
    await flush();
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);

    // Within the debounce window: focus is a no-op
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await flush();
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);

    // Past the debounce window: focus revalidates
    jest.setSystemTime(Date.now() + 31000);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await flush();
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('revalidates on visibilitychange when the tab is visible', async () => {
    jest.useFakeTimers();
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });
    mockedGetUserProfile.mockResolvedValue({} as any);

    const { unmount } = renderHook(() => useSessionValidator());
    await flush();
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);

    jest.setSystemTime(Date.now() + 31000);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush();
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('skips overlapping validations while one is in flight', async () => {
    jest.useFakeTimers();
    useAuthStore.setState({ user: authedUser, isAuthenticated: true });

    let resolveProfile: (value: any) => void;
    mockedGetUserProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }) as any
    );

    const { unmount } = renderHook(() => useSessionValidator());
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);

    // Past the debounce window but still in flight: skipped
    jest.setSystemTime(Date.now() + 31000);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);

    resolveProfile!({});
    await flush();
    unmount();
  });
});
