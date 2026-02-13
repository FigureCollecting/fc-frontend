/**
 * useSessionRecovery Hook - Check for orphaned sync sessions on mount
 *
 * This hook checks if the user has an active sync job running on the server
 * that they're not currently connected to (e.g., after page refresh or SSE disconnect).
 *
 * When an orphaned session is detected:
 * 1. The syncStore.hasOrphanedSession flag is set to true
 * 2. The SyncStatusBanner displays a recovery banner
 * 3. User can choose to reconnect (resume) or cancel the session
 */

import { useEffect, useRef } from 'react';
import { getActiveJob } from '../api/scraper';
import { useSyncStore } from '../stores/syncStore';
import { useAuthStore } from '../stores/authStore';
import { createLogger } from '../utils/logger';

const logger = createLogger('SESSION_RECOVERY');

/**
 * Check for active sync sessions on mount and offer recovery.
 * Should be called once near the top of the component tree.
 */
export function useSessionRecovery() {
  const { user } = useAuthStore();
  const {
    isActive,
    sessionId,
    setOrphanedSession,
    hasOrphanedSession,
    orphanedSessionData,
  } = useSyncStore();

  // Track if we've already checked this session
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once per mount, and only if:
    // 1. User is logged in
    // 2. No active sync in progress
    // 3. Haven't already checked this session
    if (!user?.token || isActive || sessionId || hasCheckedRef.current) {
      return;
    }

    hasCheckedRef.current = true;

    const checkForOrphanedSession = async () => {
      logger.info('Checking for orphaned sync sessions...');

      try {
        const activeJob = await getActiveJob();

        if (activeJob) {
          logger.info('Found orphaned session:', activeJob.sessionId, 'phase:', activeJob.phase);
          setOrphanedSession(activeJob);
        } else {
          logger.verbose('No orphaned sessions found');
          setOrphanedSession(null);
        }
      } catch (error) {
        logger.error('Failed to check for orphaned sessions:', error);
        // Don't set error state - just silently fail the check
      }
    };

    checkForOrphanedSession();
  }, [user?.token, isActive, sessionId, setOrphanedSession]);

  // Reset the check flag when user logs out
  useEffect(() => {
    if (!user?.token) {
      hasCheckedRef.current = false;
    }
  }, [user?.token]);

  return {
    hasOrphanedSession,
    orphanedSessionData,
  };
}

export default useSessionRecovery;
