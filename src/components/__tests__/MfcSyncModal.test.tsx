/**
 * Tests for MfcSyncModal helper functions and component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../test-utils';

// Mock all heavy dependencies
const mockValidateMfcCookies = jest.fn();
const mockExecuteFullSync = jest.fn();
const mockCreateSyncJob = jest.fn();

jest.mock('../../api/scraper', () => ({
  validateMfcCookies: (...args: any[]) => mockValidateMfcCookies(...args),
  executeFullSync: (...args: any[]) => mockExecuteFullSync(...args),
  createSyncJob: (...args: any[]) => mockCreateSyncJob(...args),
}));

const mockRetrieveMfcCookies = jest.fn().mockResolvedValue(null);
const mockHasMfcCookies = jest.fn().mockReturnValue(false);

jest.mock('../../utils/crypto', () => ({
  retrieveMfcCookies: (...args: any[]) => mockRetrieveMfcCookies(...args),
  hasMfcCookies: (...args: any[]) => mockHasMfcCookies(...args),
}));

jest.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    verbose: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Use real stores instead of mocking
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';

import MfcSyncModal, { getCategoryRoot } from '../MfcSyncModal';

// Set up auth store with a logged-in user before tests
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { _id: 'user1', username: 'test', email: 'test@test.com', isAdmin: false, token: 'tok' },
    isAuthenticated: true,
    lastActivity: Date.now(),
  });
  useSyncStore.setState({
    isActive: false,
    sessionId: null,
  });
  mockRetrieveMfcCookies.mockResolvedValue(null);
  mockHasMfcCookies.mockReturnValue(false);
  mockValidateMfcCookies.mockReset();
  mockExecuteFullSync.mockReset();
  mockCreateSyncJob.mockReset();
});

describe('getCategoryRoot', () => {
  it('should return Figures for undefined category', () => {
    expect(getCategoryRoot(undefined)).toBe('Figures');
  });

  it('should return Figures for figure-related categories', () => {
    expect(getCategoryRoot('Prepainted')).toBe('Figures');
    expect(getCategoryRoot('scale figure')).toBe('Figures');
    expect(getCategoryRoot('Trading Figure')).toBe('Figures');
    expect(getCategoryRoot('Action/Dolls')).toBe('Figures');
    expect(getCategoryRoot('Prize Figure')).toBe('Figures');
    expect(getCategoryRoot('Nendoroid')).toBe('Figures');
    expect(getCategoryRoot('figma')).toBe('Figures');
    expect(getCategoryRoot('Garage Kit')).toBe('Figures');
    expect(getCategoryRoot('Model Kit')).toBe('Figures');
    expect(getCategoryRoot('Statue')).toBe('Figures');
    expect(getCategoryRoot('Bust')).toBe('Figures');
    expect(getCategoryRoot('Poseable Figure')).toBe('Figures');
  });

  it('should return Media for media categories', () => {
    expect(getCategoryRoot('Video/DVD')).toBe('Media');
    expect(getCategoryRoot('Blu-ray')).toBe('Media');
    expect(getCategoryRoot('BluRay disc')).toBe('Media');
    expect(getCategoryRoot('CD Music')).toBe('Media');
    expect(getCategoryRoot('Soundtrack')).toBe('Media');
    expect(getCategoryRoot('Book/Manga')).toBe('Media');
    expect(getCategoryRoot('Artbook')).toBe('Media');
    expect(getCategoryRoot('Novel')).toBe('Media');
    expect(getCategoryRoot('Magazine')).toBe('Media');
    expect(getCategoryRoot('Game Software')).toBe('Media');
  });

  it('should return Goods for everything else', () => {
    expect(getCategoryRoot('Plushies')).toBe('Goods');
    expect(getCategoryRoot('Straps')).toBe('Goods');
    expect(getCategoryRoot('Linens')).toBe('Goods');
    expect(getCategoryRoot('Stationeries')).toBe('Goods');
    expect(getCategoryRoot('On Walls')).toBe('Goods');
    expect(getCategoryRoot('Misc')).toBe('Goods');
    expect(getCategoryRoot('Cushion')).toBe('Goods');
  });

  it('should handle empty string as Figures (default)', () => {
    // Empty string matches the default/fallback which includes figure patterns
    const result = getCategoryRoot('');
    expect(result).toBe('Figures');
  });
});

describe('MfcSyncModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSyncComplete: jest.fn(),
    onOpenCookiesModal: jest.fn(),
  };

  it('should render when open', () => {
    render(<MfcSyncModal {...defaultProps} />);
    expect(screen.getByText(/Sync with MFC/i)).toBeInTheDocument();
  });

  it('should not render content when closed', () => {
    render(<MfcSyncModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Sync with MFC/i)).not.toBeInTheDocument();
  });

  it('should show cookie check state when opened', () => {
    render(<MfcSyncModal {...defaultProps} />);
    // Should show checking state initially
    expect(screen.getByText(/Checking for stored MFC cookies/i)).toBeInTheDocument();
  });

  it('should show no cookies warning when cookies not found', async () => {
    mockRetrieveMfcCookies.mockResolvedValue(null);
    mockHasMfcCookies.mockReturnValue(false);

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/MFC Cookies Required/i)).toBeInTheDocument();
    });
  });

  it('should show Set Up MFC Cookies button when no cookies', async () => {
    mockRetrieveMfcCookies.mockResolvedValue(null);
    mockHasMfcCookies.mockReturnValue(false);

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Set Up MFC Cookies/i })).toBeInTheDocument();
    });
  });

  it('should call onOpenCookiesModal when Set Up MFC Cookies is clicked', async () => {
    mockRetrieveMfcCookies.mockResolvedValue(null);
    mockHasMfcCookies.mockReturnValue(false);

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Set Up MFC Cookies/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Set Up MFC Cookies/i }));

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onOpenCookiesModal).toHaveBeenCalled();
  });

  it('should show Cancel button when checking step is not loading', async () => {
    mockRetrieveMfcCookies.mockResolvedValue(null);
    mockHasMfcCookies.mockReturnValue(false);

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  it('should show validating step when cookies are found', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    // Never resolve validation to stay in validating state
    mockValidateMfcCookies.mockReturnValue(new Promise(() => {}));

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Validating cookies with MyFigureCollection/i)).toBeInTheDocument();
    });
  });

  it('should display Ready to Sync title in modal header on ready step', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: true,
      username: 'ReadyUser',
    });

    render(
      <MfcSyncModal
        isOpen={true}
        onClose={jest.fn()}
        onSyncComplete={jest.fn()}
        onOpenCookiesModal={jest.fn()}
      />
    );

    // The modal header changes to "Ready to Sync" when step is ready
    await waitFor(() => {
      // getStepTitle returns 'Ready to Sync' for ready step
      // This appears in the modal header
      const headings = screen.getAllByText('Ready to Sync');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show Start Sync button on ready step', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: true,
      username: 'TestUser',
    });

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Sync/i })).toBeInTheDocument();
    });
  });

  it('should show error when cookies are invalid', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: false,
      error: 'Session expired',
    });

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Session expired/i)).toBeInTheDocument();
    });
  });

  it('should show error when validation throws', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockRejectedValue(new Error('Network error'));

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('should show error when stored cookies are unparseable', async () => {
    mockRetrieveMfcCookies.mockResolvedValue('not-json-not-cookie-format');
    mockHasMfcCookies.mockReturnValue(true);

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  it('should parse cookie header format and reach ready step', async () => {
    const cookieHeader = 'PHPSESSID=abc; sesUID=123; sesDID=456';
    mockRetrieveMfcCookies.mockResolvedValue(cookieHeader);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: true,
      username: 'HeaderUser',
    });

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Sync/i })).toBeInTheDocument();
    });

    // Validate was called with the parsed cookies
    expect(mockValidateMfcCookies).toHaveBeenCalledWith(
      expect.objectContaining({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' })
    );
  });

  it('should pass additional cookies to validation', async () => {
    const storedCookies = JSON.stringify({
      PHPSESSID: 'abc', sesUID: '123', sesDID: '456', cf_clearance: 'cf-val',
    });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: true,
      username: 'ExtraUser',
    });

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Sync/i })).toBeInTheDocument();
    });

    // Validate was called with all cookies including cf_clearance
    expect(mockValidateMfcCookies).toHaveBeenCalledWith(
      expect.objectContaining({ cf_clearance: 'cf-val' })
    );
  });

  it('should start sync when Start Sync button is clicked', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: true,
      username: 'TestUser',
    });
    mockCreateSyncJob.mockResolvedValue({});
    mockExecuteFullSync.mockResolvedValue({});

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Sync/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start Sync/i }));

    await waitFor(() => {
      expect(mockCreateSyncJob).toHaveBeenCalled();
    });
  });

  it('should close modal and call onClose on cancel', async () => {
    mockRetrieveMfcCookies.mockResolvedValue(null);
    mockHasMfcCookies.mockReturnValue(false);

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show info about what happens next on ready step', async () => {
    const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
    mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
    mockHasMfcCookies.mockReturnValue(true);
    mockValidateMfcCookies.mockResolvedValue({
      valid: true,
      username: 'TestUser',
    });

    render(<MfcSyncModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/What happens next/i)).toBeInTheDocument();
    });
  });
});
