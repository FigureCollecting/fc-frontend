import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockUser } from '../../test-utils';
import Login from '../Login';
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

jest.mock('../../components/ui/toaster', () => ({
  toaster: {
    create: (...args: any[]) => mockToast(...args),
    dismiss: jest.fn(),
    update: jest.fn(),
  },
  Toaster: () => null,
}));

describe('Login', () => {
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

  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: 'FigureCollecting' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password', { selector: 'input' })).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders register link', () => {
    render(<Login />);
    const registerLink = screen.getByText('Register');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('renders MFC disclaimer', () => {
    render(<Login />);
    expect(screen.getByText(/Not affiliated with MFC/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText('Password', { selector: 'input' });
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Toggle button is the IconButton with the "Show password" aria-label
    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('has proper autocomplete attributes', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
    expect(screen.getByLabelText('Password', { selector: 'input' })).toHaveAttribute('autoComplete', 'current-password');
  });

  it('has proper form structure', () => {
    render(<Login />);
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveAttribute('type', 'submit');
  });

  it('submits form with email and password', async () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText('Password', { selector: 'input' });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('mutation onSuccess sets user, shows toast, and navigates home', () => {
    render(<Login />);

    const userData = { ...mockUser, username: 'loggedin', token: 'abc123' };
    mockMutationOnSuccessCb(userData);

    expect(mockSetUser).toHaveBeenCalledWith(userData);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success',
        description: 'You are now logged in!',
        type: 'success',
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('mutation onError shows error toast with response message', () => {
    render(<Login />);

    const error = { response: { data: { message: 'Invalid credentials' } } };
    mockMutationOnErrorCb(error);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Invalid credentials',
        type: 'error',
      })
    );
  });

  it('mutation onError shows fallback message when no response data', () => {
    render(<Login />);

    mockMutationOnErrorCb({});

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Invalid email or password',
        type: 'error',
      })
    );
  });

  it('allows tabbing through form elements', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.click(emailInput);
    expect(emailInput).toHaveFocus();

    await user.tab();
    // "Forgot password?" link receives focus before the password input
    expect(screen.getByText(/forgot password/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Password', { selector: 'input' })).toHaveFocus();
  });
});
