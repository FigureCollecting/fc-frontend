/**
 * Sync Store Unit Tests
 *
 * Tests all actions and state transitions for the sync store.
 */

import { renderHook, act } from '@testing-library/react';
import { useSyncStore, SseConnectionState } from '../syncStore';
import { SyncPhase, SyncJobStats } from '../../types';

describe('syncStore', () => {
  const mockStats: SyncJobStats = {
    total: 100,
    pending: 50,
    processing: 10,
    completed: 30,
    failed: 5,
    skipped: 5,
  };

  const emptyStats: SyncJobStats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  beforeEach(() => {
    // Reset store to initial state before each test
    useSyncStore.setState({
      sessionId: null,
      isActive: false,
      connectionState: 'disconnected',
      phase: null,
      stats: null,
      message: null,
      error: null,
      failedItems: [],
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSyncStore());

      expect(result.current.sessionId).toBeNull();
      expect(result.current.isActive).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.phase).toBeNull();
      expect(result.current.stats).toBeNull();
      expect(result.current.message).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.failedItems).toEqual([]);
    });
  });

  describe('startSync', () => {
    it('should set session state correctly', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.startSync('test-session-123');
      });

      expect(result.current.sessionId).toBe('test-session-123');
      expect(result.current.isActive).toBe(true);
      expect(result.current.connectionState).toBe('connecting');
      expect(result.current.phase).toBe('validating');
      expect(result.current.message).toBe('Starting sync...');
      expect(result.current.error).toBeNull();
      expect(result.current.failedItems).toEqual([]);
    });

    it('should initialize with default stats', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.startSync('new-session');
      });

      expect(result.current.stats).toEqual(emptyStats);
    });

    it('should reset failedItems when starting new sync', () => {
      const { result } = renderHook(() => useSyncStore());

      // Add some failed items first
      act(() => {
        result.current.addFailedItem('123', 'some error');
        result.current.addFailedItem('456', 'another error');
      });

      expect(result.current.failedItems.length).toBe(2);

      // Start new sync
      act(() => {
        result.current.startSync('fresh-session');
      });

      expect(result.current.failedItems).toEqual([]);
    });
  });

  describe('updateConnectionState', () => {
    const connectionStates: SseConnectionState[] = ['disconnected', 'connecting', 'connected', 'error'];

    connectionStates.forEach((state) => {
      it(`should update connection state to "${state}"`, () => {
        const { result } = renderHook(() => useSyncStore());

        act(() => {
          result.current.updateConnectionState(state);
        });

        expect(result.current.connectionState).toBe(state);
      });
    });

    it('should only update connectionState without affecting other state', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set up initial state
      act(() => {
        result.current.startSync('test-session');
      });

      const sessionIdBefore = result.current.sessionId;
      const isActiveBefore = result.current.isActive;

      act(() => {
        result.current.updateConnectionState('connected');
      });

      expect(result.current.sessionId).toBe(sessionIdBefore);
      expect(result.current.isActive).toBe(isActiveBefore);
      expect(result.current.connectionState).toBe('connected');
    });
  });

  describe('updateProgress', () => {
    it('should update phase and stats', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.updateProgress('enriching', mockStats);
      });

      expect(result.current.phase).toBe('enriching');
      expect(result.current.stats).toEqual(mockStats);
    });

    it('should update message when provided', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.updateProgress('parsing', mockStats, 'Processing 50 items...');
      });

      expect(result.current.phase).toBe('parsing');
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.message).toBe('Processing 50 items...');
    });

    it('should preserve existing message when no new message provided', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set initial message
      act(() => {
        result.current.updateProgress('validating', emptyStats, 'Initial message');
      });

      expect(result.current.message).toBe('Initial message');

      // Update without message
      act(() => {
        result.current.updateProgress('exporting', mockStats);
      });

      expect(result.current.message).toBe('Initial message');
    });

    it('should handle all sync phases', () => {
      const phases: SyncPhase[] = [
        'validating',
        'exporting',
        'parsing',
        'fetching_lists',
        'queueing',
        'enriching',
        'completed',
        'failed',
        'cancelled',
      ];

      const { result } = renderHook(() => useSyncStore());

      phases.forEach((phase) => {
        act(() => {
          result.current.updateProgress(phase, mockStats);
        });

        expect(result.current.phase).toBe(phase);
      });
    });
  });

  describe('addFailedItem', () => {
    it('should accumulate failed items', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.addFailedItem('12345', 'Network error');
      });

      expect(result.current.failedItems).toEqual([
        { mfcId: '12345', error: 'Network error' },
      ]);

      act(() => {
        result.current.addFailedItem('67890', 'Parse error');
      });

      expect(result.current.failedItems).toEqual([
        { mfcId: '12345', error: 'Network error' },
        { mfcId: '67890', error: 'Parse error' },
      ]);
    });

    it('should handle missing error message', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.addFailedItem('99999');
      });

      expect(result.current.failedItems).toEqual([
        { mfcId: '99999', error: undefined },
      ]);
    });

    it('should not modify existing failed items', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.addFailedItem('111', 'Error 1');
      });

      const firstItem = result.current.failedItems[0];

      act(() => {
        result.current.addFailedItem('222', 'Error 2');
      });

      expect(result.current.failedItems[0]).toEqual(firstItem);
    });
  });

  describe('setError', () => {
    it('should set error state', () => {
      const { result } = renderHook(() => useSyncStore());
      const testError = new Error('Connection failed');

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toBe(testError);
    });

    it('should clear error when null is passed', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set error first
      act(() => {
        result.current.setError(new Error('Some error'));
      });

      expect(result.current.error).not.toBeNull();

      // Clear error
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('completeSync', () => {
    it('should set isActive to false', () => {
      const { result } = renderHook(() => useSyncStore());

      // Start sync first
      act(() => {
        result.current.startSync('session-xyz');
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.completeSync('completed', mockStats);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should update phase and stats', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.completeSync('completed', mockStats);
      });

      expect(result.current.phase).toBe('completed');
      expect(result.current.stats).toEqual(mockStats);
    });

    it('should use provided message', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.completeSync('completed', mockStats, 'Sync finished successfully!');
      });

      expect(result.current.message).toBe('Sync finished successfully!');
    });

    it('should default to "Sync complete" message when not provided', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.completeSync('completed', mockStats);
      });

      expect(result.current.message).toBe('Sync complete');
    });

    it('should set connectionState to disconnected', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set connected state first
      act(() => {
        result.current.startSync('session');
        result.current.updateConnectionState('connected');
      });

      expect(result.current.connectionState).toBe('connected');

      act(() => {
        result.current.completeSync('completed', mockStats);
      });

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should work with failed phase', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.completeSync('failed', mockStats, 'Sync failed due to errors');
      });

      expect(result.current.phase).toBe('failed');
      expect(result.current.isActive).toBe(false);
      expect(result.current.message).toBe('Sync failed due to errors');
    });
  });

  describe('cancelSync', () => {
    it('should set cancelled state', () => {
      const { result } = renderHook(() => useSyncStore());

      // Start sync first
      act(() => {
        result.current.startSync('active-session');
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.cancelSync();
      });

      expect(result.current.phase).toBe('cancelled');
      expect(result.current.message).toBe('Sync cancelled');
      expect(result.current.isActive).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });

    it('should preserve session ID', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.startSync('my-session');
      });

      act(() => {
        result.current.cancelSync();
      });

      // Session ID should be preserved for potential cleanup
      expect(result.current.sessionId).toBe('my-session');
    });

    it('should preserve failed items', () => {
      const { result } = renderHook(() => useSyncStore());

      act(() => {
        result.current.startSync('session');
        result.current.addFailedItem('111', 'Error');
      });

      act(() => {
        result.current.cancelSync();
      });

      expect(result.current.failedItems).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useSyncStore());

      // Set up various state
      act(() => {
        result.current.startSync('full-session');
        result.current.updateConnectionState('connected');
        result.current.updateProgress('enriching', mockStats, 'Processing...');
        result.current.addFailedItem('123', 'Error');
        result.current.setError(new Error('Test error'));
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.sessionId).toBeNull();
      expect(result.current.isActive).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.phase).toBeNull();
      expect(result.current.stats).toBeNull();
      expect(result.current.message).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.failedItems).toEqual([]);
    });

    it('should work when called on already reset state', () => {
      const { result } = renderHook(() => useSyncStore());

      // Double reset should not throw
      act(() => {
        result.current.reset();
        result.current.reset();
      });

      expect(result.current.sessionId).toBeNull();
    });
  });

  describe('multiple store instances', () => {
    it('should share state across multiple hook calls', () => {
      const { result: result1 } = renderHook(() => useSyncStore());
      const { result: result2 } = renderHook(() => useSyncStore());

      act(() => {
        result1.current.startSync('shared-session');
      });

      expect(result1.current.sessionId).toBe('shared-session');
      expect(result2.current.sessionId).toBe('shared-session');
      expect(result1.current.isActive).toBe(true);
      expect(result2.current.isActive).toBe(true);
    });
  });
});
