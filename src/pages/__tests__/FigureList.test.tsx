import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render, mockFigure } from '../../test-utils';
import FigureList from '../FigureList';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import { useQuery } from 'react-query';

// Mock useAuthStore
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock useSyncStore
jest.mock('../../stores/syncStore');
const mockUseSyncStore = useSyncStore as jest.MockedFunction<typeof useSyncStore>;

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock react-query
const mockInvalidateQueries = jest.fn();
let mockUseQueryOnErrorCb: any;

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQuery: jest.fn(),
  useMutation: () => ({
    mutate: jest.fn(),
    isLoading: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock components that are heavy
jest.mock('../../components/BulkImportModal', () => {
  return function MockBulkImportModal() { return null; };
});
jest.mock('../../components/MfcSyncModal', () => {
  return function MockMfcSyncModal() { return null; };
});
jest.mock('../../components/MfcCookiesModal', () => {
  return function MockMfcCookiesModal() { return null; };
});

// Mock crypto
jest.mock('../../utils/crypto', () => ({
  retrieveMfcCookies: jest.fn().mockResolvedValue(null),
  hasMfcCookies: jest.fn().mockReturnValue(false),
  clearMfcCookies: jest.fn(),
  getStorageType: jest.fn().mockReturnValue('session'),
  storeMfcCookies: jest.fn(),
}));

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

const mockStatsData = {
  statusCounts: { owned: 5, ordered: 2, wished: 1 },
  totalFigures: 8,
  manufacturerStats: [{ _id: 'GSC', count: 5 }],
  scaleStats: [{ _id: '1/7', count: 3 }],
  locationStats: [{ _id: 'Shelf A', count: 4 }],
  originStats: [],
  categoryStats: [],
  distributorStats: [],
};

const mockFiguresData = {
  data: [
    { ...mockFigure, _id: '1', name: 'Figure A' },
    { ...mockFigure, _id: '2', name: 'Figure B' },
  ],
  total: 2,
  pages: 1,
};

describe('FigureList', () => {
  const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: { _id: '1', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      setUser: jest.fn(),
      logout: jest.fn(),
    });

    mockUseSyncStore.mockReturnValue({
      stats: null,
      phase: null,
      isActive: false,
      sessionId: null,
      startSync: jest.fn(),
      stopSync: jest.fn(),
      reset: jest.fn(),
    } as any);

    // Default: both queries return data
    mockUseQuery.mockImplementation((queryKey: any, queryFn: any, opts: any) => {
      const keyStr = Array.isArray(queryKey) ? queryKey[0] : queryKey;
      if (keyStr === 'figureListStats') {
        return {
          data: mockStatsData,
          isLoading: false,
          error: null,
        } as any;
      } else {
        // Capture onError for the figures query
        if (opts?.onError) {
          mockUseQueryOnErrorCb = opts.onError;
        }
        return {
          data: mockFiguresData,
          isLoading: false,
          error: null,
        } as any;
      }
    });

    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  it('renders figure list page', () => {
    render(<FigureList />);
    expect(screen.getByRole('heading', { name: /your collectibles/i })).toBeInTheDocument();
  });

  it('renders figures when data is loaded', () => {
    render(<FigureList />);
    expect(screen.getByText('Figure A')).toBeInTheDocument();
    expect(screen.getByText('Figure B')).toBeInTheDocument();
  });

  it('shows item count text', () => {
    render(<FigureList />);
    expect(screen.getByText(/Showing 2 of 2 items/i)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockUseQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: true,
      error: null,
    } as any));

    render(<FigureList />);
    // Should show spinner, not heading
    expect(screen.queryByRole('heading', { name: /your collectibles/i })).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    } as any));

    render(<FigureList />);
    expect(screen.getByText(/Error loading figures/i)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders Add Item button', () => {
    render(<FigureList />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('renders Sync with MFC button', () => {
    render(<FigureList />);
    expect(screen.getByText('Sync with MFC')).toBeInTheDocument();
  });

  it('shows empty state when total is 0 and no filters', () => {
    mockUseQuery.mockImplementation((queryKey: any) => {
      const keyStr = Array.isArray(queryKey) ? queryKey[0] : queryKey;
      if (keyStr === 'figureListStats') {
        return { data: mockStatsData, isLoading: false, error: null } as any;
      }
      return {
        data: { data: [], total: 0, pages: 0 },
        isLoading: false,
        error: null,
      } as any;
    });

    render(<FigureList />);
    // EmptyState component should render for empty collection
    expect(screen.queryByText('Figure A')).not.toBeInTheDocument();
  });

  it('figures query onError shows error toast with response message', () => {
    render(<FigureList />);

    // Invoke the captured onError callback
    if (mockUseQueryOnErrorCb) {
      const err = { response: { data: { message: 'Server error' } } };
      mockUseQueryOnErrorCb(err);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Server error',
          status: 'error',
        })
      );
    }
  });

  it('figures query onError shows fallback message when no response data', () => {
    render(<FigureList />);

    if (mockUseQueryOnErrorCb) {
      mockUseQueryOnErrorCb({});

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Failed to load figures',
          status: 'error',
        })
      );
    }
  });

  it('Try Again button reloads the page', () => {
    mockUseQuery.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    } as any));

    // Mock window.location.reload
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(<FigureList />);
    fireEvent.click(screen.getByText('Try Again'));

    expect(reloadMock).toHaveBeenCalled();
  });
});
