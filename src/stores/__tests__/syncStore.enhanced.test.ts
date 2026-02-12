/**
 * Enhanced Sync Store Tests - covers orphaned session and isPaused actions
 */
import { renderHook, act } from '@testing-library/react';
import { useSyncStore } from '../syncStore';

describe('syncStore - enhanced coverage', () => {
  beforeEach(() => {
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

  describe('setOrphanedSession', () => {
    it('should set orphaned session data', () => {
      const { result } = renderHook(() => useSyncStore());
      const jobData = {
        sessionId: 'orphan-123',
        phase: 'enriching',
        message: 'Processing...',
        stats: { total: 10, pending: 5, processing: 1, completed: 3, failed: 1, skipped: 0 },
        startedAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.setOrphanedSession(jobData);
      });

      expect(result.current.hasOrphanedSession).toBe(true);
      expect(result.current.orphanedSessionData).toEqual(jobData);
    });

    it('should clear orphaned session when null passed', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set first
      act(() => {
        result.current.setOrphanedSession({
          sessionId: 'test',
          phase: 'enriching',
          message: '',
          stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0 },
          startedAt: '',
        });
      });

      expect(result.current.hasOrphanedSession).toBe(true);

      // Clear
      act(() => {
        result.current.setOrphanedSession(null);
      });

      expect(result.current.hasOrphanedSession).toBe(false);
      expect(result.current.orphanedSessionData).toBeNull();
    });
  });

  describe('recoverSession', () => {
    it('should recover an orphaned session', () => {
      const { result } = renderHook(() => useSyncStore());

      const jobData = {
        sessionId: 'recover-123',
        phase: 'enriching',
        message: 'Resuming...',
        stats: { total: 20, pending: 5, processing: 2, completed: 10, failed: 3, skipped: 0 },
        startedAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.recoverSession(jobData);
      });

      expect(result.current.sessionId).toBe('recover-123');
      expect(result.current.isActive).toBe(true);
      expect(result.current.hasOrphanedSession).toBe(false);
      expect(result.current.orphanedSessionData).toBeNull();
      expect(result.current.connectionState).toBe('connecting');
      expect(result.current.phase).toBe('enriching');
      expect(result.current.stats).toEqual(jobData.stats);
      expect(result.current.message).toBe('Resuming...');
      expect(result.current.error).toBeNull();
      expect(result.current.isPaused).toBe(false);
      expect(result.current.failedItems).toEqual([]);
    });

    it('should use "Reconnecting..." as default message', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.recoverSession({
          sessionId: 'test',
          phase: 'enriching',
          message: '',
          stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0 },
          startedAt: '',
        });
      });

      expect(result.current.message).toBe('Reconnecting...');
    });
  });

  describe('dismissOrphanedSession', () => {
    it('should dismiss orphaned session without recovering', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set orphaned session first
      act(() => {
        result.current.setOrphanedSession({
          sessionId: 'orphan',
          phase: 'enriching',
          message: '',
          stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0 },
          startedAt: '',
        });
      });

      expect(result.current.hasOrphanedSession).toBe(true);

      act(() => {
        result.current.dismissOrphanedSession();
      });

      expect(result.current.hasOrphanedSession).toBe(false);
      expect(result.current.orphanedSessionData).toBeNull();
      // Should NOT start active session
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('setIsPaused', () => {
    it('should set isPaused to true', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.setIsPaused(true);
      });

      expect(result.current.isPaused).toBe(true);
    });

    it('should set isPaused to false', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.setIsPaused(true);
      });

      act(() => {
        result.current.setIsPaused(false);
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('startSync clears orphaned session', () => {
    it('should clear orphaned session on new sync', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set orphaned first
      act(() => {
        result.current.setOrphanedSession({
          sessionId: 'old',
          phase: 'enriching',
          message: '',
          stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0 },
          startedAt: '',
        });
      });

      expect(result.current.hasOrphanedSession).toBe(true);

      act(() => {
        result.current.startSync('new-session');
      });

      expect(result.current.hasOrphanedSession).toBe(false);
      expect(result.current.orphanedSessionData).toBeNull();
    });
  });

  describe('completeSync preserves existing stats when undefined', () => {
    it('should preserve existing stats when stats are undefined/null-ish', () => {
      const { result } = renderHook(() => useSyncStore());

      const existingStats = { total: 10, pending: 0, processing: 0, completed: 8, failed: 2, skipped: 0 };

      act(() => {
        result.current.startSync('test');
        result.current.updateProgress('enriching', existingStats, 'Processing...');
      });

      expect(result.current.stats).toEqual(existingStats);

      // Complete with stats provided - should use the new stats
      const finalStats = { total: 10, pending: 0, processing: 0, completed: 10, failed: 0, skipped: 0 };
      act(() => {
        result.current.completeSync('completed', finalStats);
      });

      expect(result.current.stats).toEqual(finalStats);
    });
  });

  describe('reset clears orphaned session state', () => {
    it('should clear all state including orphaned session', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.setOrphanedSession({
          sessionId: 'orphan',
          phase: 'enriching',
          message: '',
          stats: { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, skipped: 0 },
          startedAt: '',
        });
        result.current.setIsPaused(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.hasOrphanedSession).toBe(false);
      expect(result.current.orphanedSessionData).toBeNull();
      expect(result.current.isPaused).toBe(false);
    });
  });
});
