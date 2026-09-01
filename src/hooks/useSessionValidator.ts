import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getUserProfile } from '../api';
import { createLogger } from '../utils/logger';
import { redirectTo } from '../utils/navigation';

const logger = createLogger('SESSION');

// Validate session every 5 minutes
const VALIDATION_INTERVAL_MS = 5 * 60 * 1000;

// Also validate on window focus (user returns to tab)
const VALIDATE_ON_FOCUS = true;

/**
 * Hook that proactively validates the user's session.
 *
 * Instead of waiting for a 401 error when the user tries an action,
 * this hook periodically checks if the session is still valid and
 * redirects to login if it's expired.
 *
 * Validation triggers:
 * 1. On mount (if authenticated)
 * 2. Every 5 minutes while authenticated
 * 3. When user returns to the browser tab (focus event)
 */
export const useSessionValidator = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const lastValidationRef = useRef<number>(0);
  const isValidatingRef = useRef<boolean>(false);

  const validateSession = useCallback(async (reason: string) => {
    // Skip if not authenticated or already validating
    if (!isAuthenticated || !user?.token || isValidatingRef.current) {
      return;
    }

    // Debounce: don't validate more than once per 30 seconds
    const now = Date.now();
    if (now - lastValidationRef.current < 30000) {
      logger.verbose(`Skipping validation (${reason}) - too recent`);
      return;
    }

    isValidatingRef.current = true;
    lastValidationRef.current = now;

    try {
      logger.verbose(`Validating session (${reason})...`);
      await getUserProfile();
      logger.verbose('Session valid');
    } catch (error: any) {
      // 401 means token is invalid/expired
      if (error.response?.status === 401) {
        logger.warn('Session expired - redirecting to login');
        logout();
        localStorage.removeItem('auth-storage');
        redirectTo('/login');
      } else if (!error.response) {
        // Network error - backend might be down, don't logout
        logger.warn('Network error during session validation - backend may be unavailable');
      } else {
        // Other error - log but don't logout
        logger.warn('Session validation error:', error.response?.status);
      }
    } finally {
      isValidatingRef.current = false;
    }
  }, [isAuthenticated, user?.token, logout]);

  // Validate on mount
  useEffect(() => {
    if (isAuthenticated) {
      validateSession('mount');
    }
  }, [isAuthenticated, validateSession]);

  // Periodic validation
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      validateSession('interval');
    }, VALIDATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, validateSession]);

  // Validate when window gains focus
  useEffect(() => {
    if (!VALIDATE_ON_FOCUS || !isAuthenticated) return;

    const handleFocus = () => {
      validateSession('focus');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, validateSession]);

  // Validate on visibility change (tab becomes visible)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession('visibility');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, validateSession]);
};
