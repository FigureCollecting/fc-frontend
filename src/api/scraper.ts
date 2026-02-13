/**
 * Scraper Service API Client
 *
 * Handles communication with the scraper service for MFC sync operations.
 * Uses a separate axios instance configured for the scraper service URL.
 */

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import {
  MfcCookies,
  MfcCookieValidationResult,
  MfcSyncResult,
  MfcQueueStats,
  MfcParsedItem,
  MfcSyncStats,
} from '../types';
import { createLogger } from '../utils/logger';

// Sync routes go through the backend (which proxies to scraper)
// This ensures auth is centralized and cookies remain ephemeral
const SYNC_URL = process.env.REACT_APP_SYNC_URL || '/api';
const logger = createLogger('SCRAPER_API');

logger.info('Sync API URL configured as:', SYNC_URL);

// Create axios instance for sync operations (via backend)
const scraperApi = axios.create({
  baseURL: SYNC_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to scraper requests
scraperApi.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle response errors
scraperApi.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('Scraper API error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// Cookie Configuration
// ============================================================================

export interface CookieAllowlistResponse {
  allowedCookies: string[];
  scriptReadable: string[];
  manualCopy: string[];
}

/**
 * Get the MFC cookie allowlist from the scraper service.
 * Returns which cookies are allowed, which can be read by JavaScript,
 * and which must be manually copied (like HttpOnly cf_clearance).
 */
export const getMfcCookieAllowlist = async (): Promise<CookieAllowlistResponse> => {
  logger.info('Fetching MFC cookie allowlist...');

  const response = await scraperApi.get('/sync/mfc/cookie-allowlist');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get cookie allowlist');
  }

  return response.data.data;
};

// ============================================================================
// Cookie Validation
// ============================================================================

/**
 * Validate MFC session cookies
 */
export const validateMfcCookies = async (
  cookies: MfcCookies
): Promise<MfcCookieValidationResult> => {
  logger.info('Validating MFC cookies...');

  const response = await scraperApi.post('/sync/validate-cookies', { cookies });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Cookie validation failed');
  }

  return response.data.data;
};

// ============================================================================
// Full Sync
// ============================================================================

export interface FullSyncOptions {
  cookies: MfcCookies;
  userId: string;
  sessionId: string;
  includeLists?: boolean;
  skipCached?: boolean;
  /** Filter by collection status (owned/ordered/wished) - if empty, sync all */
  statusFilter?: ('owned' | 'ordered' | 'wished')[];
}

/**
 * Execute full MFC sync: validate → export → parse → queue
 */
export const executeFullSync = async (
  options: FullSyncOptions
): Promise<MfcSyncResult> => {
  logger.info('Starting full MFC sync...');

  const response = await scraperApi.post('/sync/full', {
    cookies: options.cookies,
    userId: options.userId,
    sessionId: options.sessionId,
    includeLists: options.includeLists ?? false,
    skipCached: options.skipCached ?? true,
    statusFilter: options.statusFilter,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Full sync failed');
  }

  logger.info('Full sync result:', response.data.data);

  return {
    success: true,
    parsedCount: response.data.data.parsedCount,
    queuedCount: response.data.data.queuedCount,
    skippedCount: response.data.data.skippedCount,
    listsFound: response.data.data.listsFound,
    stats: response.data.data.stats,
    errors: response.data.data.errors || [],
  };
};

// ============================================================================
// CSV Sync
// ============================================================================

export interface CsvSyncOptions {
  csvContent: string;
  userId: string;
  cookies?: MfcCookies;
  sessionId?: string;
}

/**
 * Sync from user-provided CSV content
 */
export const syncFromCsv = async (
  options: CsvSyncOptions
): Promise<MfcSyncResult> => {
  logger.info('Starting CSV sync...');

  const response = await scraperApi.post('/sync/from-csv', {
    csvContent: options.csvContent,
    userId: options.userId,
    cookies: options.cookies,
    sessionId: options.sessionId,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'CSV sync failed');
  }

  logger.info('CSV sync result:', response.data.data);

  return {
    success: true,
    parsedCount: response.data.data.parsedCount,
    queuedCount: response.data.data.queuedCount,
    skippedCount: response.data.data.skippedCount,
    stats: response.data.data.stats,
    errors: response.data.data.errors || [],
  };
};

// ============================================================================
// CSV Parsing (without queueing)
// ============================================================================

export interface ParseCsvResult {
  items: MfcParsedItem[];
  stats: MfcSyncStats;
}

/**
 * Parse CSV content and return items without queueing
 */
export const parseMfcCsv = async (csvContent: string): Promise<ParseCsvResult> => {
  logger.info('Parsing MFC CSV...');

  const response = await scraperApi.post('/sync/parse-csv', { csvContent });

  if (!response.data.success) {
    throw new Error(response.data.message || 'CSV parsing failed');
  }

  return response.data.data;
};

// ============================================================================
// Queue Status
// ============================================================================

/**
 * Get current queue status and statistics
 */
export const getQueueStats = async (): Promise<MfcQueueStats> => {
  logger.verbose('Fetching queue stats...');

  const response = await scraperApi.get('/sync/queue-stats');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get queue stats');
  }

  return response.data.data;
};

/**
 * Get sync status (overall status and queue info)
 */
export const getSyncStatus = async (): Promise<{
  queueStats: MfcQueueStats;
  isProcessing: boolean;
}> => {
  logger.verbose('Fetching sync status...');

  const response = await scraperApi.get('/sync/status');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get sync status');
  }

  return response.data.data;
};

