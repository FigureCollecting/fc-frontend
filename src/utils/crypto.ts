/**
 * Web Crypto API utilities for encrypting/decrypting MFC cookies
 * Uses AES-GCM for authenticated encryption
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

/**
 * Generates a cryptographic key from a password using PBKDF2
 * The password is derived from a combination of user-specific data
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  // Use a combination of factors for the key derivation
  // In a real app, this might include user ID, but for client-side only we use a fixed pepper
  const pepper = 'figurecollector-mfc-cookie-encryption-v1';

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(pepper);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM
 */
export async function encrypt(plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(salt);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    data
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64 (avoiding spread operator for TS compatibility)
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts data using AES-GCM
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    // Decode from base64 (avoiding Uint8Array.from for TS compatibility)
    const binaryString = atob(ciphertext);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const encrypted = combined.slice(16 + IV_LENGTH);

    const key = await deriveKey(salt);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Storage types for MFC cookies
 * - session: Stored in sessionStorage, cleared on logout
 * - persistent: Encrypted and stored in localStorage until manually cleared
 */
export type StorageType = 'session' | 'persistent';

const STORAGE_KEY_BASE = 'mfc_auth_encrypted';
const STORAGE_TYPE_KEY_BASE = 'mfc_auth_storage_type';

/**
 * Get user-scoped storage keys
 * Cookies are isolated per user to prevent leakage between FC users on same browser
 * Returns null if no userId provided (caller should handle gracefully)
 */
function getStorageKeys(userId?: string): { cookieKey: string; typeKey: string } | null {
  if (!userId) {
    return null;
  }
  return {
    cookieKey: `${STORAGE_KEY_BASE}_${userId}`,
    typeKey: `${STORAGE_TYPE_KEY_BASE}_${userId}`,
  };
}

/**
 * Stores MFC cookies with encryption (if persistent)
 * @param cookies - The MFC cookie string to store
 * @param storageType - 'session' or 'persistent'
 * @param userId - User ID for scoped storage (required)
 */
export async function storeMfcCookies(
  cookies: string,
  storageType: StorageType,
  userId?: string
): Promise<void> {
  const keys = getStorageKeys(userId);
  if (!keys) return; // No userId, can't store

  // Clear any existing storage first
  clearMfcCookies(userId);

  const { cookieKey, typeKey } = keys;
  const storage = storageType === 'persistent' ? localStorage : sessionStorage;

  if (storageType === 'persistent') {
    // Encrypt for persistent storage
    const encrypted = await encrypt(cookies);
    storage.setItem(cookieKey, encrypted);
  } else {
    // Store plaintext in sessionStorage (session type only)
    storage.setItem(cookieKey, cookies);
  }

  storage.setItem(typeKey, storageType);
}

/**
 * Retrieves stored MFC cookies
 * @param userId - User ID for scoped storage lookup (required)
 */
export async function retrieveMfcCookies(userId?: string): Promise<string | null> {
  const keys = getStorageKeys(userId);
  if (!keys) return null; // No userId, can't retrieve

  const { cookieKey, typeKey } = keys;

  // Check sessionStorage first (session storage)
  let cookies = sessionStorage.getItem(cookieKey);
  let storageType = sessionStorage.getItem(typeKey);

  // If not in session, check localStorage (persistent)
  if (!cookies) {
    cookies = localStorage.getItem(cookieKey);
    storageType = localStorage.getItem(typeKey);
  }

  if (!cookies || !storageType) {
    return null;
  }

  // Decrypt if from persistent storage
  if (storageType === 'persistent') {
    try {
      return await decrypt(cookies);
    } catch (error) {
      console.error('Failed to decrypt MFC cookies:', error);
      clearMfcCookies(userId); // Clear corrupted data
      return null;
    }
  }

  return cookies;
}

/**
 * Clears session-based MFC cookies only (for logout)
 * Preserves persistent cookies
 * @param userId - User ID for scoped storage (required)
 */
export function clearSessionCookies(userId?: string): void {
  const keys = getStorageKeys(userId);
  if (!keys) return; // No userId, nothing to clear

  const { cookieKey, typeKey } = keys;
  sessionStorage.removeItem(cookieKey);
  sessionStorage.removeItem(typeKey);
}

/**
 * Clears ALL stored MFC cookies (session AND persistent)
 * Use this for manual "Clear Cookies" action only
 * @param userId - User ID for scoped storage (required)
 */
export function clearMfcCookies(userId?: string): void {
  const keys = getStorageKeys(userId);
  if (!keys) return; // No userId, nothing to clear

  const { cookieKey, typeKey } = keys;
  sessionStorage.removeItem(cookieKey);
  sessionStorage.removeItem(typeKey);
  localStorage.removeItem(cookieKey);
  localStorage.removeItem(typeKey);
}

/**
 * Checks if MFC cookies are currently stored
 * @param userId - User ID for scoped storage lookup (required)
 */
export function hasMfcCookies(userId?: string): boolean {
  const keys = getStorageKeys(userId);
  if (!keys) return false; // No userId, no cookies

  const { cookieKey } = keys;
  return !!(
    sessionStorage.getItem(cookieKey) ||
    localStorage.getItem(cookieKey)
  );
}

/**
 * Gets the current storage type
 * @param userId - User ID for scoped storage lookup (required)
 */
export function getStorageType(userId?: string): StorageType | null {
  const keys = getStorageKeys(userId);
  if (!keys) return null; // No userId, no storage type

  const { typeKey } = keys;
  const storageType =
    sessionStorage.getItem(typeKey) ||
    localStorage.getItem(typeKey);

  return storageType as StorageType | null;
}
