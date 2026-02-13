/**
 * Tests for useSessionRecovery hook
 */
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock scraper API
jest.mock('../../api/scraper', () => ({
  getActiveJob: jest.fn(),
}));

import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { getActiveJob } from '../../api/scraper';
import { useSessionRecovery } from '../useSessionRecovery';

const mockedGetActiveJob = getActiveJob as jest.MockedFunction<typeof getActiveJob>;

describe('useSessionRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stores
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      lastActivity: 0,
    });

    useSyncStore.setState({
      sessionId: null,
      isActive: false,
      hasOrphanedSession: false,
      orphanedSessionData: null,
      connectionState: 'disconnected',
      phase: null,
      stats: null,
      message: null,
      error: null,
      isPaused: false,
      failedItems: [],
    });
  });

  it('should not check when user is not logged in', () => {
    const { result } = renderHook(() => useSessionRecovery());

    expect(result.current.hasOrphanedSession).toBe(false);
    expect(mockedGetActiveJob).not.toHaveBeenCalled();
  });

  it('should not check when sync is already active', () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
      isAuthenticated: true,
    });
    useSyncStore.setState({ isActive: true });

    const { result } = renderHook(() => useSessionRecovery());

    expect(mockedGetActiveJob).not.toHaveBeenCalled();
  });

  it('should not check when sessionId already exists', () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
      isAuthenticated: true,
    });
    useSyncStore.setState({ sessionId: 'existing-session' });

    renderHook(() => useSessionRecovery());

    expect(mockedGetActiveJob).not.toHaveBeenCalled();
  });

  it('should detect orphaned session and set state', async () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
      isAuthenticated: true,
    });

    const activeJob = {
      sessionId: 'orphan-1',
      phase: 'enriching',
      message: 'Processing items...',
      stats: { total: 10, pending: 5, processing: 1, completed: 3, failed: 1, skipped: 0 },
      startedAt: '2024-01-01',
    };
    mockedGetActiveJob.mockResolvedValue(activeJob);

    const { result } = renderHook(() => useSessionRecovery());

    await waitFor(() => {
      expect(mockedGetActiveJob).toHaveBeenCalled();
    });

    // Wait for state update
    await waitFor(() => {
      const syncState = useSyncStore.getState();
      expect(syncState.hasOrphanedSession).toBe(true);
      expect(syncState.orphanedSessionData).toEqual(activeJob);
    });
  });

  it('should set orphanedSession to null when no active job found', async () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
      isAuthenticated: true,
    });

    mockedGetActiveJob.mockResolvedValue(null);

    renderHook(() => useSessionRecovery());

    await waitFor(() => {
      expect(mockedGetActiveJob).toHaveBeenCalled();
    });

    await waitFor(() => {
      const syncState = useSyncStore.getState();
      expect(syncState.hasOrphanedSession).toBe(false);
    });
  });

  it('should handle API errors gracefully', async () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
      isAuthenticated: true,
    });

    mockedGetActiveJob.mockRejectedValue(new Error('Network error'));

    renderHook(() => useSessionRecovery());

    await waitFor(() => {
      expect(mockedGetActiveJob).toHaveBeenCalled();
    });

    // Should not crash and should not set orphaned session
    const syncState = useSyncStore.getState();
    expect(syncState.hasOrphanedSession).toBe(false);
  });

  it('should only check once per mount', async () => {
    useAuthStore.setState({
      user: { _id: '1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
      isAuthenticated: true,
    });

    mockedGetActiveJob.mockResolvedValue(null);

    const { rerender } = renderHook(() => useSessionRecovery());

    await waitFor(() => {
      expect(mockedGetActiveJob).toHaveBeenCalledTimes(1);
    });

    // Rerender should not trigger another check
    rerender();
    expect(mockedGetActiveJob).toHaveBeenCalledTimes(1);
  });

  it('should return hasOrphanedSession and orphanedSessionData', () => {
    const { result } = renderHook(() => useSessionRecovery());

    expect(result.current).toHaveProperty('hasOrphanedSession');
    expect(result.current).toHaveProperty('orphanedSessionData');
  });
});
