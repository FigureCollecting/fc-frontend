import React from 'react';
import { screen } from '@testing-library/react';
import { render, mockFigure } from '../../test-utils';
import Search from '../Search';
import { useAuthStore } from '../../stores/authStore';

// Mock useAuthStore
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock react-router
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => [new URLSearchParams('q=test'), jest.fn()],
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock react-query
jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQuery: () => ({
    data: [mockFigure],
    isLoading: false,
    error: null
  }),
}));

describe('Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      user: { _id: '1', username: 'testuser', email: 'test@example.com' },
      isAuthenticated: true,
      setUser: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('renders search page', () => {
    render(<Search />);
    expect(screen.getByRole('heading', { name: /search/i })).toBeInTheDocument();
  });

  it('renders search results', () => {
    render(<Search />);
    expect(screen.getByText(mockFigure.name)).toBeInTheDocument();
  });
});