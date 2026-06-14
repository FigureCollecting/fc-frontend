/**
 * Centralized environment-variable access.
 *
 * Vite exposes build-time vars on `import.meta.env` (only keys prefixed with
 * `VITE_`). Jest runs source compiled to CommonJS, where `import.meta.env` is
 * not populated, so we fall back to `process.env` (tests set REACT_APP_* /
 * VITE_* there directly). Optional chaining keeps both paths safe.
 */

// In Vite builds this is the real import.meta.env object; under Jest the
// import.meta transform leaves `.env` undefined, so coalesce to {}.
const metaEnv: Record<string, string | undefined> =
  ((typeof import.meta !== 'undefined' && (import.meta as any).env) || {}) as Record<
    string,
    string | undefined
  >;

const fromEnv = (viteKey: string, legacyKey: string): string | undefined =>
  metaEnv[viteKey] ?? process.env[viteKey] ?? process.env[legacyKey];

export const API_URL = fromEnv('VITE_API_URL', 'REACT_APP_API_URL') || '/api';

export const SYNC_URL = fromEnv('VITE_SYNC_URL', 'REACT_APP_SYNC_URL') || '/api';

export const DEBUG = fromEnv('VITE_DEBUG', 'REACT_APP_DEBUG');

export const DEBUG_LEVEL = fromEnv('VITE_DEBUG_LEVEL', 'REACT_APP_DEBUG_LEVEL');

export const DEBUG_MODULES = fromEnv('VITE_DEBUG_MODULES', 'REACT_APP_DEBUG_MODULES');

/** Current mode. Vite sets import.meta.env.MODE; Jest/node use NODE_ENV. */
export const MODE: string = metaEnv.MODE ?? process.env.NODE_ENV ?? 'production';

export const IS_DEV: boolean =
  metaEnv.DEV !== undefined ? Boolean(metaEnv.DEV) : MODE === 'development';

export const IS_TEST: boolean = MODE === 'test';
