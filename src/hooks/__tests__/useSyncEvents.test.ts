/**
 * useSyncEvents Hook Tests
 *
 * Tests SSE connection management, event handling, and reconnection logic.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSyncEvents } from '../useSyncEvents';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import * as tokenRefresh from '../useTokenRefresh';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    verbose: jest.fn(),
  }),
}));

// Mock recordUserActivity
jest.mock('../useTokenRefresh', () => ({
  recordUserActivity: jest.fn(),
}));

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, (e: MessageEvent) => void> = {};
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, callback: (e: MessageEvent) => void) {
    this.listeners[event] = callback;
  }

  close() {
    const index = MockEventSource.instances.indexOf(this);
    if (index > -1) {
      MockEventSource.instances.splice(index, 1);
    }
  }

  // Test helpers
  triggerEvent(event: string, data: object) {
    if (this.listeners[event]) {
      this.listeners[event]({
        data: JSON.stringify(data),
      } as MessageEvent);
    }
  }

  triggerError() {
    if (this.onerror) {
      this.onerror();
    }
  }

  static reset() {
    MockEventSource.instances = [];
  }
}

// Assign to global
(global as any).EventSource = MockEventSource;

describe('useSyncEvents', () => {
  const mockUser = {
    _id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    token: 'mock-jwt-token',
  };

  const mockStats = {
    total: 100,
    pending: 50,
    processing: 10,
    completed: 30,
    failed: 5,
    skipped: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    MockEventSource.reset();

    // Reset stores
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

    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('connection conditions', () => {
    it('should not connect when sessionId is null', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: null, isActive: true });

      renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(0);
    });

    it('should not connect when user.token is null', () => {
      useAuthStore.setState({ user: { ...mockUser, token: undefined }, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(0);
    });

    it('should not connect when isActive is false', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: false });

      renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(0);
    });

    it('should connect when sessionId, user.token, and isActive are all present', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(1);
      expect(MockEventSource.instances[0].url).toContain('/api/sync/stream/test-session');
      expect(MockEventSource.instances[0].url).toContain('token=mock-jwt-token');
    });
  });

  describe('connection state updates', () => {
    it('should set connectionState to "connecting" on connect', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      expect(useSyncStore.getState().connectionState).toBe('connecting');
    });
  });

  describe('SSE event handling', () => {
    it('should handle "connected" event', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.triggerEvent('connected', {
          sessionId: 'test-session',
          phase: 'validating',
          stats: mockStats,
          message: 'Connected to sync stream',
        });
      });

      await waitFor(() => {
        const state = useSyncStore.getState();
        expect(state.connectionState).toBe('connected');
        expect(state.phase).toBe('validating');
        expect(state.stats).toEqual(mockStats);
      });

      expect(tokenRefresh.recordUserActivity).toHaveBeenCalled();
    });

    it('should handle "item-update" event', async () => {
      const onItemUpdate = jest.fn();

      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true, connectionState: 'connected' });

      renderHook(() => useSyncEvents({ onItemUpdate }));

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.triggerEvent('item-update', {
          mfcId: '12345',
          status: 'completed',
          stats: { ...mockStats, completed: 31 },
          phase: 'enriching',
        });
      });

      await waitFor(() => {
        expect(onItemUpdate).toHaveBeenCalledWith(expect.objectContaining({
          mfcId: '12345',
          status: 'completed',
        }));
      });

      expect(tokenRefresh.recordUserActivity).toHaveBeenCalled();
    });

    it('should track failed items from item-update events', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true, connectionState: 'connected' });

      renderHook(() => useSyncEvents());

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.triggerEvent('item-update', {
          mfcId: '67890',
          status: 'failed',
          error: 'Network timeout',
          stats: mockStats,
          phase: 'enriching',
        });
      });

      await waitFor(() => {
        const state = useSyncStore.getState();
        expect(state.failedItems).toContainEqual({
          mfcId: '67890',
          error: 'Network timeout',
        });
      });
    });

    it('should handle "phase-change" event', async () => {
      const onPhaseChange = jest.fn();

      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true, connectionState: 'connected' });

      renderHook(() => useSyncEvents({ onPhaseChange }));

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.triggerEvent('phase-change', {
          phase: 'enriching',
          message: 'Starting enrichment phase',
          stats: mockStats,
        });
      });

      await waitFor(() => {
        expect(onPhaseChange).toHaveBeenCalledWith(expect.objectContaining({
          phase: 'enriching',
          message: 'Starting enrichment phase',
        }));

        const state = useSyncStore.getState();
        expect(state.phase).toBe('enriching');
        expect(state.message).toBe('Starting enrichment phase');
      });

      expect(tokenRefresh.recordUserActivity).toHaveBeenCalled();
    });

    it('should handle "sync-complete" event', async () => {
      const onComplete = jest.fn();

      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true, connectionState: 'connected' });

      renderHook(() => useSyncEvents({ onComplete }));

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.triggerEvent('sync-complete', {
          phase: 'completed',
          stats: { ...mockStats, completed: 100 },
          message: 'Sync finished successfully',
        });
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
          phase: 'completed',
        }));

        const state = useSyncStore.getState();
        expect(state.phase).toBe('completed');
        expect(state.isActive).toBe(false);
        expect(state.connectionState).toBe('disconnected');
      });

      expect(tokenRefresh.recordUserActivity).toHaveBeenCalled();

      // EventSource should be closed
      expect(MockEventSource.instances).toHaveLength(0);
    });
  });

  describe('cleanup on unmount', () => {
    it('should close EventSource on unmount', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      const { unmount } = renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(1);

      unmount();

      expect(MockEventSource.instances).toHaveLength(0);
    });

    it('should cleanup when isActive becomes false', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(1);

      act(() => {
        useSyncStore.setState({ isActive: false });
      });

      expect(MockEventSource.instances).toHaveLength(0);
    });
  });

  describe('reconnection with exponential backoff', () => {
    it('should set connectionState to "error" on SSE error', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.triggerError();
      });

      expect(useSyncStore.getState().connectionState).toBe('error');
    });

    it('should attempt reconnection after error with exponential backoff', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      // First connection
      expect(MockEventSource.instances).toHaveLength(1);
      const firstEventSource = MockEventSource.instances[0];

      // Trigger error
      act(() => {
        firstEventSource.triggerError();
      });

      // After first error, should reconnect after 1000ms (2^0 * 1000)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should have created a new connection
      expect(MockEventSource.instances).toHaveLength(1);
    });

    it('should respect max 5 reconnection attempts', async () => {
      const onError = jest.fn();

      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents({ onError }));

      // Simulate 5 failed connection attempts
      for (let attempt = 0; attempt < 5; attempt++) {
        const eventSource = MockEventSource.instances[0];
        if (eventSource) {
          act(() => {
            eventSource.triggerError();
          });

          // Wait for exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          act(() => {
            jest.advanceTimersByTime(delay);
          });
        }
      }

      // After 5 attempts, trigger final error
      const finalEventSource = MockEventSource.instances[0];
      if (finalEventSource) {
        act(() => {
          finalEventSource.triggerError();
        });
      }

      // onError should be called after max attempts
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'SSE connection failed after multiple attempts',
          })
        );
      });
    });
  });

  describe('disconnect function', () => {
    it('should close connection when disconnect is called', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      const { result } = renderHook(() => useSyncEvents());

      expect(MockEventSource.instances).toHaveLength(1);

      act(() => {
        result.current.disconnect();
      });

      expect(MockEventSource.instances).toHaveLength(0);
      expect(useSyncStore.getState().connectionState).toBe('disconnected');
    });
  });

  describe('malformed event handling', () => {
    it('should handle malformed JSON in connected event gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      const eventSource = MockEventSource.instances[0];

      // Trigger with malformed data (directly call listener with bad JSON)
      act(() => {
        if (eventSource.listeners['connected']) {
          eventSource.listeners['connected']({
            data: 'not valid json',
          } as MessageEvent);
        }
      });

      // Should not crash - state should remain unchanged
      expect(useSyncStore.getState().connectionState).toBe('connecting');

      consoleError.mockRestore();
    });

    it('should handle malformed JSON in item-update event gracefully', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true, connectionState: 'connected' });

      renderHook(() => useSyncEvents());

      const eventSource = MockEventSource.instances[0];

      // Trigger with malformed data
      act(() => {
        if (eventSource.listeners['item-update']) {
          eventSource.listeners['item-update']({
            data: '{invalid json}',
          } as MessageEvent);
        }
      });

      // Should not crash
      expect(MockEventSource.instances).toHaveLength(1);
    });
  });

  describe('token encoding in URL', () => {
    it('should properly encode token in SSE URL', () => {
      const specialToken = 'token+with/special=chars&more';
      useAuthStore.setState({
        user: { ...mockUser, token: specialToken },
        isAuthenticated: true,
      });
      useSyncStore.setState({ sessionId: 'test-session', isActive: true });

      renderHook(() => useSyncEvents());

      const eventSource = MockEventSource.instances[0];
      expect(eventSource.url).toContain(encodeURIComponent(specialToken));
    });
  });
});
