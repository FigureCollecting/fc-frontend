/**
 * Minimal Test Environment Setup
 * This file contains ONLY essential test environment configuration.
 * All library-specific mocks are in src/test-utils/mocks/
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { configure } from '@testing-library/react';

// Mock axios globally to prevent ES6 import issues
jest.mock('axios', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: { success: true } })),
    post: jest.fn(() => Promise.resolve({ data: { success: true } })),
    put: jest.fn(() => Promise.resolve({ data: { success: true } })),
    delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: { success: true } })),
      post: jest.fn(() => Promise.resolve({ data: { success: true } })),
      put: jest.fn(() => Promise.resolve({ data: { success: true } })),
      delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  },
  get: jest.fn(() => Promise.resolve({ data: { success: true } })),
  post: jest.fn(() => Promise.resolve({ data: { success: true } })),
  put: jest.fn(() => Promise.resolve({ data: { success: true } })),
  delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: { success: true } })),
    post: jest.fn(() => Promise.resolve({ data: { success: true } })),
    put: jest.fn(() => Promise.resolve({ data: { success: true } })),
    delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Testing Library configuration
configure({
  asyncUtilTimeout: 15000,
  testIdAttribute: 'data-testid',
  throwSuggestions: false,
});

// Essential DOM mocks
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    media: query,
    matches: false,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Web Crypto API polyfill for jsdom (not provided by jest-environment-jsdom)
if (!window.crypto) {
  const { webcrypto } = require('crypto');
  Object.defineProperty(window, 'crypto', {
    writable: true,
    value: webcrypto,
  });
}

// structuredClone polyfill: jest-environment-jsdom@27 runs in a VM context that
// does not expose Node's global structuredClone, which Chakra UI v3 (via Zag.js)
// relies on at render time. Use V8 structured serialization (handles undefined,
// Maps, Sets, etc.) rather than JSON, which throws on undefined.
if (typeof (global as any).structuredClone === 'undefined') {
  const v8 = require('v8') as typeof import('v8');
  (global as any).structuredClone = <T>(val: T): T =>
    val === undefined ? val : v8.deserialize(v8.serialize(val));
}

// ResizeObserver is used by Chakra v3 components (e.g. positioned overlays) and
// is not implemented by jsdom.
if (typeof (global as any).ResizeObserver === 'undefined') {
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom does not implement PointerEvent, which Ark UI / Zag.js press
// interactions reference (e.g. when driving Chakra v3 Buttons via userEvent).
// Without it, userEvent.click throws "win.PointerEvent is not a constructor".
if (typeof window !== 'undefined' && typeof (window as any).PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId?: number;
    public pointerType?: string;
    public isPrimary?: boolean;
    constructor(type: string, params: any = {}) {
      super(type, params);
      this.pointerId = params.pointerId;
      this.pointerType = params.pointerType;
      this.isPrimary = params.isPrimary;
    }
  }
  (window as any).PointerEvent = PointerEventPolyfill as any;
  (global as any).PointerEvent = PointerEventPolyfill as any;
}

// jsdom does not implement these element methods that Ark UI uses for pointer
// capture during press/drag interactions.
if (typeof window !== 'undefined') {
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!window.HTMLElement.prototype.setPointerCapture) {
    window.HTMLElement.prototype.setPointerCapture = function () {};
  }
  if (!window.HTMLElement.prototype.releasePointerCapture) {
    window.HTMLElement.prototype.releasePointerCapture = function () {};
  }
}

// jsdom does not implement scrollIntoView, which Ark UI menus/selects call.
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

// Basic fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('{}'),
    headers: new Headers(),
  })
) as jest.Mock;

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('React'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});