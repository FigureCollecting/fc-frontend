import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockFigure } from '../../test-utils';
import FigureDetail from '../FigureDetail';
import { useAuthStore } from '../../stores/authStore';

// Mock useAuthStore
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mutable query/mutation return values
let mockQueryReturn: any;
let mockQueryOnErrorCb: any;
let mockDeleteOnSuccessCb: any;
let mockDeleteOnErrorCb: any;
const mockMutate = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockToast = jest.fn();

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQuery: (_key: any, _fn: any, opts: any) => {
    mockQueryOnErrorCb = opts?.onError;
    return mockQueryReturn;
  },
  useMutation: (_fn: any, opts: any) => {
    mockDeleteOnSuccessCb = opts?.onSuccess;
    mockDeleteOnErrorCb = opts?.onError;
    return {
      mutate: (...args: any[]) => {
        mockMutate(...args);
      },
      isLoading: false,
      error: null,
    };
  },
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

const enrichedFigure = {
  ...mockFigure,
  companyRoles: [
    { companyId: 'c1', companyName: 'Good Smile', roleId: 'r1', roleName: 'Manufacturer' },
    { companyId: 'c2', companyName: 'Max Factory', roleId: 'r2', roleName: 'Distributor' },
  ],
  artistRoles: [
    { artistId: 'a1', artistName: 'Sculptor A', roleId: 'ar1', roleName: 'Sculptor' },
  ],
};

describe('FigureDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: { _id: '1', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      setUser: jest.fn(),
      logout: jest.fn(),
    });

    mockQueryReturn = {
      data: enrichedFigure,
      isLoading: false,
      error: null,
    };
  });

  it('renders figure details', () => {
    render(<FigureDetail />);
    expect(screen.getByRole('heading', { name: enrichedFigure.name })).toBeInTheDocument();
  });

  it('renders figure company information from companyRoles', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Good Smile')).toBeInTheDocument();
    expect(screen.getByText('Max Factory')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockQueryReturn = { data: undefined, isLoading: true, error: null };
    render(<FigureDetail />);
    expect(screen.queryByRole('heading', { name: enrichedFigure.name })).not.toBeInTheDocument();
  });

  it('renders error state', () => {
    mockQueryReturn = { data: undefined, isLoading: false, error: new Error('fail') };
    render(<FigureDetail />);
    expect(screen.getByText(/Error loading figure details/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to Figures/i)).toBeInTheDocument();
  });

  it('renders error when figure is null', () => {
    mockQueryReturn = { data: null, isLoading: false, error: null };
    render(<FigureDetail />);
    expect(screen.getByText(/Error loading figure details/i)).toBeInTheDocument();
  });

  it('renders edit and delete buttons', () => {
    render(<FigureDetail />);
    expect(screen.getByLabelText('Edit figure')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete figure')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Figures')).toBeInTheDocument();
  });

  it('renders figure scale badge', () => {
    render(<FigureDetail />);
    expect(screen.getByText(enrichedFigure.scale)).toBeInTheDocument();
  });

  it('renders storage location', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Storage Location:')).toBeInTheDocument();
    expect(screen.getByText(enrichedFigure.location!)).toBeInTheDocument();
  });

  it('renders MFC link', () => {
    render(<FigureDetail />);
    expect(screen.getByText('MFC Link:')).toBeInTheDocument();
    expect(screen.getByText(/View on MyFigureCollection/i)).toBeInTheDocument();
  });

  it('renders Back to Figures button', () => {
    render(<FigureDetail />);
    const backButtons = screen.getAllByText(/Back to Figures/i);
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Edit Figure button', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Edit Figure')).toBeInTheDocument();
  });

  it('renders company roles with badges', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Good Smile')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
  });

  it('renders artist roles', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Sculptor A')).toBeInTheDocument();
    expect(screen.getByText('Sculptor')).toBeInTheDocument();
  });

  it('shows Unknown Manufacturer when no companies', () => {
    mockQueryReturn = {
      data: { ...enrichedFigure, companyRoles: [], manufacturer: '' },
      isLoading: false,
      error: null,
    };
    render(<FigureDetail />);
    expect(screen.getByText('Unknown Manufacturer')).toBeInTheDocument();
  });

  it('does not show artist section when no artists', () => {
    mockQueryReturn = {
      data: { ...enrichedFigure, artistRoles: [] },
      isLoading: false,
      error: null,
    };
    render(<FigureDetail />);
    expect(screen.queryByText('Sculptor A')).not.toBeInTheDocument();
  });

  it('handles delete with confirmation', () => {
    window.confirm = jest.fn().mockReturnValue(true);
    render(<FigureDetail />);

    fireEvent.click(screen.getByLabelText('Delete figure'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this figure?');
    expect(mockMutate).toHaveBeenCalled();
  });

  it('does not delete when confirmation cancelled', () => {
    window.confirm = jest.fn().mockReturnValue(false);
    render(<FigureDetail />);

    fireEvent.click(screen.getByLabelText('Delete figure'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('renders added date', () => {
    render(<FigureDetail />);
    expect(screen.getByText('Added:')).toBeInTheDocument();
  });

  // Tests for useQuery onError callback (lines 43-51)
  it('useQuery onError shows error toast with response message', () => {
    render(<FigureDetail />);

    const err = { response: { data: { message: 'Figure not found' } } };
    mockQueryOnErrorCb(err);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Figure not found',
        status: 'error',
      })
    );
  });

  it('useQuery onError shows fallback message when no response data', () => {
    render(<FigureDetail />);

    mockQueryOnErrorCb({});

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Failed to load figure details',
        status: 'error',
      })
    );
  });

  // Tests for deleteMutation onSuccess callback (lines 56-69)
  it('deleteMutation onSuccess invalidates queries, shows toast, and navigates', () => {
    render(<FigureDetail />);

    mockDeleteOnSuccessCb();

    expect(mockInvalidateQueries).toHaveBeenCalledWith('figures');
    expect(mockInvalidateQueries).toHaveBeenCalledWith('recentFigures');
    expect(mockInvalidateQueries).toHaveBeenCalledWith('dashboardStats');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success',
        description: 'Figure deleted successfully',
        status: 'success',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/figures');
  });

  // Tests for deleteMutation onError callback (lines 71-79)
  it('deleteMutation onError shows error toast with response message', () => {
    render(<FigureDetail />);

    const err = { response: { data: { message: 'Cannot delete' } } };
    mockDeleteOnErrorCb(err);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Cannot delete',
        status: 'error',
      })
    );
  });

  it('deleteMutation onError shows fallback message when no response data', () => {
    render(<FigureDetail />);

    mockDeleteOnErrorCb({});

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Failed to delete figure',
        status: 'error',
      })
    );
  });
});
