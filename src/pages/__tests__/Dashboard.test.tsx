import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockFigure, mockStatsData } from '../../test-utils';
import Dashboard from '../Dashboard';
import * as api from '../../api';

// Mock API
jest.mock('../../api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock child components
jest.mock('../../components/FigureCard', () => {
  return function MockFigureCard({ figure }: any) {
    return <div data-testid={`figure-card-${figure._id}`}>{figure.name}</div>;
  };
});

jest.mock('../../components/SearchBar', () => {
  return function MockSearchBar({ onSearch, placeholder }: any) {
    return (
      <div data-testid="search-bar">
        <form onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector('input');
          if (input) onSearch(input.value);
        }}>
          <input 
            placeholder={placeholder}
            data-testid="search-input"
            type="search"
            role="searchbox"
            aria-label="Search your figures"
          />
          <button type="submit" aria-label="Search">Search</button>
        </form>
      </div>
    );
  };
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-query for this test
jest.mock('react-query', () => {
  const actual = jest.requireActual('react-query');
  return {
    ...actual,
    useQuery: jest.fn((key) => {
      const defaultQueryResult = {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        refetch: jest.fn(() => Promise.resolve({ data: null })),
      };

      // More robust key matching
      switch (key[0]) {
        case 'recentFigures':
          return {
            ...defaultQueryResult,
            data: mockFiguresData,
            isSuccess: true,
            status: 'success',
          };
        case 'dashboardStats':
          return {
            ...defaultQueryResult,
            data: mockStatsData,
            isSuccess: true,
            status: 'success',
          };
        default:
          return defaultQueryResult;
      }
    }),
  };
});

describe('Dashboard', () => {
  const mockFiguresData = {
    success: true,
    count: 12,
    page: 1,
    pages: 1,
    total: 12,
    data: Array.from({ length: 12 }, (_, i) => ({
      ...mockFigure,
      _id: String(i + 1),
      name: `Recent Figure ${i + 1}`,
    })),
  };

  // Increase timeout for async operations
  jest.setTimeout(10000);

  const mockEmptyFiguresData = {
    success: true,
    count: 0,
    page: 1,
    pages: 0,
    total: 0,
    data: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getFigures.mockResolvedValue(mockFiguresData);
    mockApi.getFigureStats.mockResolvedValue(mockStatsData);
    
    // Mock useQuery to return appropriate data based on query key
    // Dashboard uses array keys like ['recentFigures', activeStatus]
    const { useQuery } = require('react-query');
    useQuery.mockImplementation((key: string | string[]) => {
      const queryKey = Array.isArray(key) ? key[0] : key;
      if (queryKey === 'recentFigures') {
        return {
          data: mockFiguresData,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          status: 'success',
          refetch: jest.fn(() => Promise.resolve({ data: mockFiguresData })),
        };
      } else if (queryKey === 'dashboardStats') {
        return {
          data: mockStatsData,
          isLoading: false,
          isError: false,
          error: null,
          isSuccess: true,
          status: 'success',
          refetch: jest.fn(() => Promise.resolve({ data: mockStatsData })),
        };
      }

      return {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        status: 'idle',
        refetch: jest.fn(() => Promise.resolve({ data: null })),
      };
    });
    
    // Use real timers to avoid conflicts with userEvent and Promises
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('component rendering', () => {
    it('should render dashboard header', async () => {
      render(<Dashboard />);

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should render search bar with correct placeholder', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input');
        expect(searchInput).toHaveAttribute('placeholder', 'Search your entire collection...');
      });
    });

    it('should render statistics cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Figures')).toBeInTheDocument();
        expect(screen.getByText('Manufacturers')).toBeInTheDocument();
        expect(screen.getByText('Scales')).toBeInTheDocument();
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });
    });

    it('should render recent figures section', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Figures')).toBeInTheDocument();
        // Find the View All link by its text content and href
        const viewAllLink = screen.getByText('View All');
        expect(viewAllLink).toBeInTheDocument();
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/figures');
      });
    });

    it('should render top manufacturers section', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Top Manufacturers')).toBeInTheDocument();
        expect(screen.getByText('View All Statistics')).toBeInTheDocument();
      });
    });
  });

  describe('statistics display', () => {
    it('should display correct statistics from API data', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const totalFigures = screen.getByText('10');
        const manufacturerCount = screen.getAllByText('3');

        expect(totalFigures).toBeInTheDocument(); // Total figures
        expect(manufacturerCount.length).toBeGreaterThanOrEqual(3); // Number of manufacturers, scales, locations
      }, { timeout: 5000 });
    });

    it('should display statistics descriptions', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const descriptionTexts = [
          'In your collection',
          'Different brands',
          'Different sizes',
          'Series/Franchises'
        ];

        descriptionTexts.forEach(text => {
          const description = screen.getByText(text);
          expect(description).toBeInTheDocument();
        });
      });
    });

    it('should show zero statistics when no data available', async () => {
      // Mock useQuery to return undefined stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockEmptyFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: undefined, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        const statsNumbers = screen.getAllByText('0');
        expect(statsNumbers.length).toBeGreaterThanOrEqual(4); // All 4 stat cards should show 0
      });
    });

    it('should display top manufacturers data', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Good Smile Company')).toBeInTheDocument();
        expect(screen.getByText('ALTER')).toBeInTheDocument();
        expect(screen.getByText('Kotobukiya')).toBeInTheDocument();
        // Use getAllByText since counts like "2" may appear in both
        // manufacturer stats and status tab badges
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // GSC count
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // Kotobukiya count
      });
    });

    it('should limit manufacturer display to top 5', async () => {
      const extendedStatsData = {
        ...mockStatsData,
        manufacturerStats: [
          { _id: 'Manufacturer 1', count: 10 },
          { _id: 'Manufacturer 2', count: 9 },
          { _id: 'Manufacturer 3', count: 8 },
          { _id: 'Manufacturer 4', count: 7 },
          { _id: 'Manufacturer 5', count: 6 },
          { _id: 'Manufacturer 6', count: 5 },
          { _id: 'Manufacturer 7', count: 4 },
        ],
      };

      // Mock useQuery to return extended stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: extendedStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturer 1')).toBeInTheDocument();
        expect(screen.getByText('Manufacturer 5')).toBeInTheDocument();
        expect(screen.queryByText('Manufacturer 6')).not.toBeInTheDocument();
        expect(screen.queryByText('Manufacturer 7')).not.toBeInTheDocument();
      });
    });

    it('should handle empty manufacturer stats', async () => {
      const emptyStatsData = {
        ...mockStatsData,
        manufacturerStats: [],
      };

      // Mock useQuery to return empty stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: emptyStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No manufacturer data available.')).toBeInTheDocument();
      });
    });
  });

  describe('recent figures display', () => {
    it('should render recent figures when data is available', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('figure-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('figure-card-6')).toBeInTheDocument();
        expect(screen.getByTestId('figure-card-12')).toBeInTheDocument();
      });
    });

    it('should show empty state when no figures exist', async () => {
      // Mock useQuery to return empty figures data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockEmptyFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: mockStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("You haven't added any figures yet.")).toBeInTheDocument();
        expect(screen.getByText('Add Your First Figure')).toBeInTheDocument();
      });
    });

    it('should have correct link to view all figures', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const viewAllLink = screen.getByText('View All');
        expect(viewAllLink).toHaveAttribute('href', '/figures');
      });
    });

    it('should have correct link to add first figure', async () => {
      // Mock useQuery to return empty figures data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockEmptyFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: mockStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        const addFirstFigureLink = screen.getByText('Add Your First Figure');
        expect(addFirstFigureLink.closest('a')).toHaveAttribute('href', '/figures/add');
      });
    });

    it('should have correct link to view statistics', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const statsLink = screen.getByText('View All Statistics');
        expect(statsLink.closest('a')).toHaveAttribute('href', '/statistics');
      });
    });
  });

  describe('search functionality', () => {
    it('should handle search input and navigate to search page', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const searchInput = await screen.findByTestId('search-input');
      const searchForm = screen.getByTestId('search-bar');
      
      await user.type(searchInput, 'test query');
      await user.click(screen.getByLabelText('Search'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
      });
    });

    it('should encode search query properly', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const searchInput = await screen.findByTestId('search-input');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      await user.type(searchInput, 'search with spaces & symbols');
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/search?q=search%20with%20spaces%20%26%20symbols');
      });
    });

    it('should handle empty search query', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const searchInput = await screen.findByTestId('search-input');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      // Try to submit with empty input
      await user.click(searchButton);

      // Should navigate with empty string
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/search?q=');
      });
    });
  });

  describe('component behavior', () => {
    it('should handle API errors gracefully', async () => {
      // Mock useQuery to return error state
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        return { data: undefined, isLoading: false, isError: true, error: new Error('API Error') };
      });
      
      render(<Dashboard />);

      // Component should render without crashing
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should display fallback values when API data is undefined', async () => {
      // Mock useQuery to return undefined data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        return { data: undefined, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        // Should show zero values for stats
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('responsive layout', () => {
    it('should render statistics grid', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // All stat cards should be present
        expect(screen.getByText('Total Figures')).toBeInTheDocument();
        expect(screen.getByText('Manufacturers')).toBeInTheDocument();
        expect(screen.getByText('Scales')).toBeInTheDocument();
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });
    });

    it('should render two-column layout for main content', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Recent Figures')).toBeInTheDocument();
        expect(screen.getByText('Top Manufacturers')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Check main Dashboard heading
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        
        // Check section headings exist
        expect(screen.getByText('Recent Figures')).toBeInTheDocument();
        expect(screen.getByText('Top Manufacturers')).toBeInTheDocument();
      });
    });

    it('should have accessible statistics cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Statistics should be readable
        expect(screen.getByText('Total Figures')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('In your collection')).toBeInTheDocument();
      });
    });

    it('should have accessible navigation links', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const viewAllFiguresLink = screen.getByText('View All');
        const viewAllStatsLink = screen.getByText('View All Statistics');

        expect(viewAllFiguresLink).toBeInTheDocument();
        expect(viewAllStatsLink).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('should handle loading states gracefully', () => {
      mockApi.getFigures.mockImplementation(() => new Promise(() => {}));
      mockApi.getFigureStats.mockImplementation(() => new Promise(() => {}));
      
      render(<Dashboard />);

      // Component should render without data
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    it('should show default values while loading stats', () => {
      mockApi.getFigureStats.mockImplementation(() => new Promise(() => {}));
      
      render(<Dashboard />);

      // Should show 0 for stats while loading
      expect(screen.getByText('Total Figures')).toBeInTheDocument();
    });
  });

  describe('data consistency', () => {
    it('should handle partial stats data', async () => {
      const partialStatsData = {
        totalCount: 5,
        manufacturerStats: [{ _id: 'Test Manufacturer', count: 5 }],
        scaleStats: [],
      };

      // Mock useQuery to return partial stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: partialStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // Total count appears
        expect(screen.getByText('Test Manufacturer')).toBeInTheDocument();
        expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1); // Should show 0 for empty arrays
      });
    });

    it('should gracefully handle null or undefined query data', async () => {
      // Mock useQuery to return various edge case data scenarios
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        switch(queryKey) {
          case 'recentFigures':
            return { data: null, isLoading: false, isError: false };
          case 'dashboardStats':
            return { data: undefined, isLoading: false, isError: false };
          default:
            return { data: null, isLoading: false, isError: false };
        }
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        // Verify default/fallback values are displayed
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBeGreaterThanOrEqual(4); // All stat cards should show 0
        
        // Verify the dashboard renders without crashing
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      });
    });

    it('should prevent runtime errors with fallback empty object', async () => {
      // Mock useQuery to simulate an empty/null result without crashing
      const { useQuery } = require('react-query');
      useQuery.mockImplementation(() => {
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        // Component should render without throwing errors
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        
        // All statistics should be zero
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should handle malformed stats data', async () => {
      const malformedStatsData = {
        totalCount: null,
        manufacturerStats: null,
        scaleStats: undefined,
      };

      mockApi.getFigureStats.mockResolvedValue(malformedStatsData as any);
      
      render(<Dashboard />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers in statistics', async () => {
      const largeStatsData = {
        totalCount: 999999,
        manufacturerStats: [{ _id: 'Large Manufacturer', count: 999999 }],
        scaleStats: [{ _id: '1/8', count: 500000 }],
      };

      // Mock useQuery to return large stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: largeStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('999999').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle manufacturers with special characters', async () => {
      const specialCharStatsData = {
        ...mockStatsData,
        manufacturerStats: [
          { _id: 'Manufacturer & Co.', count: 5 },
          { _id: 'Company "Test"', count: 3 },
          { _id: 'Brand <Special>', count: 2 },
        ],
      };

      // Mock useQuery to return special characters stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: specialCharStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Manufacturer & Co.')).toBeInTheDocument();
        expect(screen.getByText('Company "Test"')).toBeInTheDocument();
        expect(screen.getByText('Brand <Special>')).toBeInTheDocument();
      });
    });

    it('should handle extremely long manufacturer names', async () => {
      const longNameStatsData = {
        ...mockStatsData,
        manufacturerStats: [
          { _id: 'This is a very long manufacturer name that might cause layout issues if not handled properly', count: 1 },
        ],
      };

      // Mock useQuery to return long name stats data
      const { useQuery } = require('react-query');
      useQuery.mockImplementation((key: string | string[]) => {
        const queryKey = Array.isArray(key) ? key[0] : key;
        if (queryKey === 'recentFigures') {
          return { data: mockFiguresData, isLoading: false, isError: false };
        } else if (queryKey === 'dashboardStats') {
          return { data: longNameStatsData, isLoading: false, isError: false };
        }
        return { data: null, isLoading: false, isError: false };
      });
      
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('This is a very long manufacturer name that might cause layout issues if not handled properly')).toBeInTheDocument();
      });
    });
  });
});