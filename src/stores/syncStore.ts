/**
 * Sync Store - Global state for MFC sync operations
 *
 * Manages the sync session state globally so it can be:
 * 1. Started from the sync modal
 * 2. Displayed in the persistent banner
 * 3. Accessed for auto-refresh of figure cards
 */

import { create } from 'zustand';
import {
  SyncPhase,
  SyncJobStats,
} from '../types';

export type SseConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Data structure for recovered session (from backend active-job endpoint)
export interface RecoveredJobData {
  sessionId: string;
  phase: string;
  message: string;
  stats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  startedAt: string;
}

interface SyncState {
  // Session info
  sessionId: string | null;
  isActive: boolean;

  // Recovery state
  hasOrphanedSession: boolean;
  orphanedSessionData: RecoveredJobData | null;

  // SSE connection
  connectionState: SseConnectionState;

  // Sync progress
  phase: SyncPhase | null;
  stats: SyncJobStats | null;
  message: string | null;
  error: Error | null;

  // Session state
  isPaused: boolean;

  // Failed items tracking
  failedItems: Array<{ mfcId: string; error?: string }>;

  // Actions
  startSync: (sessionId: string) => void;
  setOrphanedSession: (data: RecoveredJobData | null) => void;
  recoverSession: (data: RecoveredJobData) => void;
  dismissOrphanedSession: () => void;
  updateConnectionState: (state: SseConnectionState) => void;
  updateProgress: (phase: SyncPhase, stats: SyncJobStats, message?: string) => void;
  addFailedItem: (mfcId: string, error?: string) => void;
  setError: (error: Error | null) => void;
  setIsPaused: (isPaused: boolean) => void;
  completeSync: (phase: SyncPhase, stats: SyncJobStats, message?: string) => void;
  cancelSync: () => void;
  reset: () => void;
}

const DEFAULT_STATS: SyncJobStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  skipped: 0,
};

export const useSyncStore = create<SyncState>((set) => ({
  // Initial state
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

  // Start a new sync session
  startSync: (sessionId: string) =>
    set({
      sessionId,
      isActive: true,
      hasOrphanedSession: false,
      orphanedSessionData: null,
      connectionState: 'connecting',
      phase: 'validating',
      stats: DEFAULT_STATS,
      message: 'Starting sync...',
      error: null,
      isPaused: false,
      failedItems: [],
    }),

  // Set orphaned session data (detected on page load)
  setOrphanedSession: (data: RecoveredJobData | null) =>
    set({
      hasOrphanedSession: !!data,
      orphanedSessionData: data,
    }),

  // Recover an orphaned session - start tracking it
  recoverSession: (data: RecoveredJobData) =>
    set({
      sessionId: data.sessionId,
      isActive: true,
      hasOrphanedSession: false,
      orphanedSessionData: null,
      connectionState: 'connecting',
      phase: data.phase as any,
      stats: data.stats,
      message: data.message || 'Reconnecting...',
      error: null,
      isPaused: false,
      failedItems: [],
    }),

  // Dismiss orphaned session without recovering
  dismissOrphanedSession: () =>
    set({
      hasOrphanedSession: false,
      orphanedSessionData: null,
    }),

  // Update SSE connection state
  updateConnectionState: (connectionState: SseConnectionState) =>
    set({ connectionState }),

  // Update sync progress from SSE events
  updateProgress: (phase: SyncPhase, stats: SyncJobStats, message?: string) =>
    set((state) => ({
      phase,
      stats,
      message: message || state.message,
    })),

  // Track failed items
  addFailedItem: (mfcId: string, error?: string) =>
    set((state) => ({
      failedItems: [...state.failedItems, { mfcId, error }],
    })),

  // Set error state
  setError: (error: Error | null) =>
    set({ error }),

  // Set paused state (from session manager)
  setIsPaused: (isPaused: boolean) =>
    set({ isPaused }),

  // Mark sync as complete
  // Note: stats may be undefined if cancelled - preserve existing stats in that case
  completeSync: (phase: SyncPhase, stats: SyncJobStats, message?: string) =>
    set((state) => ({
      phase,
      stats: stats ?? state.stats,  // Preserve existing stats if none provided
      message: message || 'Sync complete',
      isActive: false,
      connectionState: 'disconnected',
    })),

  // Cancel sync
  cancelSync: () =>
    set({
      phase: 'cancelled',
      message: 'Sync cancelled',
      isActive: false,
      connectionState: 'disconnected',
    }),

  // Reset all state
  reset: () =>
    set({
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
    }),
}));
