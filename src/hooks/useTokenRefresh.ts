import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { refreshAccessToken } from '../api';
import { createLogger } from '../utils/logger';

const logger = createLogger('TOKEN_REFRESH');

// Refresh token when it will expire within this window (2 minutes before expiry)
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

// Check for refresh every 30 seconds
const CHECK_INTERVAL_MS = 30 * 1000;

// Minimum time between refresh attempts (prevent rapid retries on error)
const MIN_REFRESH_INTERVAL_MS = 10 * 1000;

/**
 * Hook that handles automatic token refresh based on activity.
 *
 * Behavior:
 * 1. Periodically checks if access token is about to expire
 * 2. If token expires soon AND there was recent activity, refresh it
 * 3. If refresh fails, logout user
 *
 * This ensures:
 * - Active users stay logged in indefinitely
 * - Inactive users are logged out when token expires
 * - No unnecessary refresh calls when user is idle
 */
export const useTokenRefresh = () => {
  const { user, isAuthenticated, lastActivity, updateTokens, logout } = useAuthStore();
  const isRefreshingRef = useRef(false);
  const lastRefreshAttemptRef = useRef(0);

  const attemptRefresh = useCallback(async () => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      logger.verbose('Refresh already in progress, skipping');
      return false;
    }

    // Prevent rapid retry on error
    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < MIN_REFRESH_INTERVAL_MS) {
      logger.verbose('Too soon since last refresh attempt, skipping');
      return false;
    }

    // Need a refresh token to refresh
    if (!user?.refreshToken) {
      logger.warn('No refresh token available');
      return false;
    }

    isRefreshingRef.current = true;
    lastRefreshAttemptRef.current = now;

    try {
      logger.verbose('Attempting token refresh...');
      const result = await refreshAccessToken(user.refreshToken);

      updateTokens(result.token, result.refreshToken, result.tokenExpiresAt);
      logger.info('Token refreshed successfully');
      return true;
    } catch (error: any) {
      logger.error('Token refresh failed:', error.response?.status || error.message);

      // If refresh fails with 401/403, the refresh token is invalid - logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        logger.warn('Refresh token invalid, logging out');
        logout();
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user?.refreshToken, updateTokens, logout]);

  // Check if token needs refresh
  const checkAndRefresh = useCallback(() => {
    if (!isAuthenticated || !user?.token || !user?.tokenExpiresAt) {
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = user.tokenExpiresAt - now;

    // If token expires within threshold, check for activity
    if (timeUntilExpiry <= REFRESH_THRESHOLD_MS) {
      // Calculate time since last activity
      const timeSinceActivity = now - lastActivity;

      // If there was activity within the expiry window, refresh
      // This means user was active, so extend their session
      if (timeSinceActivity < REFRESH_THRESHOLD_MS + CHECK_INTERVAL_MS) {
        logger.verbose(`Token expires in ${Math.round(timeUntilExpiry / 1000)}s, activity ${Math.round(timeSinceActivity / 1000)}s ago - refreshing`);
        attemptRefresh();
      } else {
        logger.verbose(`Token expires in ${Math.round(timeUntilExpiry / 1000)}s, but no recent activity - will expire`);
      }
    }
  }, [isAuthenticated, user?.token, user?.tokenExpiresAt, lastActivity, attemptRefresh]);

  // Set up periodic check
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial check
    checkAndRefresh();

    // Periodic check
    const interval = setInterval(checkAndRefresh, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkAndRefresh]);

  // Also check when window gains focus (user returns to tab)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleFocus = () => {
      logger.verbose('Window focused, checking token');
      checkAndRefresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, checkAndRefresh]);

  // Return function to manually trigger activity (for SSE events)
  return {
    recordActivity: useAuthStore.getState().recordActivity,
    attemptRefresh,
  };
};

/**
 * Call this function to record user activity from anywhere in the app.
 * This is useful for SSE events, background operations, etc.
 */
export const recordUserActivity = () => {
  useAuthStore.getState().recordActivity();
};
