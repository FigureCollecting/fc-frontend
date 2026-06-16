import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { HelmetProvider } from 'react-helmet-async';
import { ColorModeProvider } from './components/ui/color-mode';
import system from './theme';

// Mock QueryClient and Provider for testing
import { QueryClient, QueryClientProvider } from 'react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

const MockQueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const AllProviders = ({ children, initialRoutes = ['/'] }: { 
  children: React.ReactNode, 
  initialRoutes?: string[] 
}) => {
  // Ensure emotion cache is unique for testing
  const emotionCache = createCache({ key: 'custom' });

  return (
    <HelmetProvider>
      <CacheProvider value={emotionCache}>
        <MockQueryClientProvider>
          <ChakraProvider value={system}>
            <ColorModeProvider>
              <MemoryRouter initialEntries={initialRoutes}>
                {children}
              </MemoryRouter>
            </ColorModeProvider>
          </ChakraProvider>
        </MockQueryClientProvider>
      </CacheProvider>
    </HelmetProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    initialRoutes?: string[] 
  }
) => {
  const { initialRoutes, ...renderOptions } = options || {};
  
  // Create wrapper element with providers
  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders initialRoutes={initialRoutes}>
      {children}
    </AllProviders>
  );
  
  // Standard render with wrapper - same as EmptyState
  return render(ui, { 
    wrapper: TestWrapper,
    ...renderOptions 
  });
};

// Enhanced async utilities for React 18 testing
const renderAsync = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    initialRoutes?: string[] 
  }
) => {
  const result = customRender(ui, options);
  await result.findByTestId('app-loaded'); // Assumes app has this attribute when fully loaded
  return result;
};

// Error boundary test helper
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong: {this.state.error?.message}</div>;
    }

    return this.props.children;
  }
}

// Render with error boundary for testing undefined data scenarios
const renderWithErrorBoundary = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { 
    initialRoutes?: string[];
    onError?: (error: Error) => void;
  }
) => {
  const { onError, ...renderOptions } = options || {};
  
  return customRender(
    <TestErrorBoundary onError={onError}>
      {ui}
    </TestErrorBoundary>,
    renderOptions
  );
};

// Mock data exports
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser'
};

export const mockFigure = {
  _id: '1',
  name: 'Test Figure',
  manufacturer: 'Test Company',
  series: 'Test Series',
  scale: '1/8',
  price: 15000,
  mfcLink: 'https://myfigurecollection.net/item/123456',
  imageUrl: 'https://example.com/test.jpg',
  origin: 'Test Series',
  category: 'Scale Figure',
  userId: '1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockStatsData = {
  totalCount: 10,
  statusCounts: { owned: 7, ordered: 2, wished: 1 },
  manufacturerStats: [
    { _id: 'Good Smile Company', count: 5 },
    { _id: 'ALTER', count: 3 },
    { _id: 'Kotobukiya', count: 2 }
  ],
  scaleStats: [
    { _id: '1/8', count: 6 },
    { _id: '1/7', count: 3 },
    { _id: '1/6', count: 1 }
  ],
  originStats: [
    { _id: 'Fate/Grand Order', count: 5 },
    { _id: 'Vocaloid', count: 3 },
    { _id: 'Original', count: 2 }
  ],
  activeStatus: 'owned' as const
};

export const mockPaginatedResponse = {
  success: true,
  count: 4,
  page: 1,
  pages: 1,
  total: 4,
  data: [
    { ...mockFigure, _id: '1', name: 'Figure 1' },
    { ...mockFigure, _id: '2', name: 'Figure 2' },
    { ...mockFigure, _id: '3', name: 'Figure 3' },
    { ...mockFigure, _id: '4', name: 'Figure 4' }
  ]
};

// Export everything from testing library and new utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render, renderAsync, renderWithErrorBoundary, TestErrorBoundary };

// Export new mock utilities for easy access
export * from './test-utils/mocks';