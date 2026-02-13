import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { Figure, FigureFormData, PaginatedResponse, SearchResult, StatsData, SystemConfig, User, BulkImportPreviewResponse, BulkImportExecuteResponse } from '../types';
import { createLogger } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const logger = createLogger('API');

// DEBUGGING: Log the API URL being used
logger.info('API_URL configured as:', API_URL);
logger.info('Environment:', process.env.NODE_ENV);
logger.verbose('Full REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Add auth token to requests
api.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle response errors and token expiration
api.interceptors.response.use(
  (response) => {
    // Record activity on successful API calls
    const { recordActivity } = useAuthStore.getState();
    recordActivity();

    // Check if we got a new token in response headers
    const newToken = response.headers['x-new-token'] || response.headers['x-access-token'];
    if (newToken) {
      const { updateTokens } = useAuthStore.getState();
      const tokenExpiresAt = Date.now() + (14 * 60 * 1000);
      updateTokens(newToken.replace('Bearer ', ''), undefined, tokenExpiresAt);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { user, logout, updateTokens } = useAuthStore.getState();

    // Handle 401 Unauthorized (expired/invalid token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh requests themselves
      if (originalRequest.url?.includes('/auth/refresh')) {
        logger.warn('Refresh token invalid, logging out');
        logout();
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Try to refresh the token
      if (user?.refreshToken) {
        originalRequest._retry = true;

        try {
          // If already refreshing, wait for that to complete
          if (isRefreshing && refreshPromise) {
            const newToken = await refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }

          // Start refresh
          isRefreshing = true;
          logger.verbose('Token expired, attempting refresh...');

          refreshPromise = api.post('/auth/refresh', { refreshToken: user.refreshToken })
            .then(response => {
              const data = response.data.data;
              const newToken = data.accessToken || data.token;
              const tokenExpiresAt = Date.now() + (14 * 60 * 1000);

              updateTokens(newToken, data.refreshToken, tokenExpiresAt);
              logger.info('Token refreshed successfully');
              return newToken;
            });

          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);

        } catch (refreshError) {
          logger.error('Token refresh failed, logging out');
          logout();
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      } else {
        // No refresh token, just logout
        logout();
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Handle 502/503/504 (backend unavailable) - log but don't redirect
    if (!error.response && user?.token) {
      logger.warn('Network error detected while authenticated - backend may be unavailable');
    } else if ([502, 503, 504].includes(error.response?.status) && user?.token) {
      logger.warn(`Backend unavailable (${error.response.status}) - user may need to re-authenticate`);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const loginUser = async (email: string, password: string): Promise<User> => {
  logger.verbose('Attempting login to:', API_URL + '/auth/login');
  logger.verbose('Login payload:', { email, password: '***hidden***' }); // NOSONAR '***hidden***' is a placeholder string for logging, not a real password

  const response = await api.post('/auth/login', { email, password });
  logger.verbose('Login response received:', response.data);

  const userData = response.data?.data;

  // Handle missing or malformed response data
  if (!userData) {
    return undefined as any;  // Return undefined for missing data
  }

  // Map accessToken to token for frontend compatibility
  // Calculate token expiry (default 15 min, but we refresh on activity)
  const tokenExpiresAt = Date.now() + (14 * 60 * 1000); // 14 min (refresh before 15 min expiry)

  return {
    _id: userData._id,
    username: userData.username,
    email: userData.email,
    isAdmin: userData.isAdmin,
    token: userData.accessToken,
    refreshToken: userData.refreshToken,
    tokenExpiresAt,
  };
};

export const registerUser = async (username: string, email: string, password: string): Promise<User> => {
  const response = await api.post('/auth/register', { username, email, password });
  const userData = response.data?.data;

  // Handle missing or malformed response data
  if (!userData) {
    return undefined as any;  // Return undefined for missing data
  }

  // Map accessToken to token for frontend compatibility
  const tokenExpiresAt = Date.now() + (14 * 60 * 1000);

  return {
    _id: userData._id,
    username: userData.username,
    email: userData.email,
    isAdmin: userData.isAdmin,
    token: userData.accessToken,
    refreshToken: userData.refreshToken,
    tokenExpiresAt,
  };
};

export const refreshAccessToken = async (currentRefreshToken: string): Promise<{
  token: string;
  refreshToken?: string;
  tokenExpiresAt: number;
}> => {
  const response = await api.post('/auth/refresh', { refreshToken: currentRefreshToken });
  const data = response.data.data;

  // Calculate new expiry
  const tokenExpiresAt = Date.now() + (14 * 60 * 1000);

  return {
    token: data.accessToken || data.token,
    refreshToken: data.refreshToken, // Backend may rotate refresh token
    tokenExpiresAt,
  };
};

export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const logoutAllSessions = async (): Promise<void> => {
  await api.post('/auth/logout-all');
};

export const getUserSessions = async (): Promise<any[]> => {
  const response = await api.get('/auth/sessions');
  return response.data.data;
};

export const getUserProfile = async (): Promise<User> => {
  const response = await api.get('/auth/profile');
  return response.data.data;
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.put('/auth/profile', userData);
  return response.data.data;
};

// Figures API
export const getFigures = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  status?: 'owned' | 'ordered' | 'wished'
): Promise<PaginatedResponse<Figure>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });
  if (status) {
    params.append('status', status);
  }
  const response = await api.get(`/figures?${params.toString()}`);
  return response.data;
};

export const getFigureById = async (id: string): Promise<Figure> => {
  const response = await api.get(`/figures/${id}`);
  return response.data.data;
};

export const createFigure = async (figureData: FigureFormData): Promise<Figure> => {
  const response = await api.post('/figures', figureData);
  return response.data.data;
};

export const updateFigure = async (id: string, figureData: FigureFormData): Promise<Figure> => {
  const response = await api.put(`/figures/${id}`, figureData);
  return response.data.data;
};

export const deleteFigure = async (id: string): Promise<void> => {
  await api.delete(`/figures/${id}`);
};

export const searchFigures = async (query: string): Promise<SearchResult[]> => {
  const response = await api.get(`/figures/search?query=${encodeURIComponent(query)}`);
  return response.data.data;
};

export const filterFigures = async (
  params: {
    manufacturer?: string;
    distributor?: string;
    scale?: string;
    location?: string;
    origin?: string;
    category?: string;
    boxNumber?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: 'owned' | 'ordered' | 'wished';
  }
): Promise<PaginatedResponse<Figure>> => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  const response = await api.get(`/figures/filter?${queryString}`);
  return response.data;
};

export const getFigureStats = async (status?: 'owned' | 'ordered' | 'wished'): Promise<StatsData> => {
  const params = status ? { status } : {};
  const response = await api.get('/figures/stats', { params });
  return response.data.data;
};

// Public Config API (no auth required)
export const getPublicConfig = async (key: string): Promise<SystemConfig | null> => {
  try {
    const response = await api.get(`/config/${key}`);
    return response.data.data;
  } catch (error) {
    // Return null if config not found (404) or any other error
    logger.warn(`Failed to fetch public config '${key}':`, error);
    return null;
  }
};

// Bulk Import API
export const previewBulkImport = async (csvContent: string): Promise<BulkImportPreviewResponse> => {
  const response = await api.post('/figures/bulk-import/preview', { csvContent });
  return response.data;
};

export const executeBulkImport = async (csvContent: string, skipDuplicates = true): Promise<BulkImportExecuteResponse> => {
  const response = await api.post('/figures/bulk-import', { csvContent, skipDuplicates });
  return response.data;
};
