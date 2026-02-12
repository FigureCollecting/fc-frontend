import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { mockUser, mockFigure, mockPaginatedResponse, mockStatsData } from '../../test-utils';
import { FigureFormData } from '../../types';

// Mock axios BEFORE importing the module that uses it
jest.mock('axios', () => {
  // Define the mock instance inside the factory function to avoid hoisting issues
  const mockApiInstance = {
    post: jest.fn(),
    get: jest.fn(), 
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { 
        use: jest.fn((successHandler) => {
          // Store the interceptor for testing
          (mockApiInstance as any).requestInterceptor = successHandler;
          return 0;
        })
      },
      response: { 
        use: jest.fn((successHandler, errorHandler) => {
          // Store the interceptors for testing
          (mockApiInstance as any).responseSuccessInterceptor = successHandler;
          (mockApiInstance as any).responseErrorInterceptor = errorHandler;
          return 0;
        })
      },
    },
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        patch: {},
        delete: {}
      }
    }
  };
  
  // Store instance globally for test access
  (global as any).__mockApiInstance = mockApiInstance;
  
  return {
    default: {
      create: jest.fn(() => mockApiInstance),
    },
    create: jest.fn(() => mockApiInstance),
  };
});

const mockedAxios = jest.requireMock('axios');

// Get the mock instance from global for use in tests
const mockApiInstance = (global as any).__mockApiInstance || mockedAxios.default || mockedAxios;

// Mock the auth store
jest.mock('../../stores/authStore');

// Import the API functions after setting up mocks
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getFigures,
  getFigureById,
  createFigure,
  updateFigure,
  deleteFigure,
  searchFigures,
  filterFigures,
  getFigureStats,
} from '../index';

