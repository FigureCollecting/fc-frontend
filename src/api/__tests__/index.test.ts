/**
 * Tests for API functions and interceptors
 */
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import * as api from '../index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock auth store
jest.mock('../../stores/authStore');
const mockedUseAuthStore = useAuthStore as unknown as jest.MockedFunction<typeof useAuthStore>;

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('API Module', () => {
  let mockAxiosInstance: any;
  let requestInterceptor: any;
  let responseInterceptor: any;
  let mockApi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
    localStorageMock.clear();
    localStorageMock.removeItem.mockClear();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn().mockResolvedValue({ data: { data: {} } }),
      post: jest.fn().mockResolvedValue({ data: { data: {} } }),
      put: jest.fn().mockResolvedValue({ data: { data: {} } }),
      delete: jest.fn().mockResolvedValue({ data: { data: {} } }),
      interceptors: {
        request: {
          use: jest.fn((handler) => {
            requestInterceptor = handler;
            return 0;
          }),
        },
        response: {
          use: jest.fn((successHandler, errorHandler) => {
            responseInterceptor = { successHandler, errorHandler };
            return 0;
          }),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Default auth store state
    mockedUseAuthStore.getState = jest.fn().mockReturnValue({
      user: null,
      setUser: jest.fn(),
      logout: jest.fn(),
      recordActivity: jest.fn(),
      updateTokens: jest.fn(),
    });

    // Re-import to trigger module initialization
    jest.isolateModules(() => {
      mockApi = require('../index');
    });
  });

  describe('Request Interceptor', () => {
    it('should add auth token to requests when user is logged in', () => {
      mockedUseAuthStore.getState.mockReturnValue({
        user: { token: 'test-token', email: 'test@test.com' },
        setUser: jest.fn(),
        logout: jest.fn(),
      });

      const config = { headers: {} as any };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add auth token when user is not logged in', () => {
      mockedUseAuthStore.getState.mockReturnValue({
        user: null,
        setUser: jest.fn(),
        logout: jest.fn(),
      });

      const config = { headers: {} as any };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should update token when x-new-token header is present', () => {
      const updateTokens = jest.fn();
      mockedUseAuthStore.getState.mockReturnValue({
        user: { token: 'old-token', email: 'test@test.com', id: '1' },
        setUser: jest.fn(),
        logout: jest.fn(),
        recordActivity: jest.fn(),
        updateTokens,
      });

      const response = {
        headers: { 'x-new-token': 'Bearer new-token' },
        data: { success: true },
      };

      const result = responseInterceptor.successHandler(response);

      expect(updateTokens).toHaveBeenCalled();
      expect(result).toBe(response);
    });

    it('should handle 401 errors by logging out and redirecting', async () => {
      const logout = jest.fn();
      mockedUseAuthStore.getState.mockReturnValue({
        user: null, // User with null means no refresh token to try
        setUser: jest.fn(),
        logout,
        recordActivity: jest.fn(),
      });

      const error = {
        response: { status: 401 },
        config: { _retry: false },
      };

      await expect(responseInterceptor.errorHandler(error)).rejects.toEqual(error);

      expect(logout).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth-storage');
      expect(window.location.href).toBe('/login');
    });
  });

  // Note: "API Functions Coverage - Lines 69-93" tests were removed as they were
  // coverage-gaming tests that called non-existent functions (e.g., refreshToken
  // instead of refreshAccessToken). These tests did not provide meaningful
  // boundary or behavior validation.
});
