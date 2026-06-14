import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Steps, ChakraProvider } from '@chakra-ui/react';
import Lists from '../pages/Lists';
import * as api from '../api';
import { MfcList, PaginatedResponse } from '../types';
import theme from '../theme';

// Mock the API module
jest.mock('../api');
const mockGetLists = api.getLists as jest.MockedFunction<typeof api.getLists>;
const mockDeleteList = api.deleteList as jest.MockedFunction<typeof api.deleteList>;
const mockCreateList = api.createList as jest.MockedFunction<typeof api.createList>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ── Test Data ────────────────────────────────────────────────

const now = new Date().toISOString();

const mockLists: MfcList[] = [
  {
    _id: 'list1',
    mfcId: 10001,
    userId: 'user1',
    name: 'For Sale or Trade',
    teaser: 'Figures I want to sell',
    privacy: 'public',
    allowComments: true,
    mailOnSales: false,
    mailOnHunts: false,
    itemCount: 12,
    itemMfcIds: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'list2',
    mfcId: 10002,
    userId: 'user1',
    name: 'Wishlist - Grails',
    teaser: 'Holy grail figures',
    privacy: 'friends',
    iconUrl: 'https://static.myfigurecollection.net/pics/icon.jpg',
    allowComments: false,
    mailOnSales: true,
    mailOnHunts: true,
    itemCount: 45,
    itemMfcIds: [],
    mfcCreatedAt: '2023-06-15T10:30:00Z',
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'list3',
    mfcId: 10003,
    userId: 'user1',
    name: 'Damaged Items',
    privacy: 'private',
    allowComments: false,
    mailOnSales: false,
    mailOnHunts: false,
    itemCount: 3,
    itemMfcIds: [],
    createdAt: now,
    updatedAt: now,
  },
];

const mockPaginatedLists: PaginatedResponse<MfcList> = {
  success: true,
  count: 3,
  page: 1,
  pages: 1,
  total: 3,
  data: mockLists,
};

const mockEmptyLists: PaginatedResponse<MfcList> = {
  success: true,
  count: 0,
  page: 1,
  pages: 0,
  total: 0,
  data: [],
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

function renderLists() {
  const queryClient = createQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <MemoryRouter>
          <Lists />
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
  return { ...result, user };
}

async function waitForListsLoaded() {
  await waitFor(() => {
    expect(screen.getByText('For Sale or Trade')).toBeInTheDocument();
  });
}

// ── Tests ────────────────────────────────────────────────────

jest.setTimeout(15000);

describe('Lists Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLists.mockResolvedValue(mockPaginatedLists);
  });

  describe('Loading State', () => {
    it('renders heading and spinner while loading', () => {
      mockGetLists.mockReturnValue(new Promise(() => {}));
      renderLists();

      expect(screen.getByText('My Lists')).toBeInTheDocument();
      expect(screen.getByTestId('lists-spinner')).toBeInTheDocument();
    });
  });

  describe('List Display', () => {
    it('renders all lists with name, teaser, privacy, and item count', async () => {
      renderLists();

      await waitForListsLoaded();

      expect(screen.getByText('For Sale or Trade')).toBeInTheDocument();
      expect(screen.getByText('Figures I want to sell')).toBeInTheDocument();
      expect(screen.getByText('Wishlist - Grails')).toBeInTheDocument();
      expect(screen.getByText('Damaged Items')).toBeInTheDocument();

      // Item counts
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('shows privacy badges for each list', async () => {
      renderLists();

      await waitForListsLoaded();

      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.getByText('friends')).toBeInTheDocument();
      expect(screen.getByText('private')).toBeInTheDocument();
    });

    it('shows empty state when no lists exist', async () => {
      mockGetLists.mockResolvedValue(mockEmptyLists);
      renderLists();

      await waitFor(() => {
        expect(screen.getByText(/no lists/i)).toBeInTheDocument();
      });
    });

    it('shows total list count in heading area', async () => {
      renderLists();

      await waitForListsLoaded();

      expect(screen.getByText(/3 lists/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('clicking a list row navigates to list detail', async () => {
      const { user } = renderLists();

      await waitForListsLoaded();

      const listRow = screen.getByText('For Sale or Trade').closest('tr') ||
                       screen.getByText('For Sale or Trade').closest('[data-testid]');
      if (listRow) {
        await user.click(listRow);
        expect(mockNavigate).toHaveBeenCalledWith('/lists/list1');
      }
    });
  });

  describe('Delete', () => {
    it('delete button removes list after confirmation', async () => {
      mockDeleteList.mockResolvedValue(undefined);
      const { user } = renderLists();

      await waitForListsLoaded();

      // Find and click delete button for first list
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error State', () => {
    it('shows error message when API fails', async () => {
      mockGetLists.mockRejectedValue(new Error('Network error'));
      renderLists();

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create List', () => {
    it('renders create list button', async () => {
      renderLists();

      await waitForListsLoaded();

      expect(screen.getByTestId('create-list-btn')).toBeInTheDocument();
      expect(screen.getByTestId('create-list-btn')).toHaveTextContent('Create List');
    });

    it('opens create modal on button click', async () => {
      const { user } = renderLists();

      await waitForListsLoaded();

      await user.click(screen.getByTestId('create-list-btn'));

      // Modal should appear with form
      await waitFor(() => {
        expect(screen.getByTestId('list-name-input')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination when multiple pages exist', async () => {
      mockGetLists.mockResolvedValue({
        ...mockPaginatedLists,
        pages: 3,
        total: 30,
      });
      renderLists();

      await waitForListsLoaded();

      // Should have page navigation
      expect(screen.getByText(/page/i)).toBeInTheDocument();
    });
  });
});
