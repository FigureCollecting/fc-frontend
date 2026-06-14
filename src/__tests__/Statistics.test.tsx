import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ChakraProvider } from '@chakra-ui/react';
import Statistics from '../pages/Statistics';
import * as api from '../api';
import { StatsData } from '../types';
import system from '../theme';

// Mock the API module
jest.mock('../api');
const mockGetFigureStats = api.getFigureStats as jest.MockedFunction<typeof api.getFigureStats>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ── Test Data ────────────────────────────────────────────────

const mockStatsOwned: StatsData = {
  totalCount: 100,
  statusCounts: { owned: 50, ordered: 30, wished: 20 },
  manufacturerStats: [
    { _id: 'Good Smile Company', count: 35 },
    { _id: 'ALTER', count: 22 },
  ],
  scaleStats: [
    { _id: '1/7', count: 41 },
    { _id: '1/8', count: 33 },
    { _id: '', count: 11 },
  ],
  originStats: [
    { _id: 'Fate/Grand Order', count: 25 },
    { _id: 'Vocaloid', count: 15 },
  ],
  categoryStats: [
    { _id: 'Scale Figure', count: 60 },
    { _id: 'Nendoroid', count: 18 },
  ],
  v3ManufacturerStats: [
    { _id: 'Good Smile Company', count: 38 },
    { _id: 'Max Factory', count: 12 },
  ],
  distributorStats: [
    { _id: 'AmiAmi', count: 45 },
    { _id: 'HobbySearch', count: 19 },
  ],
  activeStatus: 'owned',
};

const mockStatsOrdered: StatsData = {
  totalCount: 30,
  statusCounts: { owned: 50, ordered: 30, wished: 20 },
  manufacturerStats: [
    { _id: 'Kotobukiya', count: 15 },
  ],
  scaleStats: [
    { _id: '1/7', count: 21 },
  ],
  originStats: [
    { _id: 'Original', count: 10 },
  ],
  categoryStats: [
    { _id: 'Scale Figure', count: 25 },
  ],
  v3ManufacturerStats: [],
  distributorStats: [
    { _id: 'AmiAmi', count: 15 },
  ],
  activeStatus: 'ordered',
};

const mockStatsAll: StatsData = {
  totalCount: 100,
  statusCounts: { owned: 50, ordered: 30, wished: 20 },
  manufacturerStats: [],
  scaleStats: [],
  originStats: [],
  categoryStats: [],
  v3ManufacturerStats: [],
  distributorStats: [],
  activeStatus: null,
};

const mockStatsEmpty: StatsData = {
  totalCount: 0,
  statusCounts: { owned: 0, ordered: 0, wished: 0 },
  manufacturerStats: [],
  scaleStats: [],
  originStats: [],
  categoryStats: [],
  v3ManufacturerStats: [],
  distributorStats: [],
  activeStatus: null,
};

// ── Helpers ──────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
}

const { render } = require('@testing-library/react');

function renderStatistics() {
  const queryClient = createQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter>
          <Statistics />
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
  return { ...result, user };
}

/** Wait for the scoped stats to load by looking for a unique data element */
async function waitForStatsLoaded() {
  await waitFor(() => {
    // Wait for a unique stat entry that only appears after data loads
    expect(screen.getByText('ALTER')).toBeInTheDocument();
  });
}

// ── Tests ────────────────────────────────────────────────────

// react-scripts uses default 5s timeout; Chakra + react-query need more headroom
jest.setTimeout(15000);

