import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { render } from '@testing-library/react';
import ListMembershipModal from '../ListMembershipModal';
import * as api from '../../api';
import system from '../../theme';

jest.mock('../../api');

const mockGetLists = api.getLists as jest.MockedFunction<typeof api.getLists>;
const mockGetListsByItem = api.getListsByItem as jest.MockedFunction<typeof api.getListsByItem>;
const mockAddItemsToList = api.addItemsToList as jest.MockedFunction<typeof api.addItemsToList>;
const mockRemoveItemsFromList = api.removeItemsFromList as jest.MockedFunction<typeof api.removeItemsFromList>;

const mockOnClose = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </QueryClientProvider>
  );
  return Wrapper;
}

const mockLists = {
  success: true,
  count: 3,
  page: 1,
  pages: 1,
  total: 3,
  data: [
    {
      _id: 'list1', mfcId: 1001, userId: 'u1', name: 'Wishlist',
      privacy: 'private' as const, allowComments: false, mailOnSales: false, mailOnHunts: false,
      itemCount: 5, itemMfcIds: [100, 200], createdAt: '', updatedAt: '',
    },
    {
      _id: 'list2', mfcId: 1002, userId: 'u1', name: 'For Sale',
      privacy: 'public' as const, allowComments: true, mailOnSales: true, mailOnHunts: false,
      itemCount: 3, itemMfcIds: [300], createdAt: '', updatedAt: '',
    },
    {
      _id: 'list3', mfcId: 1003, userId: 'u1', name: 'Favorites',
      privacy: 'friends' as const, allowComments: false, mailOnSales: false, mailOnHunts: false,
      itemCount: 0, itemMfcIds: [], createdAt: '', updatedAt: '',
    },
  ],
};

describe('ListMembershipModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLists.mockResolvedValue(mockLists);
    mockGetListsByItem.mockResolvedValue([{ _id: 'list1', name: 'Wishlist' }]);
    mockAddItemsToList.mockResolvedValue(mockLists.data[0]);
    mockRemoveItemsFromList.mockResolvedValue(mockLists.data[0]);
  });

  it('shows loading spinner initially', () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('membership-spinner')).toBeInTheDocument();
  });

  it('shows figure name in description', () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Saber Alter"
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText('Saber Alter')).toBeInTheDocument();
  });

  it('renders list checkboxes after loading', async () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Wishlist')).toBeInTheDocument();
    });
    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('pre-checks lists the figure belongs to', async () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('list-checkbox-list1')).toBeInTheDocument();
    });

    // checkedListIds is populated by an effect that runs after the
    // getListsByItem query resolves, so the reflected `checked` state on the
    // hidden input arrives asynchronously — wait for it.
    // Wishlist (list1) should be checked since figure 100 is in it
    const wishlistCheckbox = screen.getByTestId('list-checkbox-list1').querySelector('input');
    await waitFor(() => expect(wishlistCheckbox).toBeChecked());

    // For Sale (list2) should NOT be checked
    const forSaleCheckbox = screen.getByTestId('list-checkbox-list2').querySelector('input');
    await waitFor(() => expect(forSaleCheckbox).not.toBeChecked());
  });

  it('save button disabled when no changes', async () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('membership-save-btn')).toBeInTheDocument();
    });

    expect(screen.getByTestId('membership-save-btn')).toBeDisabled();
  });

  it('enables save button after toggling a list', async () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('list-checkbox-list2')).toBeInTheDocument();
    });

    // Toggle "For Sale" list on. userEvent.click reliably fires Zag's
    // onCheckedChange (fireEvent on the root div does not).
    await userEvent.click(screen.getByTestId('list-checkbox-list2'));

    await waitFor(() =>
      expect(screen.getByTestId('membership-save-btn')).not.toBeDisabled()
    );
  });

  it('calls addItemsToList when adding to a new list', async () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('list-checkbox-list2')).toBeInTheDocument();
    });

    // Check "For Sale" (userEvent.click fires Zag's onCheckedChange so the
    // save button enables; fireEvent on the root div does not).
    await userEvent.click(screen.getByTestId('list-checkbox-list2'));
    await waitFor(() =>
      expect(screen.getByTestId('membership-save-btn')).not.toBeDisabled()
    );
    // Click save. fireEvent (not userEvent) on this plain button avoids Zag's
    // press handling that references win.PointerEvent (absent in jsdom).
    fireEvent.click(screen.getByTestId('membership-save-btn'));

    await waitFor(() => {
      expect(mockAddItemsToList).toHaveBeenCalledWith('list2', [100]);
    });
  });

  it('calls removeItemsFromList when removing from a list', async () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('list-checkbox-list1')).toBeInTheDocument();
    });

    // Wait for the pre-check to apply (checkedListIds populated by effect after
    // getListsByItem resolves) before toggling it off.
    const wishlistInput = screen.getByTestId('list-checkbox-list1').querySelector('input');
    await waitFor(() => expect(wishlistInput).toBeChecked());

    // Uncheck "Wishlist" (currently checked). userEvent.click fires Zag's
    // onCheckedChange; fireEvent on the root div does not.
    await userEvent.click(screen.getByTestId('list-checkbox-list1'));
    await waitFor(() =>
      expect(screen.getByTestId('membership-save-btn')).not.toBeDisabled()
    );
    // Click save. fireEvent (not userEvent) on this plain button avoids Zag's
    // press handling that references win.PointerEvent (absent in jsdom).
    fireEvent.click(screen.getByTestId('membership-save-btn'));

    await waitFor(() => {
      expect(mockRemoveItemsFromList).toHaveBeenCalledWith('list1', [100]);
    });
  });

  it('closes modal on Cancel', () => {
    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows info message when no lists exist', async () => {
    mockGetLists.mockResolvedValue({ ...mockLists, data: [], total: 0, count: 0 });
    mockGetListsByItem.mockResolvedValue([]);

    render(
      <ListMembershipModal
        isOpen={true}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/No lists found/)).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(
      <ListMembershipModal
        isOpen={false}
        onClose={mockOnClose}
        figureMfcId={100}
        figureName="Test Figure"
      />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByText('Manage Lists')).not.toBeInTheDocument();
  });
});
