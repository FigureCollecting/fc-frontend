/**
 * Production-safe debug logging utility for Frontend
 * Enable debug logs with localStorage or environment variables:
 * - localStorage.setItem('DEBUG', 'true')
 * - localStorage.setItem('DEBUG_LEVEL', 'verbose|info|warn')
 * - localStorage.setItem('DEBUG_MODULES', 'auth,api,state')
 *
 * Or in development:
 * - VITE_DEBUG=true
 * - VITE_DEBUG_LEVEL=verbose
 *
 * Security: Uses sanitizeLogValue to prevent log injection attacks (CWE-117)
 */

import {
  IS_DEV,
  IS_TEST,
  DEBUG as ENV_DEBUG,
  DEBUG_LEVEL as ENV_DEBUG_LEVEL,
  DEBUG_MODULES as ENV_DEBUG_MODULES,
} from '../config/env';

const isDevelopment = IS_DEV;
const isTest = IS_TEST;

// Check both localStorage and environment variables
const DEBUG =
  (typeof window !== 'undefined' && localStorage.getItem('DEBUG') === 'true') ||
  ENV_DEBUG === 'true' ||
  isDevelopment;

const DEBUG_LEVEL =
  (typeof window !== 'undefined' && localStorage.getItem('DEBUG_LEVEL')) ||
  ENV_DEBUG_LEVEL ||
  (isDevelopment ? 'info' : 'error');

const DEBUG_MODULES =
  (typeof window !== 'undefined' && localStorage.getItem('DEBUG_MODULES')?.split(',')) ||
  ENV_DEBUG_MODULES?.split(',') ||
  [];

type LogLevel = 'verbose' | 'info' | 'warn' | 'error';

// Maximum length for sanitized log strings (prevents log flooding)
const MAX_LOG_STRING_LENGTH = 1000;

const LOG_LEVELS: Record<LogLevel, number> = {
  verbose: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Sanitize a value for safe logging to prevent log injection attacks.
 * - Converts all values to safe string representation
 * - Removes newlines and carriage returns (prevents log forging)
 * - Removes ANSI escape codes (prevents terminal manipulation)
 * - Truncates long strings (prevents log flooding)
 */
export const sanitizeLogValue = (value: unknown): string => {
  let stringified: string;

  if (value === null) {
    stringified = 'null';
  } else if (value === undefined) {
    stringified = 'undefined';
  } else if (typeof value === 'string') {
    stringified = value;
  } else if (value instanceof Error) {
    stringified = value.message || 'Error (no message)';
  } else {
    try {
      const result = JSON.stringify(value);
      stringified = result ?? String(value);
    } catch {
      stringified = String(value);
    }
  }

  // Remove newlines, carriage returns, and ANSI escape codes
  // eslint-disable-next-line no-control-regex
  let sanitized = stringified.replace(/[\r\n]/g, ' ').replace(/\x1b\[[0-9;]*m/g, '');

  // Truncate if too long
  if (sanitized.length > MAX_LOG_STRING_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LOG_STRING_LENGTH) + '...[truncated]';
  }
  return sanitized;
};

/**
 * Sanitize all arguments into a safe log message string.
 */
const sanitizeArgs = (args: unknown[]): string => {
  return args.map(arg => sanitizeLogValue(arg)).join(' ');
};

class Logger {
  private module: string;
  private enabled: boolean;
  private level: number;

  constructor(module: string) {
    this.module = module;
    this.enabled = DEBUG || isTest || DEBUG_MODULES.includes(module) || DEBUG_MODULES.includes('*');
    this.level = LOG_LEVELS[DEBUG_LEVEL as LogLevel] || LOG_LEVELS.error;
  }

  private format(...args: unknown[]): string[] {
    return [`[${this.module}]`, new Date().toISOString(), sanitizeArgs(args)];
  }

  verbose(...args: unknown[]) {
    if (this.enabled && this.level <= LOG_LEVELS.verbose) {
      console.log(...this.format(...args));
    }
  }

  info(...args: unknown[]) {
    if (this.enabled && this.level <= LOG_LEVELS.info) {
      console.info(...this.format(...args));
    }
  }

  warn(...args: unknown[]) {
    if (this.enabled && this.level <= LOG_LEVELS.warn) {
      console.warn(...this.format(...args));
    }
  }

  error(...args: unknown[]) {
    // Always log errors in development, configurable in production
    if (isDevelopment || this.enabled) {
      console.error(...this.format(...args));
    }
  }

  debug(...args: unknown[]) {
    if (this.enabled) {
      console.log(...this.format(...args));
    }
  }
}

// Factory function
export const createLogger = (module: string): Logger => {
  return new Logger(module);
};

// Pre-configured loggers
export const authLogger = createLogger('AUTH');
export const apiLogger = createLogger('API');
export const stateLogger = createLogger('STATE');
export const registrationLogger = createLogger('REGISTRATION');
export const formLogger = createLogger('FORM');
export const cryptoLogger = createLogger('CRYPTO');
export const syncLogger = createLogger('SYNC');

// Helper to enable debug in browser console
if (typeof window !== 'undefined') {
  (window as any).enableDebug = (modules?: string) => {
    localStorage.setItem('DEBUG', 'true');
    if (modules) {
      localStorage.setItem('DEBUG_MODULES', modules);
    }
    console.log('Debug logging enabled. Refresh page to see logs.');
  };

  (window as any).disableDebug = () => {
    localStorage.removeItem('DEBUG');
    localStorage.removeItem('DEBUG_LEVEL');
    localStorage.removeItem('DEBUG_MODULES');
    console.log('Debug logging disabled. Refresh page to hide logs.');
  };
}

export default Logger;
