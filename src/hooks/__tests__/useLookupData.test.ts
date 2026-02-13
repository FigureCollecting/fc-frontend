/**
 * Tests for useLookupData hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { useLookupData } from '../useLookupData';
import { useAuthStore } from '../../stores/authStore';

const mockedUseAuthStore = useAuthStore as unknown as jest.MockedFunction<typeof useAuthStore>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useLookupData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should return empty arrays and not fetch when no token', () => {
    mockedUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: null })
    );

    const { result } = renderHook(() => useLookupData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.roleTypes).toEqual([]);
    expect(result.current.companies).toEqual([]);
    expect(result.current.artists).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch data when token is available', async () => {
    mockedUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { token: 'test-token' } })
    );

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ _id: '1', name: 'Test' }] }),
    });

    const { result } = renderHook(() => useLookupData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('should handle fetch errors gracefully', async () => {
    mockedUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { token: 'test-token' } })
    );

    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useLookupData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.roleTypes).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('should return empty arrays when API returns no data property', async () => {
    mockedUseAuthStore.mockImplementation((selector: any) =>
      selector({ user: { token: 'test-token' } })
    );

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useLookupData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.roleTypes).toEqual([]);
    expect(result.current.companies).toEqual([]);
    expect(result.current.artists).toEqual([]);
  });
});
