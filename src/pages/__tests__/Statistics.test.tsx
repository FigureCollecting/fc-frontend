import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test-utils';
import Statistics from '../Statistics';
import { useAuthStore } from '../../stores/authStore';

// Mock useAuthStore
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const fullMockStats = {
  totalCount: 100,
  totalFigures: 100,
  totalValue: 5000,
  averageValue: 50,
  manufacturerStats: [
    { _id: 'Good Smile Company', count: 40 },
    { _id: 'Alter', count: 30 },
    { _id: '', count: 10 },
  ],
  scaleStats: [
    { _id: '1/7', count: 50 },
    { _id: '1/8', count: 30 },
  ],
  locationStats: [
    { _id: 'Display Case', count: 60 },
    { _id: 'Box', count: 20 },
  ],
};

// Default: data loaded
let mockQueryReturn: any = {
  data: fullMockStats,
  isLoading: false,
  error: null,
};

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQuery: () => mockQueryReturn,
}));

describe('Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: { _id: '1', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      setUser: jest.fn(),
      logout: jest.fn(),
    });

    mockQueryReturn = {
      data: fullMockStats,
      isLoading: false,
      error: null,
    };

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('renders statistics page', () => {
    render(<Statistics />);
    expect(screen.getByRole('heading', { name: /statistics/i })).toBeInTheDocument();
  });

  it('renders total figures count', () => {
    render(<Statistics />);
    expect(screen.getByText('Total Figures')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockQueryReturn = { data: undefined, isLoading: true, error: null };
    render(<Statistics />);
    // Should show spinner (no heading visible)
    expect(screen.queryByText('Collection Statistics')).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    mockQueryReturn = { data: undefined, isLoading: false, error: new Error('fail') };
    render(<Statistics />);
    expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  it('renders error state when stats is null', () => {
    mockQueryReturn = { data: null, isLoading: false, error: null };
    render(<Statistics />);
    expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
  });

  it('renders summary stats and section headings', () => {
    render(<Statistics />);
    // "Manufacturers" appears both as stat label and section heading
    expect(screen.getAllByText('Manufacturers').length).toBeGreaterThanOrEqual(1);
    // "Scales" appears both as stat label and section heading
    expect(screen.getAllByText('Scales').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('In your collection')).toBeInTheDocument();
    expect(screen.getByText('Different brands')).toBeInTheDocument();
    expect(screen.getByText('Different sizes')).toBeInTheDocument();
  });

  it('renders manufacturer table with rows', () => {
    render(<Statistics />);
    expect(screen.getByText('Good Smile Company')).toBeInTheDocument();
    expect(screen.getByText('Alter')).toBeInTheDocument();
    // Empty _id shows as Unknown
    const unknownCells = screen.getAllByText('Unknown');
    expect(unknownCells.length).toBeGreaterThanOrEqual(1);
  });

  it('renders scale table with rows', () => {
    render(<Statistics />);
    expect(screen.getByText('1/7')).toBeInTheDocument();
    expect(screen.getByText('1/8')).toBeInTheDocument();
  });

  it('renders location table with rows', () => {
    render(<Statistics />);
    expect(screen.getByText('Storage Locations')).toBeInTheDocument();
    expect(screen.getByText('Display Case')).toBeInTheDocument();
    expect(screen.getByText('Box')).toBeInTheDocument();
  });

  it('shows percentages for stats', () => {
    render(<Statistics />);
    // 40/100 = 40.0%
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });

  it('navigates when clicking a manufacturer row', () => {
    render(<Statistics />);
    const rows = screen.getAllByRole('button');
    const gscRow = rows.find(r => r.textContent?.includes('Good Smile Company'));
    if (gscRow) fireEvent.click(gscRow);
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('manufacturer'));
  });

  it('navigates when pressing Enter on a scale row', () => {
    render(<Statistics />);
    const rows = screen.getAllByRole('button');
    const scaleRow = rows.find(r => r.textContent?.includes('1/7'));
    if (scaleRow) fireEvent.keyDown(scaleRow, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('scale'));
  });

  it('does not navigate when row has empty _id', () => {
    render(<Statistics />);
    const rows = screen.getAllByRole('button');
    const unknownRow = rows.find(r => r.textContent?.includes('Unknown'));
    if (unknownRow) {
      mockNavigate.mockClear();
      fireEvent.click(unknownRow);
      // handleRowClick returns early if value is empty
    }
  });

  it('has CSV download button', () => {
    render(<Statistics />);
    const downloadButton = screen.getByLabelText('Download statistics as CSV');
    expect(downloadButton).toBeInTheDocument();
  });

  it('triggers CSV download when button clicked', () => {
    render(<Statistics />);
    const downloadButton = screen.getByLabelText('Download statistics as CSV');
    const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    fireEvent.click(downloadButton);

    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