describe('Statistics Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFigureStats.mockImplementation((status?: string) => {
      if (status === 'owned') return Promise.resolve(mockStatsOwned);
      if (status === 'ordered') return Promise.resolve(mockStatsOrdered);
      if (!status) return Promise.resolve(mockStatsAll);
      return Promise.resolve(mockStatsEmpty);
    });
  });

  describe('Loading State', () => {
    it('renders heading and spinner while loading', () => {
      mockGetFigureStats.mockReturnValue(new Promise(() => {}));
      renderStatistics();

      expect(screen.getByText('Collection Statistics')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Status Tabs', () => {
    it('renders CollectionStatusTabs with correct counts', async () => {
      renderStatistics();

      // Wait for data then find the tablist and check counts within it
      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(within(tablist).getByText('50')).toBeInTheDocument();
        expect(within(tablist).getByText('30')).toBeInTheDocument();
        expect(within(tablist).getByText('20')).toBeInTheDocument();
      });
    });

    it('defaults to "owned" status tab', async () => {
      renderStatistics();

      await waitFor(() => {
        expect(mockGetFigureStats).toHaveBeenCalledWith('owned');
      });
      expect(mockGetFigureStats).toHaveBeenCalledWith();
    });

    it('switching tabs re-fetches stats scoped to that status', async () => {
      const { user } = renderStatistics();

      await waitForStatsLoaded();

      const orderedTab = screen.getByRole('tab', { name: /ordered/i });
      await user.click(orderedTab);

      await waitFor(() => {
        expect(mockGetFigureStats).toHaveBeenCalledWith('ordered');
      });
    });
  });

  describe('Stat Tables', () => {
    it('renders all stat tables: Manufacturer, Scale, Origin, Category, Distributor', async () => {
      renderStatistics();

      await waitForStatsLoaded();
      // Headings also appear as StatLabel in summary cards, so use getAllByText
      expect(screen.getAllByText('Manufacturers').length).toBeGreaterThanOrEqual(2); // card + table
      expect(screen.getAllByText('Scales').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Origins').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Categories').length).toBeGreaterThanOrEqual(2);
      // Distributors has no summary card, so it appears only once
      expect(screen.getByText('Distributors')).toBeInTheDocument();
    });

    it('displays stat entries with count and percentage', async () => {
      renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('1/7')).toBeInTheDocument();
      });
      // 1/7 has count 41 out of 100 = 41.0%
      expect(screen.getByText('41')).toBeInTheDocument();
      expect(screen.getByText('41.0%')).toBeInTheDocument();
    });

    it('shows "No data yet" when stats array is empty', async () => {
      mockGetFigureStats.mockImplementation((status?: string) => {
        if (!status) return Promise.resolve(mockStatsAll);
        return Promise.resolve({
          ...mockStatsEmpty,
          statusCounts: { owned: 0, ordered: 0, wished: 0 },
          activeStatus: status ?? null,
        } as StatsData);
      });
      renderStatistics();

      await waitFor(() => {
        const noDataMessages = screen.getAllByText('No data yet');
        expect(noDataMessages.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('merges legacy + v3 manufacturer stats via mergeManufacturerStats', async () => {
      renderStatistics();

      await waitFor(() => {
        // Max Factory (12) from v3 stats, ALTER (22) from legacy (not in v3)
        expect(screen.getByText('Max Factory')).toBeInTheDocument();
        expect(screen.getByText('ALTER')).toBeInTheDocument();
      });
    });

    it('shows null/empty values as "Not Specified"', async () => {
      renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('Not Specified')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('clicking manufacturer row navigates with mfr param', async () => {
      const { user } = renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('ALTER')).toBeInTheDocument();
      });

      const alterRow = screen.getByText('ALTER').closest('tr')!;
      await user.click(alterRow);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('mfr=ALTER')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('status=owned')
      );
    });

    it('clicking scale row navigates with scale param', async () => {
      const { user } = renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('1/7')).toBeInTheDocument();
      });

      const scaleRow = screen.getByText('1/7').closest('tr')!;
      await user.click(scaleRow);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('scale=1%2F7')
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('status=owned')
      );
    });

    it('clicking null scale row navigates with __unspecified__', async () => {
      const { user } = renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('Not Specified')).toBeInTheDocument();
      });

      const notSpecifiedCell = screen.getByText('Not Specified');
      const row = notSpecifiedCell.closest('tr')!;
      await user.click(row);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('scale=__unspecified__')
      );
    });

    it('clicking origin row navigates with origin param', async () => {
      const { user } = renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('Fate/Grand Order')).toBeInTheDocument();
      });

      const originRow = screen.getByText('Fate/Grand Order').closest('tr')!;
      await user.click(originRow);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('origin=Fate')
      );
    });

    it('clicking category row navigates with cat param', async () => {
      const { user } = renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('Scale Figure')).toBeInTheDocument();
      });

      const catRow = screen.getByText('Scale Figure').closest('tr')!;
      await user.click(catRow);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('cat=Scale')
      );
    });

    it('clicking distributor row navigates with dist param', async () => {
      const { user } = renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('AmiAmi')).toBeInTheDocument();
      });

      const distRow = screen.getByText('AmiAmi').closest('tr')!;
      await user.click(distRow);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('dist=AmiAmi')
      );
    });

    it('navigation includes current status when on different tab', async () => {
      const { user } = renderStatistics();

      await waitForStatsLoaded();

      // Switch to ordered tab
      const orderedTab = screen.getByRole('tab', { name: /ordered/i });
      await user.click(orderedTab);

      await waitFor(() => {
        expect(screen.getByText('Kotobukiya')).toBeInTheDocument();
      });

      const row = screen.getByText('Kotobukiya').closest('tr')!;
      await user.click(row);

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('status=ordered')
      );
    });
  });

  describe('Summary Cards', () => {
    it('renders summary cards with total and unique counts', async () => {
      renderStatistics();

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText(/total figures/i)).toBeInTheDocument();
      });
    });
  });

  describe('CSV Download', () => {
    it('CSV download creates blob with all stat categories', async () => {
      let capturedBlob: Blob | null = null;
      const mockCreateObjectURL = jest.fn((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test';
      });
      const mockRevokeObjectURL = jest.fn();
      const origCreateObjectURL = URL.createObjectURL;
      const origRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;

      const { user } = renderStatistics();

      await waitForStatsLoaded();

      const downloadButton = screen.getByLabelText(/download.*csv/i);
      await user.click(downloadButton);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(capturedBlob).toBeInstanceOf(Blob);

      // Read blob via FileReader since jsdom Blob lacks .text()
      const blobText = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(capturedBlob!);
      });

      expect(blobText).toContain('Manufacturer');
      expect(blobText).toContain('Scale');
      expect(blobText).toContain('Origin');
      expect(blobText).toContain('Category');
      expect(blobText).toContain('Distributor');

      URL.createObjectURL = origCreateObjectURL;
      URL.revokeObjectURL = origRevokeObjectURL;
    });
  });

  describe('Error State', () => {
    it('shows error message when API fails', async () => {
      mockGetFigureStats.mockRejectedValue(new Error('Network error'));
      renderStatistics();

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
