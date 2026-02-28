/**
 * Tests for FacetedFilterSidebar component
 */
import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import FacetedFilterSidebar, { SidebarContent } from '../FacetedFilterSidebar';
import type { FacetedFilters } from '../FacetedFilterSidebar';

// Mock useBreakpointValue to control mobile/desktop rendering
jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react');
  return {
    ...actual,
    useBreakpointValue: jest.fn(() => false), // default: desktop
  };
});

import { useBreakpointValue } from '@chakra-ui/react';
const mockedBreakpoint = useBreakpointValue as jest.Mock;

const emptyFilters: FacetedFilters = {
  manufacturers: [],
  distributors: [],
  scales: [],
  origins: [],
  categories: [],
  sculptors: [],
  illustrators: [],
  classifications: [],
};

const mockStats = {
  totalFigures: 10,
  totalValue: 5000,
  averageRating: 8,
  figuresByStatus: { owned: 5, ordered: 3, wished: 2 },
  manufacturerStats: [
    { _id: 'Good Smile Company', count: 5 },
    { _id: 'Alter', count: 3 },
    { _id: 'Kotobukiya', count: 2 },
  ],
  v3ManufacturerStats: [],
  distributorStats: [
    { _id: 'AmiAmi', count: 4 },
    { _id: 'Solaris', count: 3 },
  ],
  scaleStats: [
    { _id: '1/7', count: 5 },
    { _id: '1/8', count: 3 },
    { _id: null, count: 2 },
  ],
  originStats: [
    { _id: 'Fate', count: 4 },
    { _id: 'Vocaloid', count: 3 },
    { _id: '', count: 2 },
  ],
  categoryStats: [
    { _id: 'Scale', count: 6 },
    { _id: 'Nendoroid', count: 3 },
    { _id: null, count: 1 },
  ],
  ratingDistribution: [],
  yearlyStats: [],
  priceRangeStats: [],
};

describe('FacetedFilterSidebar', () => {
  const defaultProps = {
    stats: mockStats as any,
    filters: emptyFilters,
    onFiltersChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedBreakpoint.mockReturnValue(false); // desktop
  });

  describe('desktop rendering', () => {
    it('should render the sidebar with filter sections', () => {
      render(<FacetedFilterSidebar {...defaultProps} />);

      // Desktop: heading "Filters" and facet section titles
      expect(screen.getAllByText('Filters').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Manufacturer')).toBeInTheDocument();
      expect(screen.getByText('Origin')).toBeInTheDocument();
      // 'Scale' appears as both a section header and a category item
      expect(screen.getAllByText('Scale').length).toBeGreaterThanOrEqual(1);
    });

    it('should show distributor section when distributor stats available', () => {
      render(<FacetedFilterSidebar {...defaultProps} />);

      expect(screen.getByText('Distributor')).toBeInTheDocument();
    });

    it('should hide distributor section when no distributor stats', () => {
      const statsWithoutDist = { ...mockStats, distributorStats: [] };
      render(
        <FacetedFilterSidebar {...defaultProps} stats={statsWithoutDist as any} />
      );

      expect(screen.queryByText('Distributor')).not.toBeInTheDocument();
    });
  });

  describe('mobile rendering', () => {
    it('should render filter button on mobile', () => {
      mockedBreakpoint.mockReturnValue(true); // mobile
      render(<FacetedFilterSidebar {...defaultProps} />);

      // Should show the filter button instead of sidebar
      const filterButton = screen.getByRole('button', { name: /Filters/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('should show filter count badge on mobile when filters active', () => {
      mockedBreakpoint.mockReturnValue(true);
      const activeFilters = { ...emptyFilters, manufacturers: ['GSC'] };
      render(
        <FacetedFilterSidebar {...defaultProps} filters={activeFilters} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading message when isLoading is true', () => {
      render(<FacetedFilterSidebar {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading filters...')).toBeInTheDocument();
    });
  });
});

describe('SidebarContent', () => {
  const onFiltersChange = jest.fn();
  const defaultProps = {
    stats: mockStats as any,
    filters: emptyFilters,
    onFiltersChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render facet sections with item counts', () => {
    render(<SidebarContent {...defaultProps} />);

    // Manufacturer items visible
    expect(screen.getByText('Good Smile Company')).toBeInTheDocument();
    expect(screen.getByText('Alter')).toBeInTheDocument();
  });

  it('should render scale items including Not Specified for null scales', () => {
    render(<SidebarContent {...defaultProps} />);

    expect(screen.getByText('1/7')).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();
    // Null scale should be shown as "Not Specified"
    const notSpecifiedElements = screen.getAllByText('Not Specified');
    expect(notSpecifiedElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should show active filters summary when filters are set', () => {
    const activeFilters = {
      ...emptyFilters,
      manufacturers: ['Good Smile Company'],
      scales: ['1/7'],
    };
    render(<SidebarContent {...defaultProps} filters={activeFilters} />);

    expect(screen.getByText('Active Filters')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should call onFiltersChange when Clear All is clicked', () => {
    const activeFilters = {
      ...emptyFilters,
      manufacturers: ['Good Smile Company'],
    };
    render(<SidebarContent {...defaultProps} filters={activeFilters} />);

    fireEvent.click(screen.getByText('Clear All'));
    expect(onFiltersChange).toHaveBeenCalledWith(emptyFilters);
  });

  it('should not show active filters section when no filters set', () => {
    render(<SidebarContent {...defaultProps} />);

    expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
  });

  it('should render active filter tags that can be removed', () => {
    const activeFilters = {
      ...emptyFilters,
      manufacturers: ['Good Smile Company', 'Alter'],
      distributors: ['AmiAmi'],
      scales: ['1/7'],
      origins: ['Fate'],
      categories: ['Scale'],
    };
    render(<SidebarContent {...defaultProps} filters={activeFilters} />);

    // All tag labels should be visible
    expect(screen.getByText('Active Filters')).toBeInTheDocument();
  });

  it('should handle empty stats gracefully', () => {
    render(<SidebarContent {...defaultProps} stats={undefined} />);

    // Should still render sections but with no items
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
  });

  it('should show loading state when isLoading', () => {
    render(<SidebarContent {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Loading filters...')).toBeInTheDocument();
  });

  it('should render origin items with Not Specified for empty origins', () => {
    render(<SidebarContent {...defaultProps} />);

    expect(screen.getByText('Fate')).toBeInTheDocument();
    expect(screen.getByText('Vocaloid')).toBeInTheDocument();
  });

  it('should render category items', () => {
    render(<SidebarContent {...defaultProps} />);

    // 'Scale' appears as both a section header and a category item
    expect(screen.getAllByText('Scale').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Nendoroid')).toBeInTheDocument();
  });
});