// ============================================================================
// Sync Job Management
// ============================================================================

export interface CreateSyncJobOptions {
  sessionId: string;
  includeLists?: string[];
  skipCached?: boolean;
}

export interface CreateSyncJobResult {
  job: {
    sessionId: string;
    phase: string;
    message: string;
  };
  webhookUrl: string;
  webhookSecret: string;
  existing?: boolean;
}

/**
 * Create a new sync job before starting the sync.
 * This must be called before executeFullSync to enable SSE streaming.
 */
export const createSyncJob = async (
  options: CreateSyncJobOptions
): Promise<CreateSyncJobResult> => {
  logger.info('Creating sync job...');

  const response = await scraperApi.post('/sync/job', {
    sessionId: options.sessionId,
    includeLists: options.includeLists,
    skipCached: options.skipCached,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create sync job');
  }

  return response.data;
};

/**
 * Get current sync job state (for reconnection).
 */
export const getSyncJob = async (
  sessionId: string
): Promise<{
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
  completedAt?: string;
} | null> => {
  logger.verbose('Fetching sync job:', sessionId);

  try {
    const response = await scraperApi.get(`/sync/job/${sessionId}`);

    if (!response.data.success) {
      return null;
    }

    return response.data.job;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Active job response from the backend.
 */
export interface ActiveJobResponse {
  success: boolean;
  hasActiveJob: boolean;
  job?: {
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
    completedAt?: string;
  };
}

/**
 * Check if user has an active sync job (for session recovery).
 * Returns the job details if one exists, null otherwise.
 */
export const getActiveJob = async (): Promise<ActiveJobResponse['job'] | null> => {
  logger.verbose('Checking for active sync job...');

  try {
    const response = await scraperApi.get('/sync/active-job');

    if (!response.data.success || !response.data.hasActiveJob) {
      return null;
    }

    logger.info('Found active job:', response.data.job.sessionId);
    return response.data.job;
  } catch (error: any) {
    logger.error('Failed to check for active job:', error.message);
    return null;
  }
};

/**
 * Cancel an active sync job.
 */
export const cancelSyncJob = async (sessionId: string): Promise<void> => {
  logger.info('Cancelling sync job:', sessionId);

  const response = await scraperApi.delete(`/sync/job/${sessionId}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to cancel sync job');
  }
};

// ============================================================================
// Session Control Functions
// ============================================================================

/**
 * Session status from the scraper.
 */
export interface SessionStatus {
  sessionId: string;
  isPaused: boolean;
  inCooldown: boolean;
  cooldownRemainingMs?: number;
  consecutiveFailures: number;
  failedMfcIds: string[];
}

/**
 * Get all active sync sessions with their status.
 */
export const getSyncSessions = async (): Promise<{
  sessions: SessionStatus[];
  count: number;
  pausedCount: number;
  inCooldownCount: number;
}> => {
  logger.verbose('Getting sync sessions');

  const response = await scraperApi.get('/sync/sessions');

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get sync sessions');
  }

  return response.data.data;
};

/**
 * Resume a paused sync session.
 */
export const resumeSyncSession = async (sessionId: string): Promise<void> => {
  logger.info('Resuming sync session:', sessionId);

  const response = await scraperApi.post(`/sync/sessions/${sessionId}/resume`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to resume session');
  }
};

/**
 * Cancel failed items for a sync session.
 */
export const cancelFailedItems = async (sessionId: string): Promise<number> => {
  logger.info('Cancelling failed items for session:', sessionId);

  const response = await scraperApi.post(`/sync/sessions/${sessionId}/cancel-failed`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to cancel failed items');
  }

  return response.data.data.cancelledCount;
};

// ============================================================================
// Export for convenience
// ============================================================================

export { scraperApi };
