/**
 * Tests for crypto.ts - MFC cookie encryption/storage utilities
 */

// Ensure TextEncoder/TextDecoder are available
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import {
  encrypt,
  decrypt,
  storeMfcCookies,
  retrieveMfcCookies,
  clearSessionCookies,
  clearMfcCookies,
  hasMfcCookies,
  getStorageType,
} from '../crypto';

// Mock window.crypto for encrypt/decrypt
const mockSubtle = {
  importKey: jest.fn(),
  deriveKey: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

const mockGetRandomValues = (arr: Uint8Array) => {
  for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
  return arr;
};

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: mockGetRandomValues,
  },
  writable: true,
});

// Create real-like storage mocks that actually store data
// (setupTests.ts replaces localStorage/sessionStorage with no-op mocks)
function createStorageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i: number) => Object.keys(store)[i] || null),
  } as unknown as Storage;
}

describe('crypto utilities', () => {
  beforeEach(() => {
    // Clear subtle mocks only
    mockSubtle.importKey.mockReset();
    mockSubtle.deriveKey.mockReset();
    mockSubtle.encrypt.mockReset();
    mockSubtle.decrypt.mockReset();
    // Replace the no-op storage mocks from setupTests.ts with functional ones
    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      writable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: createStorageMock(),
      writable: true,
    });
  });

  describe('getStorageType', () => {
    it('should return null when no userId provided', () => {
      expect(getStorageType()).toBeNull();
    });

    it('should return null when no userId provided (undefined)', () => {
      expect(getStorageType(undefined)).toBeNull();
    });

    it('should return null when no storage type stored', () => {
      expect(getStorageType('user123')).toBeNull();
    });

    it('should return session type from sessionStorage', () => {
      sessionStorage.setItem('mfc_auth_storage_type_user123', 'session');
      expect(getStorageType('user123')).toBe('session');
    });

    it('should return persistent type from localStorage', () => {
      localStorage.setItem('mfc_auth_storage_type_user123', 'persistent');
      expect(getStorageType('user123')).toBe('persistent');
    });

    it('should prefer sessionStorage over localStorage', () => {
      sessionStorage.setItem('mfc_auth_storage_type_user123', 'session');
      localStorage.setItem('mfc_auth_storage_type_user123', 'persistent');
      expect(getStorageType('user123')).toBe('session');
    });
  });

  describe('hasMfcCookies', () => {
    it('should return false when no userId provided', () => {
      expect(hasMfcCookies()).toBe(false);
    });

    it('should return false when no cookies stored', () => {
      expect(hasMfcCookies('user123')).toBe(false);
    });

    it('should return true when cookies in sessionStorage', () => {
      sessionStorage.setItem('mfc_auth_encrypted_user123', 'some-data');
      expect(hasMfcCookies('user123')).toBe(true);
    });

    it('should return true when cookies in localStorage', () => {
      localStorage.setItem('mfc_auth_encrypted_user123', 'some-data');
      expect(hasMfcCookies('user123')).toBe(true);
    });

    it('should return false for different userId', () => {
      sessionStorage.setItem('mfc_auth_encrypted_user999', 'some-data');
      expect(hasMfcCookies('user123')).toBe(false);
    });
  });

  describe('clearSessionCookies', () => {
    it('should do nothing when no userId provided', () => {
      clearSessionCookies();
      // Should not throw
    });

    it('should clear session cookies only', () => {
      sessionStorage.setItem('mfc_auth_encrypted_user123', 'session-data');
      sessionStorage.setItem('mfc_auth_storage_type_user123', 'session');
      localStorage.setItem('mfc_auth_encrypted_user123', 'persistent-data');
      localStorage.setItem('mfc_auth_storage_type_user123', 'persistent');

      clearSessionCookies('user123');

      expect(sessionStorage.getItem('mfc_auth_encrypted_user123')).toBeNull();
      expect(sessionStorage.getItem('mfc_auth_storage_type_user123')).toBeNull();
      // localStorage should be preserved
      expect(localStorage.getItem('mfc_auth_encrypted_user123')).toBe('persistent-data');
      expect(localStorage.getItem('mfc_auth_storage_type_user123')).toBe('persistent');
    });
  });

  describe('clearMfcCookies', () => {
    it('should do nothing when no userId provided', () => {
      clearMfcCookies();
      // Should not throw
    });

    it('should clear both session and persistent cookies', () => {
      sessionStorage.setItem('mfc_auth_encrypted_user123', 'session-data');
      sessionStorage.setItem('mfc_auth_storage_type_user123', 'session');
      localStorage.setItem('mfc_auth_encrypted_user123', 'persistent-data');
      localStorage.setItem('mfc_auth_storage_type_user123', 'persistent');

      clearMfcCookies('user123');

      expect(sessionStorage.getItem('mfc_auth_encrypted_user123')).toBeNull();
      expect(sessionStorage.getItem('mfc_auth_storage_type_user123')).toBeNull();
      expect(localStorage.getItem('mfc_auth_encrypted_user123')).toBeNull();
      expect(localStorage.getItem('mfc_auth_storage_type_user123')).toBeNull();
    });
  });

  describe('storeMfcCookies', () => {
    it('should do nothing when no userId provided', async () => {
      await storeMfcCookies('cookies', 'session');
      // Should not throw, nothing stored
    });

    it('should store in sessionStorage for session type', async () => {
      await storeMfcCookies('my-cookies', 'session', 'user123');
      expect(sessionStorage.getItem('mfc_auth_encrypted_user123')).toBe('my-cookies');
      expect(sessionStorage.getItem('mfc_auth_storage_type_user123')).toBe('session');
    });

    it('should encrypt and store in localStorage for persistent type', async () => {
      const mockKey = {};
      mockSubtle.importKey.mockResolvedValue(mockKey);
      mockSubtle.deriveKey.mockResolvedValue(mockKey);
      mockSubtle.encrypt.mockResolvedValue(new ArrayBuffer(8));

      await storeMfcCookies('my-cookies', 'persistent', 'user123');
      expect(localStorage.getItem('mfc_auth_encrypted_user123')).toBeTruthy();
      expect(localStorage.getItem('mfc_auth_storage_type_user123')).toBe('persistent');
    });

    it('should clear existing storage before storing', async () => {
      localStorage.setItem('mfc_auth_encrypted_user123', 'old-persistent');

      await storeMfcCookies('new-cookies', 'session', 'user123');
      // Old localStorage data should be cleared (clearMfcCookies called internally)
      expect(localStorage.getItem('mfc_auth_encrypted_user123')).toBeNull();
    });
  });

  describe('retrieveMfcCookies', () => {
    it('should return null when no userId provided', async () => {
      const result = await retrieveMfcCookies();
      expect(result).toBeNull();
    });

    it('should return null when no cookies stored', async () => {
      const result = await retrieveMfcCookies('user123');
      expect(result).toBeNull();
    });

    it('should return plaintext from session storage', async () => {
      sessionStorage.setItem('mfc_auth_encrypted_user123', 'plaintext-cookies');
      sessionStorage.setItem('mfc_auth_storage_type_user123', 'session');

      const result = await retrieveMfcCookies('user123');
      expect(result).toBe('plaintext-cookies');
    });

    it('should return null when cookies exist but no storage type', async () => {
      sessionStorage.setItem('mfc_auth_encrypted_user123', 'some-data');
      // No storage type set
      const result = await retrieveMfcCookies('user123');
      expect(result).toBeNull();
    });

    it('should try localStorage when not in sessionStorage', async () => {
      localStorage.setItem('mfc_auth_encrypted_user123', 'persistent-data');
      localStorage.setItem('mfc_auth_storage_type_user123', 'session');

      const result = await retrieveMfcCookies('user123');
      expect(result).toBe('persistent-data');
    });

    it('should decrypt persistent cookies', async () => {
      localStorage.setItem('mfc_auth_encrypted_user123', btoa('some-encrypted-padded-data-here-!!!'));
      localStorage.setItem('mfc_auth_storage_type_user123', 'persistent');

      const mockKey = {};
      mockSubtle.importKey.mockResolvedValue(mockKey);
      mockSubtle.deriveKey.mockResolvedValue(mockKey);

      const encoder = new TextEncoder();
      const decryptedData = encoder.encode('decrypted-cookies').buffer;
      mockSubtle.decrypt.mockResolvedValue(decryptedData);

      const result = await retrieveMfcCookies('user123');
      expect(result).toBe('decrypted-cookies');
    });

    it('should clear corrupted data and return null on decrypt failure', async () => {
      localStorage.setItem('mfc_auth_encrypted_user123', btoa('corrupted-data-here-padded!!!!!'));
      localStorage.setItem('mfc_auth_storage_type_user123', 'persistent');

      const mockKey = {};
      mockSubtle.importKey.mockResolvedValue(mockKey);
      mockSubtle.deriveKey.mockResolvedValue(mockKey);
      mockSubtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await retrieveMfcCookies('user123');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('encrypt', () => {
    it('should encrypt plaintext and return base64 string', async () => {
      const mockKey = {};
      mockSubtle.importKey.mockResolvedValue(mockKey);
      mockSubtle.deriveKey.mockResolvedValue(mockKey);
      mockSubtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

      const result = await encrypt('hello world');
      expect(typeof result).toBe('string');
      // Should be base64 encoded
      expect(() => atob(result)).not.toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt ciphertext and return plaintext', async () => {
      // Create a valid ciphertext: 16 bytes salt + 12 bytes IV + encrypted data
      const combined = new Uint8Array(36);
      for (let i = 0; i < 36; i++) combined[i] = i;
      let binary = '';
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      const ciphertext = btoa(binary);

      const mockKey = {};
      mockSubtle.importKey.mockResolvedValue(mockKey);
      mockSubtle.deriveKey.mockResolvedValue(mockKey);

      const encoder = new TextEncoder();
      mockSubtle.decrypt.mockResolvedValue(encoder.encode('hello world').buffer);

      const result = await decrypt(ciphertext);
      expect(result).toBe('hello world');
    });

    it('should throw on decryption failure', async () => {
      const combined = new Uint8Array(36);
      let binary = '';
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      const ciphertext = btoa(binary);

      const mockKey = {};
      mockSubtle.importKey.mockResolvedValue(mockKey);
      mockSubtle.deriveKey.mockResolvedValue(mockKey);
      mockSubtle.decrypt.mockRejectedValue(new Error('fail'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await expect(decrypt(ciphertext)).rejects.toThrow('Failed to decrypt data');
      consoleSpy.mockRestore();
    });
  });
});
