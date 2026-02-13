import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockUser } from '../../test-utils';
import Register from '../Register';
import { useAuthStore } from '../../stores/authStore';

// Mock useAuthStore
jest.mock('../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

let mockMutationOnSuccessCb: any;
let mockMutationOnErrorCb: any;
const mockMutate = jest.fn();
const mockToast = jest.fn();

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useMutation: (fn: any, opts: any) => {
    mockMutationOnSuccessCb = opts?.onSuccess;
    mockMutationOnErrorCb = opts?.onError;
    return {
      mutate: mockMutate,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    };
  },
}));

jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

describe('Register', () => {
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      setUser: mockSetUser,
      logout: jest.fn(),
    });
  });

  it('renders registration form', () => {
    render(<Register />);
    expect(screen.getByRole('heading', { name: 'FigureCollecting' })).toBeInTheDocument();
    expect(screen.getByText('Create an account to start your collection')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(<Register />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Multiple password fields (password + confirm)
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBeGreaterThanOrEqual(2);
  });

  it('renders sign in link', () => {
    render(<Register />);
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('renders Create Account button', () => {
    render(<Register />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toHaveAttribute('type', 'submit');
  });

  it('renders MFC disclaimer', () => {
    render(<Register />);
    expect(screen.getByText(/Not affiliated with MFC/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<Register />);
    const passwordFields = screen.getAllByLabelText(/password/i);
    const passwordInput = passwordFields[0];
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find the toggle button (not the Create Account button)
    const toggleBtn = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByLabelText(/hide password/i);
    fireEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('has proper autocomplete attributes', () => {
    render(<Register />);
    expect(screen.getByLabelText(/username/i)).toHaveAttribute('autoComplete', 'username');
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
  });

  it('submits form', async () => {
    render(<Register />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@test.com' } });

    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: 'pass123' } });
    fireEvent.change(passwordFields[1], { target: { value: 'pass123' } });

    const form = screen.getByRole('button', { name: /create account/i }).closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('mutation onSuccess sets user, shows toast, and navigates home', () => {
    render(<Register />);

    const userData = { ...mockUser, username: 'newuser', token: 'newtoken' };
    mockMutationOnSuccessCb(userData);

    expect(mockSetUser).toHaveBeenCalledWith(userData);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success',
        description: 'Account created successfully!',
        status: 'success',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('mutation onError shows error toast with response message', () => {
    render(<Register />);

    const error = { response: { data: { message: 'Email already exists' } } };
    mockMutationOnErrorCb(error);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Email already exists',
        status: 'error',
      })
    );
  });

  it('mutation onError shows fallback message when no response data', () => {
    render(<Register />);

    mockMutationOnErrorCb({});

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Registration failed',
        status: 'error',
      })
    );
  });

  it('renders confirm password field', () => {
    render(<Register />);
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });
});
