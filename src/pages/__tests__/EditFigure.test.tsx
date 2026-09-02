import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockFigure } from '../../test-utils';
import EditFigure from '../EditFigure';
import { useAuthStore } from '../../stores/authStore';

// Mock useAuthStore
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock navigate function
const mockNavigate = jest.fn();

// Mock react-router
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock the v3 toaster module the component imports (../components/ui/toaster)
const mockToastCreate = jest.fn();
jest.mock('../../components/ui/toaster', () => ({
  toaster: { create: (...args: any[]) => mockToastCreate(...args), dismiss: jest.fn(), update: jest.fn() },
  Toaster: () => null,
}));

// Mock QueryClient
const mockInvalidateQueries = jest.fn();
const mockMutate = jest.fn();

jest.mock('react-query', () => {
  const originalModule = jest.requireActual('react-query');
  return {
    ...originalModule,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
    useQuery: () => ({
      data: {
        _id: '123',
        manufacturer: 'Test Manufacturer',
        name: 'Test Figure',
        scale: '1/8',
        mfcLink: '',
        imageUrl: '',
        location: '',
        boxNumber: '',
      },
      isLoading: false,
      error: null,
    }),
    useMutation: (mutationFn: any, options: any) => {
      // Store options for testing
      const mutate = jest.fn((data) => {
        mockMutate(data);
        // Simulate successful mutation
        setTimeout(() => {
          if (options?.onSuccess) {
            options.onSuccess();
          }
        }, 0);
      });

      return {
        mutate,
        isLoading: false,
        error: null,
        _options: options,
      };
    },
  };
});

// Mock FigureForm to simplify testing
jest.mock('../../components/FigureForm', () => {
  return function MockFigureForm({ onSubmit, isLoading, loadingAction }: any) {
    return (
      <div data-testid="mock-figure-form">
        <button
          data-testid="submit-save"
          onClick={() => onSubmit({ name: 'Updated', manufacturer: 'Updated' }, false)}
          disabled={isLoading}
        >
          Save
        </button>
        <span data-testid="loading-action">{loadingAction || 'null'}</span>
      </div>
    );
  };
});

describe('EditFigure', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: { _id: '1', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      setUser: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('renders edit figure form with heading', () => {
      render(<EditFigure />);
      expect(screen.getByRole('heading', { name: /edit figure/i })).toBeInTheDocument();
    });

    it('renders FigureForm component', () => {
      render(<EditFigure />);
      expect(screen.getByTestId('mock-figure-form')).toBeInTheDocument();
    });

    it('renders breadcrumb navigation', () => {
      render(<EditFigure />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Figures')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls mutation with form data on save', async () => {
      render(<EditFigure />);

      const saveButton = screen.getByTestId('submit-save');
      fireEvent.click(saveButton);

      // Mutation should have been called with the data
      expect(mockMutate).toHaveBeenCalledWith({ name: 'Updated', manufacturer: 'Updated' });
    });

    it('invalidates queries on successful save', async () => {
      render(<EditFigure />);

      const saveButton = screen.getByTestId('submit-save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith('figures');
        expect(mockInvalidateQueries).toHaveBeenCalledWith('recentFigures');
        expect(mockInvalidateQueries).toHaveBeenCalledWith('dashboardStats');
      });
    });

    it('shows success toast on successful save', async () => {
      render(<EditFigure />);

      const saveButton = screen.getByTestId('submit-save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToastCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            type: 'success',
          })
        );
      });
    });

    it('handles successful save flow', async () => {
      render(<EditFigure />);

      const saveButton = screen.getByTestId('submit-save');
      fireEvent.click(saveButton);

      // Verify the mutation was called - the full success flow
      // (toast, invalidate, navigate) is handled by the onSuccess callback
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('passes loadingAction to FigureForm', () => {
      render(<EditFigure />);

      // When not loading, loadingAction should be null
      const loadingActionDisplay = screen.getByTestId('loading-action');
      expect(loadingActionDisplay.textContent).toBe('null');
    });

    it('passes loading state to form buttons', () => {
      render(<EditFigure />);

      const saveButton = screen.getByTestId('submit-save');
      expect(saveButton).not.toBeDisabled();
    });
  });
});