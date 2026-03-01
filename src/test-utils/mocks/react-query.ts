/**
 * React Query Mock Utilities
 * Direct data returns without state simulation
 */

interface MockQueryData {
  [key: string]: any;
}

const mockQueryData: MockQueryData = {
  figures: {
    success: true,
    data: [
      { _id: '1', name: 'Test Figure 1', manufacturer: 'Test Company' },
      { _id: '2', name: 'Test Figure 2', manufacturer: 'ALTER' },
    ],
    count: 2,
    page: 1,
    pages: 1,
    total: 2,
  },
  dashboardStats: {
    totalCount: 10,
    manufacturerStats: [
      { _id: 'Good Smile Company', count: 5 },
      { _id: 'ALTER', count: 3 },
    ],
    scaleStats: [
      { _id: '1/8', count: 6 },
      { _id: '1/7', count: 3 },
    ],
    originStats: [
      { _id: 'Fate/Grand Order', count: 5 },
      { _id: 'Vocaloid', count: 3 },
    ],
  },
};

export const mockUseQuery = (queryKey: any, queryFn?: any, options?: any) => {
  // Extract key from different query formats
  const key = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  return {
    data: mockQueryData[key] || {},
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
    refetch: jest.fn(() => Promise.resolve({ data: mockQueryData[key] || {} })),
  };
};

export const mockUseMutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(() => Promise.resolve({})),
  isLoading: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: jest.fn(),
});

export const mockUseQueryClient = () => ({
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
  clear: jest.fn(),
});

export const setMockQueryData = (key: string, data: any) => {
  mockQueryData[key] = data;
};

export const clearMockQueryData = () => {
  Object.keys(mockQueryData).forEach(key => delete mockQueryData[key]);
};