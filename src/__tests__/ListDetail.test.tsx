import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ChakraProvider } from '@chakra-ui/react';
import ListDetail from '../pages/ListDetail';
import * as api from '../api';
import { MfcList } from '../types';
import theme from '../theme';

// Mock the API module
jest.mock('../api');
const mockGetListById = api.getListById as jest.MockedFunction<typeof api.getListById>;
const mockUpdateList = api.updateList as jest.MockedFunction<typeof api.updateList>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ── Test Data ────────────────────────────────────────────────

const now = new Date().toISOString();

const mockList: MfcList = {
  _id: 'list1',
  mfcId: 10001,
  userId: 'user1',
  name: 'For Sale or Trade',
  teaser: 'Figures I want to sell or trade',
  description: '<p>These are figures I no longer want. <b>Make an offer!</b></p>',
  privacy: 'public',
  iconUrl: 'https://static.myfigurecollection.net/pics/icon.jpg',
  allowComments: true,
  mailOnSales: true,
  mailOnHunts: false,
  itemCount: 3,
  itemMfcIds: [12345, 67890, 11111],
  mfcCreatedAt: '2023-06-15T10:30:00Z',
  mfcLastEditedAt: '2024-11-20T14:45:00Z',
  lastSyncedAt: '2025-02-24T12:00:00Z',
  createdAt: now,
  updatedAt: now,
};

const mockListMinimal: MfcList = {
  _id: 'list2',
  mfcId: 10002,
  userId: 'user1',
  name: 'Empty List',
  privacy: 'private',
  allowComments: false,
  mailOnSales: false,
  mailOnHunts: false,
  itemCount: 0,
  itemMfcIds: [],
  createdAt: now,
  updatedAt: now,
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

function renderListDetail(listId = 'list1') {
  const queryClient = createQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[`/lists/${listId}`]}>
          <Routes>
            <Route path="/lists/:id" element={<ListDetail />} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
  return { ...result, user };
}

async function waitForDetailLoaded() {
  await waitFor(() => {
    expect(screen.getByText('For Sale or Trade')).toBeInTheDocument();
  });
}

// ── Tests ────────────────────────────────────────────────────

jest.setTimeout(15000);

describe('ListDetail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetListById.mockResolvedValue(mockList);
  });

  describe('Loading State', () => {
    it('renders spinner while loading', () => {
      mockGetListById.mockReturnValue(new Promise(() => {}));
      renderListDetail();

      expect(screen.getByTestId('list-detail-spinner')).toBeInTheDocument();
    });
  });

  describe('List Header', () => {
    it('renders list name as heading', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByRole('heading', { name: 'For Sale or Trade' })).toBeInTheDocument();
    });

    it('shows privacy badge', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByText('public')).toBeInTheDocument();
    });

    it('shows teaser text', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByText('Figures I want to sell or trade')).toBeInTheDocument();
    });

    it('shows item count', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByText(/3 items/i)).toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('renders HTML description', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByText(/Make an offer!/)).toBeInTheDocument();
    });

    it('sanitizes malicious HTML via DOMPurify', async () => {
      const xssList: MfcList = {
        ...mockList,
        description: '<p>Safe text</p><script>alert("xss")</script><img src=x onerror="alert(1)">',
      };
      mockGetListById.mockResolvedValue(xssList);
      renderListDetail();

      await waitFor(() => {
        expect(screen.getByText('Safe text')).toBeInTheDocument();
      });

      // Script tags and event handlers should be stripped by DOMPurify
      const descriptionBox = screen.getByText('Safe text').closest('div');
      expect(descriptionBox?.innerHTML).not.toContain('<script>');
      expect(descriptionBox?.innerHTML).not.toContain('onerror');
    });
  });

  describe('Metadata', () => {
    it('shows MFC created date', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      // Should display the MFC created date in some format
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });

    it('shows settings flags', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      // The list has allowComments=true, mailOnSales=true
      expect(screen.getByText(/comments/i)).toBeInTheDocument();
    });
  });

  describe('Item IDs', () => {
    it('displays item MFC IDs', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByText(/12345/)).toBeInTheDocument();
      expect(screen.getByText(/67890/)).toBeInTheDocument();
    });
  });

  describe('Minimal List', () => {
    it('renders list with no optional fields', async () => {
      mockGetListById.mockResolvedValue(mockListMinimal);
      renderListDetail('list2');

      await waitFor(() => {
        expect(screen.getByText('Empty List')).toBeInTheDocument();
      });

      expect(screen.getByText('private')).toBeInTheDocument();
      expect(screen.getByText(/0 items/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('has a back button that navigates to lists', async () => {
      const { user } = renderListDetail();

      await waitForDetailLoaded();

      const backBtn = screen.getByLabelText(/back/i);
      await user.click(backBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/lists');
    });
  });

  describe('Edit List', () => {
    it('renders edit button', async () => {
      renderListDetail();

      await waitForDetailLoaded();

      expect(screen.getByTestId('edit-list-btn')).toBeInTheDocument();
    });

    it('opens edit modal with pre-filled data on edit button click', async () => {
      const { user } = renderListDetail();

      await waitForDetailLoaded();

      await user.click(screen.getByTestId('edit-list-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('list-name-input')).toBeInTheDocument();
      });

      // Should be pre-filled with list data
      expect(screen.getByTestId('list-name-input')).toHaveValue('For Sale or Trade');
    });
  });

  describe('Error State', () => {
    it('shows error message when API fails', async () => {
      mockGetListById.mockRejectedValue(new Error('Not found'));
      renderListDetail();

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