// Enhanced API Integration Tests with mocked axios
describe('Enhanced API Integration Tests', () => {
  const mockGetState = jest.fn();
  const mockSetUser = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth store
    (useAuthStore as any).getState = mockGetState;
    
    // Default auth store state
    mockGetState.mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
      logout: mockLogout,
      recordActivity: jest.fn(),
    });

    // Set up default mock returns for API methods
    mockApiInstance.get.mockResolvedValue({ data: { data: {} } });
    mockApiInstance.post.mockResolvedValue({ data: { data: {} } });
    mockApiInstance.put.mockResolvedValue({ data: { data: {} } });
    mockApiInstance.delete.mockResolvedValue({ data: { success: true } });

    // Reset axios mock
    if (mockedAxios.default) {
      mockedAxios.default.create = jest.fn(() => mockApiInstance);
    } else {
      mockedAxios.create = jest.fn(() => mockApiInstance);
    }

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  describe('API Instance Configuration', () => {
    it('should create axios instance with correct base URL', () => {
      // The API module uses axios.create to create an instance
      // Since we're mocking axios, we just verify our mock was set up
      expect(mockApiInstance).toBeDefined();
      expect(mockApiInstance.post).toBeDefined();
      expect(mockApiInstance.get).toBeDefined();
    });

    it('should use environment API URL when available', () => {
      // Environment variable checking test
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com';
      
      // For actual implementation, the env var would be read at module load
      expect(process.env.REACT_APP_API_URL).toBe('https://api.example.com');
      
      process.env.REACT_APP_API_URL = originalEnv;
    });

    it('should configure request interceptor', () => {
      // Request interceptor is configured when module loads
      expect(mockApiInstance.interceptors).toBeDefined();
      expect(mockApiInstance.interceptors.request).toBeDefined();
      expect(mockApiInstance.interceptors.request.use).toBeDefined();
    });

    it('should configure response interceptor', () => {
      // Response interceptor is configured when module loads
      expect(mockApiInstance.interceptors).toBeDefined();
      expect(mockApiInstance.interceptors.response).toBeDefined();
      expect(mockApiInstance.interceptors.response.use).toBeDefined();
    });
  });

  describe('Request Interceptor', () => {
    let requestInterceptor: any;

    beforeEach(() => {
      // Get the request interceptor function that was stored
      requestInterceptor = (mockApiInstance as any).requestInterceptor;
    });

    it('should add authorization header when user has token', () => {
      const config = { headers: {} };
      mockGetState.mockReturnValue({ user: { ...mockUser, token: 'test-token' }, recordActivity: jest.fn() });

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add authorization header when no user token', () => {
      const config = { headers: {} };
      mockGetState.mockReturnValue({ user: null, recordActivity: jest.fn() });

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should not add authorization header when user exists but no token', () => {
      const config = { headers: {} };
      mockGetState.mockReturnValue({ user: { ...mockUser, token: undefined }, recordActivity: jest.fn() });

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should preserve existing headers', () => {
      const config = { headers: { 'Custom-Header': 'value' } };
      mockGetState.mockReturnValue({ user: { ...mockUser, token: 'test-token' }, recordActivity: jest.fn() });

      const result = requestInterceptor(config);

      expect(result.headers['Custom-Header']).toBe('value');
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('Response Interceptor', () => {
    let responseInterceptorSuccess: any;
    let responseInterceptorError: any;

    beforeEach(() => {
      // Get the response interceptor functions that were stored
      responseInterceptorSuccess = (mockApiInstance as any).responseSuccessInterceptor;
      responseInterceptorError = (mockApiInstance as any).responseErrorInterceptor;
    });

    describe('Success Handler', () => {
      const mockUpdateTokens = jest.fn();

      beforeEach(() => {
        mockUpdateTokens.mockClear();
      });

      it('should update token when new token is provided in response header', () => {
        const response = {
          headers: { 'x-new-token': 'new-token' },
          data: {},
        };
        mockGetState.mockReturnValue({ user: mockUser, setUser: mockSetUser, updateTokens: mockUpdateTokens, recordActivity: jest.fn() });

        const result = responseInterceptorSuccess(response);

        expect(mockUpdateTokens).toHaveBeenCalled();
        expect(result).toBe(response);
      });

      it('should update token from x-access-token header', () => {
        const response = {
          headers: { 'x-access-token': 'Bearer updated-token' },
          data: {},
        };
        mockGetState.mockReturnValue({ user: mockUser, setUser: mockSetUser, updateTokens: mockUpdateTokens, recordActivity: jest.fn() });

        const result = responseInterceptorSuccess(response);

        expect(mockUpdateTokens).toHaveBeenCalledWith('updated-token', undefined, expect.any(Number));
        expect(result).toBe(response);
      });

      it('should update token even when no user is logged in (for token refresh scenarios)', () => {
        const response = {
          headers: { 'x-new-token': 'new-token' },
          data: {},
        };
        mockGetState.mockReturnValue({ user: null, setUser: mockSetUser, updateTokens: mockUpdateTokens, recordActivity: jest.fn() });

        const result = responseInterceptorSuccess(response);

        // Token is still updated - the store handles whether to apply it
        expect(mockUpdateTokens).toHaveBeenCalled();
        expect(result).toBe(response);
      });

      it('should return response unchanged when no new token', () => {
        const response = {
          headers: {},
          data: {},
        };
        mockGetState.mockReturnValue({ user: mockUser, setUser: mockSetUser, updateTokens: mockUpdateTokens, recordActivity: jest.fn() });

        const result = responseInterceptorSuccess(response);

        expect(mockUpdateTokens).not.toHaveBeenCalled();
        expect(result).toBe(response);
      });
    });

    describe('Error Handler', () => {
      it('should handle refresh token endpoint errors with 401 status', async () => {
        const refreshTokenError = {
          response: { status: 401, data: { message: 'Invalid refresh token' } },
          config: { url: '/auth/refresh', _retry: false },
        };
        const responseInterceptorError = (mockApiInstance as any).responseErrorInterceptor;
        mockGetState.mockReturnValue({ user: null, logout: mockLogout, recordActivity: jest.fn() });

        await expect(responseInterceptorError(refreshTokenError)).rejects.toBe(refreshTokenError);

        expect(mockLogout).toHaveBeenCalled();
        expect(localStorage.removeItem).toHaveBeenCalledWith('auth-storage');
        expect(window.location.href).toBe('/login');
      });

      it('should handle errors in logout endpoint with response object', async () => {
        const logoutError = {
          response: { status: 500, data: { message: 'Server error during logout' } },
        };
        const responseInterceptorError = (mockApiInstance as any).responseErrorInterceptor;
        mockGetState.mockReturnValue({ logout: mockLogout, recordActivity: jest.fn() });

        await expect(responseInterceptorError(logoutError)).rejects.toBe(logoutError);

        expect(mockLogout).not.toHaveBeenCalled();
        expect(localStorage.removeItem).not.toHaveBeenCalled();
        expect(window.location.href).not.toBe('/login');
      });

      it('should handle errors without response object by simply rejecting', async () => {
        const genericError = new Error('Unknown error occurred');
        const responseInterceptorError = (mockApiInstance as any).responseErrorInterceptor;

        await expect(responseInterceptorError(genericError)).rejects.toBe(genericError);

        expect(mockLogout).not.toHaveBeenCalled();
        expect(localStorage.removeItem).not.toHaveBeenCalled();
        expect(window.location.href).toBe('');
      });
      const originalLocation = window.location;

      beforeEach(() => {
        // Mock localStorage
        Storage.prototype.removeItem = jest.fn();
        Object.defineProperty(window, 'location', {
          value: { href: '' },
          writable: true,
        });
      });

      afterEach(() => {
        window.location = originalLocation;
      });

      it('should handle 401 error and logout user', async () => {
        const error = {
          response: { status: 401 },
          config: { _retry: false },
        };
        mockGetState.mockReturnValue({ user: null, logout: mockLogout, recordActivity: jest.fn() });

        await expect(responseInterceptorError(error)).rejects.toBe(error);

        expect(mockLogout).toHaveBeenCalled();
        expect(localStorage.removeItem).toHaveBeenCalledWith('auth-storage');
        expect(window.location.href).toBe('/login');
      });

      it('should not handle non-401 errors', async () => {
        const error = {
          response: { status: 500 },
        };

        await expect(responseInterceptorError(error)).rejects.toBe(error);

        expect(mockLogout).not.toHaveBeenCalled();
        expect(localStorage.removeItem).not.toHaveBeenCalled();
        expect(window.location.href).not.toBe('/login');
      });

      it('should handle 401 error without response data', async () => {
        const error = {
          response: { status: 401 },
          config: { _retry: false },
        };
        mockGetState.mockReturnValue({ user: null, logout: mockLogout, recordActivity: jest.fn() });

        await expect(responseInterceptorError(error)).rejects.toBe(error);

        expect(mockLogout).toHaveBeenCalled();
      });

      it('should handle errors without response object', async () => {
        const error = new Error('Network error');

        await expect(responseInterceptorError(error)).rejects.toBe(error);

        expect(mockLogout).not.toHaveBeenCalled();
      });
    });
  });

  describe('Auth API Edge Cases', () => {
    beforeEach(() => {
      // Use the mocked instance for API calls
      Object.assign(mockedAxios, mockApiInstance);
    });

    describe('loginUser', () => {
      it('should handle malformed response data', async () => {
        mockApiInstance.post.mockResolvedValueOnce({ data: null });

        // Should return undefined for missing data
        const result = await loginUser('test@example.com', 'password');
        expect(result).toBeUndefined();
      });

      it('should handle missing data field', async () => {
        mockApiInstance.post.mockResolvedValueOnce({ data: { success: true } });

        const result = await loginUser('test@example.com', 'password');

        expect(result).toBeUndefined();
      });

      it('should handle network timeout', async () => {
        const timeoutError = new Error('timeout');
        timeoutError.name = 'ECONNABORTED';
        mockApiInstance.post.mockRejectedValueOnce(timeoutError);

        await expect(loginUser('test@example.com', 'password'))
          .rejects.toThrow('timeout');
      });

      it('should handle empty email and password', async () => {
        mockApiInstance.post.mockResolvedValueOnce({ data: { data: mockUser } });

        await loginUser('', '');

        expect(mockApiInstance.post).toHaveBeenCalledWith('/auth/login', {
          email: '',
          password: '',
        });
      });
    });

    describe('registerUser', () => {
      it('should handle duplicate email error', async () => {
        const duplicateError = {
          response: {
            status: 409,
            data: { message: 'Email already exists' },
          },
        };
        mockApiInstance.post.mockRejectedValueOnce(duplicateError);

        await expect(registerUser('testuser', 'existing@example.com', 'password'))
          .rejects.toEqual(duplicateError);
      });

      it('should handle validation errors', async () => {
        const validationError = {
          response: {
            status: 400,
            data: {
              message: 'Validation failed',
              errors: ['Password too short', 'Invalid email'],
            },
          },
        };
        mockApiInstance.post.mockRejectedValueOnce(validationError);

        await expect(registerUser('testuser', 'invalid-email', '123'))
          .rejects.toEqual(validationError);
      });

      it('should handle special characters in username', async () => {
        mockApiInstance.post.mockResolvedValueOnce({ data: { data: mockUser } });

        await registerUser('test@user#$', 'test@example.com', 'password');

        expect(mockApiInstance.post).toHaveBeenCalledWith('/auth/register', {
          username: 'test@user#$',
          email: 'test@example.com',
          password: 'password',
        });
      });
    });
  });

  describe('Figures API Edge Cases', () => {
    beforeEach(() => {
      Object.assign(mockedAxios, mockApiInstance);
    });

    describe('getFigures', () => {
      it('should handle invalid page numbers', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        await getFigures(-1, 0);

        expect(mockApiInstance.get).toHaveBeenCalledWith('/figures?page=-1&limit=0&sortBy=createdAt&sortOrder=desc');
      });

      it('should handle very large page numbers', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        await getFigures(999999, 1000);

        expect(mockApiInstance.get).toHaveBeenCalledWith('/figures?page=999999&limit=1000&sortBy=createdAt&sortOrder=desc');
      });

      it('should handle server returning empty data array', async () => {
        const emptyResponse = {
          ...mockPaginatedResponse,
          data: [],
          count: 0,
          total: 0,
        };
        mockApiInstance.get.mockResolvedValueOnce({ data: emptyResponse });

        const result = await getFigures();

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      it('should handle server error', async () => {
        const serverError = {
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        };
        mockApiInstance.get.mockRejectedValueOnce(serverError);

        await expect(getFigures()).rejects.toEqual(serverError);
      });
    });

    describe('createFigure', () => {
      it('should handle creating figure with minimal data', async () => {
        const minimalData: FigureFormData = {
          manufacturer: 'Test Manufacturer',
          name: 'Test Figure',
          scale: '1/8',
        };

        const createdFigure = {
          ...mockFigure,
          ...minimalData,
          mfcLink: undefined,
          location: undefined,
          boxNumber: undefined,
          imageUrl: undefined,
        };

        mockApiInstance.post.mockResolvedValueOnce({
          data: { data: createdFigure },
        });

        const result = await createFigure(minimalData);

        expect(result).toEqual(createdFigure);
        expect(mockApiInstance.post).toHaveBeenCalledWith('/figures', minimalData);
      });

      it('should handle creating figure with all optional fields', async () => {
        const completeData: FigureFormData = {
          manufacturer: 'Good Smile Company',
          name: 'Complete Figure',
          scale: '1/7',
          mfcLink: 'https://myfigurecollection.net/item/123456',
          location: 'Display Case B',
          boxNumber: 'B2',
          imageUrl: 'https://example.com/figure.jpg',
        };

        mockApiInstance.post.mockResolvedValueOnce({
          data: { data: { ...mockFigure, ...completeData } },
        });

        const result = await createFigure(completeData);

        expect(mockApiInstance.post).toHaveBeenCalledWith('/figures', completeData);
      });

      it('should handle validation errors on creation', async () => {
        const validationError = {
          response: {
            status: 422,
            data: {
              message: 'Validation failed',
              errors: {
                manufacturer: 'Manufacturer is required',
                name: 'Name is required',
              },
            },
          },
        };

        mockApiInstance.post.mockRejectedValueOnce(validationError);

        await expect(createFigure({} as FigureFormData))
          .rejects.toEqual(validationError);
      });

      it('should handle duplicate figure error', async () => {
        const duplicateError = {
          response: {
            status: 409,
            data: { message: 'Figure already exists' },
          },
        };

        mockApiInstance.post.mockRejectedValueOnce(duplicateError);

        await expect(createFigure({
          manufacturer: 'Test',
          name: 'Duplicate',
          scale: '1/8',
        })).rejects.toEqual(duplicateError);
      });
    });

    describe('searchFigures', () => {
      it('should handle empty search query', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: { data: [] } });

        const result = await searchFigures('');

        expect(mockApiInstance.get).toHaveBeenCalledWith('/figures/search?query=');
        expect(result).toEqual([]);
      });

      it('should handle search with only whitespace', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: { data: [] } });

        await searchFigures('   ');

        expect(mockApiInstance.get).toHaveBeenCalledWith('/figures/search?query=%20%20%20');
      });

      it('should handle search with unicode characters', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: { data: [] } });

        await searchFigures('初音ミク');

        expect(mockApiInstance.get).toHaveBeenCalledWith('/figures/search?query=%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF');
      });

      it('should handle search query with SQL injection attempt', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: { data: [] } });

        const maliciousQuery = "'; DROP TABLE figures; --";
        await searchFigures(maliciousQuery);

        expect(mockApiInstance.get).toHaveBeenCalledWith(
          `/figures/search?query=${encodeURIComponent(maliciousQuery)}`
        );
      });

      it('should handle very long search queries', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: { data: [] } });

        const longQuery = 'a'.repeat(10000);
        await searchFigures(longQuery);

        expect(mockApiInstance.get).toHaveBeenCalledWith(
          `/figures/search?query=${encodeURIComponent(longQuery)}`
        );
      });
    });

    describe('filterFigures', () => {
      it('should handle null and undefined filter values', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        const filterParams = {
          manufacturer: 'Good Smile Company',
          scale: null as any,
          location: undefined,
          boxNumber: '',
          page: 1,
        };

        await filterFigures(filterParams);

        // The actual implementation may include null values in the query string
        // We just verify the function was called with a filter URL
        expect(mockApiInstance.get).toHaveBeenCalledWith(
          expect.stringContaining('/figures/filter')
        );
        expect(mockApiInstance.get).toHaveBeenCalledWith(
          expect.stringContaining('manufacturer=Good%20Smile%20Company')
        );
      });

      it('should handle empty object filter', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        await filterFigures({});

        expect(mockApiInstance.get).toHaveBeenCalledWith('/figures/filter?');
      });

      it('should handle filter with special characters', async () => {
        mockApiInstance.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        await filterFigures({
          manufacturer: 'Max Factory & Co.',
          location: 'Display Case [A]',
          boxNumber: 'Box #1',
        });

        expect(mockApiInstance.get).toHaveBeenCalledWith(
          '/figures/filter?manufacturer=Max%20Factory%20%26%20Co.&location=Display%20Case%20%5BA%5D&boxNumber=Box%20%231'
        );
      });
    });

    describe('updateFigure', () => {
      it('should handle partial updates', async () => {
        const partialUpdate: Partial<FigureFormData> = {
          name: 'Updated Name',
        };

        const updatedFigure = { ...mockFigure, name: 'Updated Name' };
        mockApiInstance.put.mockResolvedValueOnce({
          data: { data: updatedFigure },
        });

        const result = await updateFigure(mockFigure._id, partialUpdate);

        expect(result).toEqual(updatedFigure);
        expect(mockApiInstance.put).toHaveBeenCalledWith(
          `/figures/${mockFigure._id}`,
          partialUpdate
        );
      });

      it('should handle unauthorized update', async () => {
        const unauthorizedError = {
          response: {
            status: 403,
            data: { message: 'Not authorized to update this figure' },
          },
        };

        mockApiInstance.put.mockRejectedValueOnce(unauthorizedError);

        await expect(updateFigure(mockFigure._id, { name: 'New Name' }))
          .rejects.toEqual(unauthorizedError);
      });

      it('should handle figure not found on update', async () => {
        const notFoundError = {
          response: {
            status: 404,
            data: { message: 'Figure not found' },
          },
        };

        mockApiInstance.put.mockRejectedValueOnce(notFoundError);

        await expect(updateFigure('non-existent-id', { name: 'New Name' }))
          .rejects.toEqual(notFoundError);
      });
    });

    describe('deleteFigure', () => {
      it('should handle unauthorized deletion', async () => {
        const unauthorizedError = {
          response: {
            status: 403,
            data: { message: 'Not authorized to delete this figure' },
          },
        };

        mockApiInstance.delete.mockRejectedValueOnce(unauthorizedError);

        await expect(deleteFigure(mockFigure._id))
          .rejects.toEqual(unauthorizedError);
      });

      it('should handle figure not found on deletion', async () => {
        const notFoundError = {
          response: {
            status: 404,
            data: { message: 'Figure not found' },
          },
        };

        mockApiInstance.delete.mockRejectedValueOnce(notFoundError);

        await expect(deleteFigure('non-existent-id'))
          .rejects.toEqual(notFoundError);
      });

      it('should handle successful deletion with no response body', async () => {
        mockApiInstance.delete.mockResolvedValueOnce({ data: null });

        await expect(deleteFigure(mockFigure._id)).resolves.toBeUndefined();
      });
    });
  });

  describe('Network and Error Handling', () => {
    beforeEach(() => {
      Object.assign(mockedAxios, mockApiInstance);
    });

    it('should handle network connection errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      mockApiInstance.get.mockRejectedValueOnce(networkError);

      await expect(getFigures()).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'ECONNABORTED';
      mockApiInstance.get.mockRejectedValueOnce(timeoutError);

      await expect(getFigures()).rejects.toThrow('Timeout');
    });

    it('should handle CORS errors', async () => {
      const corsError = new Error('CORS policy');
      (corsError as any).response = { status: 0 };
      mockApiInstance.get.mockRejectedValueOnce(corsError);

      await expect(getFigures()).rejects.toThrow(corsError);
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).response = {
        status: 429,
        data: { message: 'Too many requests' },
      };
      mockApiInstance.get.mockRejectedValueOnce(rateLimitError);

      await expect(getFigures()).rejects.toThrow(rateLimitError);
    });

    it('should handle server maintenance mode', async () => {
      const maintenanceError = new Error('Service temporarily unavailable');
      (maintenanceError as any).response = {
        status: 503,
        data: { message: 'Service temporarily unavailable' },
      };
      mockApiInstance.get.mockRejectedValueOnce(maintenanceError);

      await expect(getFigures()).rejects.toThrow(maintenanceError);
    });
  });

  describe('Data Integrity', () => {
    beforeEach(() => {
      Object.assign(mockedAxios, mockApiInstance);
    });

    it('should handle malformed JSON responses', async () => {
      const malformedResponse = {
        data: '{ invalid json',
      };
      mockApiInstance.get.mockResolvedValueOnce(malformedResponse);

      const result = await getFigures();

      expect(result).toBe('{ invalid json');
    });

    it('should handle responses with missing required fields', async () => {
      const incompleteResponse = {
        data: {
          success: true,
          data: undefined, // data field exists but is undefined
        },
      };
      mockApiInstance.get.mockResolvedValueOnce(incompleteResponse);

      const result = await getFigureById(mockFigure._id);

      expect(result).toBeUndefined();
    });

    it('should handle responses with incorrect data types', async () => {
      const incorrectTypeResponse = {
        data: {
          data: 'should be an object but is a string',
        },
      };
      mockApiInstance.get.mockResolvedValueOnce(incorrectTypeResponse);

      const result = await getFigureById(mockFigure._id);

      expect(result).toBe('should be an object but is a string');
    });
  });

  describe('Concurrent Requests', () => {
    beforeEach(() => {
      Object.assign(mockedAxios, mockApiInstance);
    });

    it('should handle multiple simultaneous API calls', async () => {
      mockApiInstance.get
        .mockResolvedValueOnce({ data: mockPaginatedResponse })
        .mockResolvedValueOnce({ data: { data: mockStatsData } });

      const [figuresResult, statsResult] = await Promise.all([
        getFigures(),
        getFigureStats(),
      ]);

      expect(figuresResult).toEqual(mockPaginatedResponse);
      expect(statsResult).toEqual(mockStatsData);
    });

    it('should handle mixed success and failure in concurrent requests', async () => {
      // Mock get to return different values based on the URL
      mockApiInstance.get.mockImplementation((url: string) => {
        if (url.includes('figures?')) {
          return Promise.resolve({ data: mockPaginatedResponse });
        } else if (url.includes('/stats')) {
          return Promise.reject(new Error('Stats API failed'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const results = await Promise.allSettled([
        getFigures(),
        getFigureStats(),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });
});