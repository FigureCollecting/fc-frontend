/**
 * Tests for useTokenRefresh hook
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
  refreshAccessToken: jest.fn(),
}));

import { useAuthStore } from '../../stores/authStore';
import { refreshAccessToken } from '../../api';
import { useTokenRefresh, recordUserActivity } from '../useTokenRefresh';

const mockedRefreshAccessToken = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;

describe('useTokenRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset auth store
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
    });

    // Mock window event listeners
    jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should return recordActivity and attemptRefresh functions', () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok', refreshToken: 'ref', tokenExpiresAt: Date.now() + 60000 },
      isAuthenticated: true,
      lastActivity: Date.now(),
    });

    const { result } = renderHook(() => useTokenRefresh());

    expect(typeof result.current.recordActivity).toBe('function');
    expect(typeof result.current.attemptRefresh).toBe('function');
  });

  it('should not refresh when not authenticated', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastActivity: Date.now(),
    });

    renderHook(() => useTokenRefresh());

    jest.advanceTimersByTime(31000);
    expect(mockedRefreshAccessToken).not.toHaveBeenCalled();
  });

  it('should attempt refresh when token is about to expire and user is active', async () => {
    const now = Date.now();
    useAuthStore.setState({
      user: {
        _id: '1', username: 'test', email: 'test@test.com', isAdmin: false,
        token: 'old-token',
        refreshToken: 'refresh-token',
        tokenExpiresAt: now + 60000, // Expires in 60 seconds (within 2 minute threshold)
      },
      isAuthenticated: true,
      lastActivity: now,
    });

    mockedRefreshAccessToken.mockResolvedValue({
      token: 'new-token',
      refreshToken: 'new-refresh',
      tokenExpiresAt: now + 900000,
    });

    const { result } = renderHook(() => useTokenRefresh());

    // The hook should check on mount
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    // Token is within threshold, should have attempted refresh
    expect(mockedRefreshAccessToken).toHaveBeenCalledWith('refresh-token');
  });

  it('attemptRefresh should return false when no refresh token', async () => {
    useAuthStore.setState({
      user: {
        _id: '1', username: 'test', email: 'test@test.com', isAdmin: false,
        token: 'old-token',
        // No refreshToken
      },
      isAuthenticated: true,
      lastActivity: Date.now(),
    });

    const { result } = renderHook(() => useTokenRefresh());

    let refreshResult: boolean | undefined;
    await act(async () => {
      refreshResult = await result.current.attemptRefresh();
    });

    expect(refreshResult).toBe(false);
    expect(mockedRefreshAccessToken).not.toHaveBeenCalled();
  });

  it('attemptRefresh should handle 401 error by logging out', async () => {
    const now = Date.now();
    useAuthStore.setState({
      user: {
        _id: '1', username: 'test', email: 'test@test.com', isAdmin: false,
        token: 'old-token',
        refreshToken: 'bad-refresh',
        tokenExpiresAt: now + 60000,
      },
      isAuthenticated: true,
      lastActivity: now,
    });

    const error = { response: { status: 401 }, message: 'Unauthorized' };
    mockedRefreshAccessToken.mockRejectedValue(error);

    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    const { result } = renderHook(() => useTokenRefresh());

    await act(async () => {
      await result.current.attemptRefresh();
    });

    expect(window.location.href).toBe('/login');

    // Restore
    window.location = originalLocation;
  });

  it('attemptRefresh should handle 403 error by logging out', async () => {
    const now = Date.now();
    useAuthStore.setState({
      user: {
        _id: '1', username: 'test', email: 'test@test.com', isAdmin: false,
        token: 'old-token',
        refreshToken: 'bad-refresh',
        tokenExpiresAt: now + 60000,
      },
      isAuthenticated: true,
      lastActivity: now,
    });

    const error = { response: { status: 403 }, message: 'Forbidden' };
    mockedRefreshAccessToken.mockRejectedValue(error);

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    const { result } = renderHook(() => useTokenRefresh());

    await act(async () => {
      await result.current.attemptRefresh();
    });

    expect(window.location.href).toBe('/login');
    window.location = originalLocation;
  });

  it('attemptRefresh should prevent concurrent refresh attempts', async () => {
    const now = Date.now();
    useAuthStore.setState({
      user: {
        _id: '1', username: 'test', email: 'test@test.com', isAdmin: false,
        token: 'old-token',
        refreshToken: 'refresh',
        tokenExpiresAt: now + 60000,
      },
      isAuthenticated: true,
      lastActivity: now,
    });

    let resolveRefresh: (value: any) => void;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });
    mockedRefreshAccessToken.mockReturnValue(refreshPromise as any);

    const { result } = renderHook(() => useTokenRefresh());

    // Start first refresh
    act(() => {
      result.current.attemptRefresh();
    });

    // Second attempt should skip (isRefreshing)
    let secondResult: boolean | undefined;
    await act(async () => {
      secondResult = await result.current.attemptRefresh();
    });

    expect(secondResult).toBe(false);
    expect(mockedRefreshAccessToken).toHaveBeenCalledTimes(1);

    // Resolve to clean up
    resolveRefresh!({ token: 'new', refreshToken: 'new-ref', tokenExpiresAt: now + 900000 });
  });
});

describe('recordUserActivity', () => {
  it('should call recordActivity on authStore', () => {
    const recordMock = jest.fn();
    useAuthStore.setState({ lastActivity: 0 });
    // Override getState temporarily
    const originalGetState = useAuthStore.getState;
    (useAuthStore as any).getState = () => ({
      ...originalGetState(),
      recordActivity: recordMock,
    });

    recordUserActivity();

    expect(recordMock).toHaveBeenCalled();
    (useAuthStore as any).getState = originalGetState;
  });
});
