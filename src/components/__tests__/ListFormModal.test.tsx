import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { Steps, ChakraProvider } from '@chakra-ui/react';
import { render } from '@testing-library/react';
import ListFormModal from '../ListFormModal';
import { MfcList, MFC_LIST_LIMITS } from '../../types';
import theme from '../../theme';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();

const mockList: MfcList = {
  _id: 'list1',
  mfcId: 10001,
  userId: 'user1',
  name: 'Test List',
  teaser: 'A test teaser',
  description: 'A test description',
  privacy: 'public',
  allowComments: false,
  mailOnSales: false,
  mailOnHunts: false,
  itemCount: 5,
  itemMfcIds: [1, 2, 3],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ListFormModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create mode when no list provided', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByTestId('list-form-submit')).toHaveTextContent('Create List');
    expect(screen.getByTestId('list-name-input')).toHaveValue('');
  });

  it('renders edit mode with pre-filled data', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} list={mockList} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Edit List')).toBeInTheDocument();
    expect(screen.getByTestId('list-name-input')).toHaveValue('Test List');
    expect(screen.getByTestId('list-teaser-input')).toHaveValue('A test teaser');
    expect(screen.getByTestId('list-description-input')).toHaveValue('A test description');
    expect(screen.getByTestId('list-privacy-select')).toHaveValue('public');
  });

  it('shows error when submitting empty name', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );
    fireEvent.click(screen.getByTestId('list-form-submit'));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form data on valid create', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );

    fireEvent.change(screen.getByTestId('list-name-input'), { target: { value: 'My New List' } });
    fireEvent.change(screen.getByTestId('list-teaser-input'), { target: { value: 'Short desc' } });
    fireEvent.change(screen.getByTestId('list-privacy-select'), { target: { value: 'public' } });

    fireEvent.click(screen.getByTestId('list-form-submit'));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'My New List',
      privacy: 'public',
      teaser: 'Short desc',
    });
  });

  it('trims whitespace from name', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );

    fireEvent.change(screen.getByTestId('list-name-input'), { target: { value: '  Padded Name  ' } });
    fireEvent.click(screen.getByTestId('list-form-submit'));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Padded Name' })
    );
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error for name exceeding max length', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );

    const longName = 'A'.repeat(MFC_LIST_LIMITS.NAME_MAX + 1);
    fireEvent.change(screen.getByTestId('list-name-input'), { target: { value: longName } });
    fireEvent.click(screen.getByTestId('list-form-submit'));

    expect(screen.getByText(`Name must be ${MFC_LIST_LIMITS.NAME_MAX} characters or less`)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows Save Changes button in edit mode', () => {
    render(
      <ListFormModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} list={mockList} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByTestId('list-form-submit')).toHaveTextContent('Save Changes');
  });

  it('does not render when closed', () => {
    render(
      <ListFormModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />,
      { wrapper: Wrapper }
    );
    expect(screen.queryByText('Create List')).not.toBeInTheDocument();
  });
});
