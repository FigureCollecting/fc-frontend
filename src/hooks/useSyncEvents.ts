/**
 * useSyncEvents Hook - Server-Sent Events for MFC Sync Progress
 *
 * Manages a real-time SSE connection to the backend for sync progress updates.
 * Automatically reconnects on disconnect with exponential backoff.
 * Updates the global syncStore for persistent banner display.
 *
 * Events received:
 * - connected: Initial state when SSE connection established
 * - item-update: Individual item processing completion
 * - phase-change: Sync phase transitions (validating → enriching → completed)
 * - sync-complete: Final sync completion (success, failure, or cancellation)
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  SseConnectedEvent,
  SseItemUpdateEvent,
  SsePhaseChangeEvent,
  SseSyncCompleteEvent,
} from '../types';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { createLogger } from '../utils/logger';
import { recordUserActivity } from './useTokenRefresh';
import { SYNC_URL } from '../config/env';

const logger = createLogger('SYNC_EVENTS');

// Base URL for SSE endpoint (same as API since it's proxied)

export interface UseSyncEventsOptions {
  /** Called when an item finishes processing */
  onItemUpdate?: (event: SseItemUpdateEvent) => void;
  /** Called when sync phase changes */
  onPhaseChange?: (event: SsePhaseChangeEvent) => void;
  /** Called when sync completes (success, failure, or cancellation) */
  onComplete?: (event: SseSyncCompleteEvent) => void;
  /** Called on SSE error */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing SSE connection to sync progress stream.
 * Uses the global syncStore for state management.
 */
export function useSyncEvents(options: UseSyncEventsOptions = {}) {
  const { onItemUpdate, onPhaseChange, onComplete, onError } = options;

  const { user } = useAuthStore();
  const {
    sessionId,
    isActive,
    updateConnectionState,
    updateProgress,
    addFailedItem,
    completeSync,
  } = useSyncStore();

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  /**
   * Clean up EventSource connection and timers.
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Establish SSE connection.
   */
  const connect = useCallback(() => {
    if (!sessionId || !user?.token) {
      logger.warn('Cannot connect: missing sessionId or auth token');
      return;
    }

    cleanup();
    updateConnectionState('connecting');

    // Construct SSE URL with auth token as query param
    // EventSource doesn't support custom headers, so we pass token in URL
    const sseUrl = `${SYNC_URL}/sync/stream/${sessionId}?token=${encodeURIComponent(user.token)}`;

    logger.info(`Connecting to SSE: ${sessionId}`);
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    // Handle successful connection
    eventSource.addEventListener('connected', (e) => {
      try {
        const data: SseConnectedEvent = JSON.parse((e as MessageEvent).data);
        logger.info('SSE connected:', data);

        updateConnectionState('connected');
        reconnectAttemptRef.current = 0; // Reset reconnect counter on success

        // If reconnecting to a job that already finished, complete it immediately
        const terminalPhases = ['completed', 'failed', 'cancelled'];
        if (terminalPhases.includes(data.phase)) {
          logger.info('Connected to terminal job, completing:', data.phase);
          completeSync(data.phase, data.stats, data.message);
          cleanup();
        } else {
          updateProgress(data.phase, data.stats, data.message);
        }

        // Record activity - user is actively watching sync progress
        recordUserActivity();
      } catch (err) {
        logger.error('Failed to parse connected event:', err);
      }
    });

    // Handle item updates
    eventSource.addEventListener('item-update', (e) => {
      try {
        const data: SseItemUpdateEvent = JSON.parse((e as MessageEvent).data);
        logger.verbose('Item update:', data.mfcId, data.status);

        updateProgress(data.phase, data.stats);

        // Track failed items
        if (data.status === 'failed' && data.error) {
          addFailedItem(data.mfcId, data.error);
        }

        onItemUpdate?.(data);

        // Record activity - each item update shows active monitoring
        recordUserActivity();
      } catch (err) {
        logger.error('Failed to parse item-update event:', err);
      }
    });

    // Handle phase changes
    eventSource.addEventListener('phase-change', (e) => {
      try {
        const data: SsePhaseChangeEvent = JSON.parse((e as MessageEvent).data);
        logger.info('Phase change:', data.phase, data.message);

        updateProgress(data.phase, data.stats, data.message);
        onPhaseChange?.(data);

        // Record activity - phase changes indicate active sync monitoring
        recordUserActivity();
      } catch (err) {
        logger.error('Failed to parse phase-change event:', err);
      }
    });

    // Handle sync completion
    eventSource.addEventListener('sync-complete', (e) => {
      try {
        const data: SseSyncCompleteEvent = JSON.parse((e as MessageEvent).data);
        logger.info('Sync complete:', data.phase);

        completeSync(data.phase, data.stats, data.message);
        onComplete?.(data);

        // Record activity - sync completion is definitely user activity
        recordUserActivity();

        // Close connection - no more events expected
        cleanup();
      } catch (err) {
        logger.error('Failed to parse sync-complete event:', err);
      }
    });

    // Handle connection errors
    eventSource.onerror = () => {
      logger.warn('SSE connection error');
      updateConnectionState('error');

      // Attempt reconnection with exponential backoff
      const attempt = reconnectAttemptRef.current;
      if (attempt < 5 && isActive) {
        const delay = Math.min(500 * Math.pow(2, attempt), 30000);
        logger.info(`Reconnecting in ${delay}ms (attempt ${attempt + 1})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current = attempt + 1;
          connect();
        }, delay);
      } else if (attempt >= 5) {
        const connectionError = new Error('SSE connection failed after multiple attempts');
        onError?.(connectionError);
        cleanup();
      }
    };
  }, [
    sessionId,
    user?.token,
    isActive,
    cleanup,
    updateConnectionState,
    updateProgress,
    addFailedItem,
    completeSync,
    onItemUpdate,
    onPhaseChange,
    onComplete,
    onError,
  ]);

  /**
   * Manual disconnect.
   */
  const disconnect = useCallback(() => {
    cleanup();
    updateConnectionState('disconnected');
    reconnectAttemptRef.current = 0;
  }, [cleanup, updateConnectionState]);

  // Connect when sync becomes active
  useEffect(() => {
    if (isActive && sessionId && user?.token) {
      connect();
    } else if (!isActive) {
      cleanup();
    }

    return cleanup;
  }, [isActive, sessionId, user?.token, connect, cleanup]);

  return { disconnect };
}

export default useSyncEvents;
