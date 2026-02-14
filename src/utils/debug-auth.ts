/**
 * Debug utility for authentication issues
 * Only available in development mode via window.debugAuth
 * Security: Never logs actual token values, only presence/absence
 */

import { useAuthStore } from '../stores/authStore';
import { authLogger } from './logger';

export const debugAuth = {
  // Log current auth state (without sensitive token data)
  logAuthState: () => {
    const state = useAuthStore.getState();
    authLogger.debug('Current state:', {
      isAuthenticated: state.isAuthenticated,
      hasUser: !!state.user,
      hasToken: !!state.user?.token,
      username: state.user?.username || 'none'
    });

    // Check localStorage
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        authLogger.debug('LocalStorage:', {
          hasState: !!parsed.state,
          hasUser: !!parsed.state?.user,
          hasToken: !!parsed.state?.user?.token,
        });
      } catch (e) {
        authLogger.debug('LocalStorage parse error');
      }
    } else {
      authLogger.debug('No auth-storage in localStorage');
    }
  },

  // Test API call with auth
  testAuthenticatedCall: async () => {
    authLogger.debug('Testing authenticated API call');
    debugAuth.logAuthState();

    try {
      const response = await fetch('/api/figures', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().user?.token || 'NO_TOKEN'}`
        }
      });

      authLogger.debug('Test call response:', {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.status === 401) {
        authLogger.debug('Got 401 - token likely invalid or missing');
      }
    } catch (error) {
      authLogger.debug('Test call error:', error);
    }
  },

  // Monitor auth state changes
  subscribeToAuthChanges: () => {
    authLogger.debug('Subscribing to auth state changes');

    return useAuthStore.subscribe((state) => {
      authLogger.debug('Auth state changed:', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        hasToken: !!state.user?.token,
        timestamp: new Date().toISOString()
      });
    });
  }
};

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  // Make debugAuth globally available
  (window as any).debugAuth = debugAuth;
  authLogger.debug('Debug utilities available at window.debugAuth');
}
