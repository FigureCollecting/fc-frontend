/**
 * Tests for authentication token mapping
 * These tests ensure that the Backend's accessToken field is correctly
 * mapped to the Frontend's expected token field
 */

// Mock the auth store BEFORE any imports
jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: null,
      setUser: jest.fn(),
      logout: jest.fn(),
      recordActivity: jest.fn()
    }))
  }
}));

describe('Authentication Token Mapping', () => {
  let mockApiInstance: any;
  let loginUser: any;
  let registerUser: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset modules to get fresh imports
    jest.resetModules();

    // Create mock axios instance
    mockApiInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn((success, error) => {
            // Store the interceptor functions for testing
            mockApiInstance.responseInterceptorSuccess = success;
            mockApiInstance.responseInterceptorError = error;
          }),
        },
      },
    };

    // Mock axios module with our instance
    jest.doMock('axios', () => ({
      create: jest.fn(() => mockApiInstance)
    }));

    // Now require the module - it will use our mocked axios
    const apiModule = require('../index');
    loginUser = apiModule.loginUser;
    registerUser = apiModule.registerUser;
  });

  afterEach(() => {
    // Clean up the mock
    jest.dontMock('axios');
  });

  describe('loginUser', () => {
    it('should map Backend accessToken to Frontend token field', async () => {
      // Backend returns accessToken field
      const backendResponse = {
        data: {
          data: {
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            isAdmin: false,
            accessToken: 'jwt-token-here',  // Backend field name
            refreshToken: 'refresh-token-here'
          }
        }
      };

      mockApiInstance.post.mockResolvedValueOnce(backendResponse);

      const result = await loginUser('test@example.com', 'password');

      // Frontend should receive token field mapped from accessToken
      expect(result._id).toBe('user123');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.isAdmin).toBe(false);
      expect(result.token).toBe('jwt-token-here');  // accessToken mapped to token
      expect(result.refreshToken).toBe('refresh-token-here');  // refreshToken preserved
      expect(result.tokenExpiresAt).toBeDefined();  // tokenExpiresAt added

      // Should NOT have accessToken field (mapped to token)
      expect(result).not.toHaveProperty('accessToken');
    });

    it('should handle missing accessToken gracefully', async () => {
      // Backend response without accessToken
      const backendResponse = {
        data: {
          data: {
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            isAdmin: false
            // No accessToken field
          }
        }
      };

      mockApiInstance.post.mockResolvedValueOnce(backendResponse);

      const result = await loginUser('test@example.com', 'password');

      // Should still return user data with undefined token
      expect(result._id).toBe('user123');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.isAdmin).toBe(false);
      expect(result.token).toBeUndefined();  // Token is undefined when accessToken is missing
      expect(result.refreshToken).toBeUndefined();  // refreshToken also undefined
      expect(result.tokenExpiresAt).toBeDefined();  // tokenExpiresAt still added
    });

    it('should handle completely missing response data', async () => {
      // Malformed response - no data property
      const backendResponse = {
        data: null
      };

      mockApiInstance.post.mockResolvedValueOnce(backendResponse);

      const result = await loginUser('test@example.com', 'password');

      // Should return undefined when data is missing
      expect(result).toBeUndefined();
    });
  });

  describe('registerUser', () => {
    it('should map Backend accessToken to Frontend token field', async () => {
      // Backend returns accessToken field
      const backendResponse = {
        data: {
          data: {
            _id: 'newuser123',
            username: 'newuser',
            email: 'new@example.com',
            isAdmin: false,
            accessToken: 'new-jwt-token',  // Backend field name
            refreshToken: 'new-refresh-token'
          }
        }
      };

      mockApiInstance.post.mockResolvedValueOnce(backendResponse);

      const result = await registerUser('newuser', 'new@example.com', 'password');

      // Frontend should receive token field mapped from accessToken
      expect(result._id).toBe('newuser123');
      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@example.com');
      expect(result.isAdmin).toBe(false);
      expect(result.token).toBe('new-jwt-token');  // accessToken mapped to token
      expect(result.refreshToken).toBe('new-refresh-token');  // refreshToken preserved
      expect(result.tokenExpiresAt).toBeDefined();  // tokenExpiresAt added

      // Should NOT have accessToken field (mapped to token)
      expect(result).not.toHaveProperty('accessToken');
    });
  });

  describe('Token Field Consistency', () => {
    it('should ensure axios interceptor uses token field from user store', async () => {
      // Mock useAuthStore to return a user with token field
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: false,
        token: 'stored-jwt-token'  // Frontend uses token field
      };

      // Update the mock to return our user
      const { useAuthStore } = require('../../stores/authStore');
      useAuthStore.getState.mockReturnValue({
        user: mockUser,
        setUser: jest.fn(),
        logout: jest.fn(),
        recordActivity: jest.fn()
      });

      // Verify the interceptor was set up
      expect(mockApiInstance.interceptors.request.use).toHaveBeenCalled();

      // Get the interceptor function and test it
      const interceptorFn = mockApiInstance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };
      const updatedConfig = interceptorFn(config);

      // Should add Bearer token from user.token field
      expect(updatedConfig.headers.Authorization).toBe('Bearer stored-jwt-token');
    });
  });

  describe('Critical Bug Prevention', () => {
    it('should prevent authentication redirect loop by ensuring token is attached', async () => {
      // 1. User logs in successfully
      const loginResponse = {
        data: {
          data: {
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            isAdmin: false,
            accessToken: 'valid-jwt-token'  // Backend sends accessToken
          }
        }
      };

      mockApiInstance.post.mockResolvedValueOnce(loginResponse);

      const user = await loginUser('test@example.com', 'password');

      // 2. Verify user has token field (not accessToken)
      expect(user.token).toBe('valid-jwt-token');
      expect(user.accessToken).toBeUndefined();

      // 3. Simulate making an authenticated API call
      const { useAuthStore } = require('../../stores/authStore');
      useAuthStore.getState.mockReturnValue({
        user: user,  // User object with token field
        setUser: jest.fn(),
        logout: jest.fn(),
        recordActivity: jest.fn()
      });

      // 4. The interceptor should attach the token
      const interceptorFn = mockApiInstance.interceptors.request.use.mock.calls[0][0];
      const config = { headers: {} };
      const updatedConfig = interceptorFn(config);

      // 5. Verify token is attached correctly - THIS IS THE CRITICAL BUG FIX
      expect(updatedConfig.headers.Authorization).toBe('Bearer valid-jwt-token');
      expect(updatedConfig.headers.Authorization).not.toBe('Bearer undefined');
    });
  });
});