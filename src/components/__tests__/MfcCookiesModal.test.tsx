import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import MfcCookiesModal from '../MfcCookiesModal';

// Mock crypto utilities
const mockStoreMfcCookies = jest.fn();
const mockRetrieveMfcCookies = jest.fn().mockResolvedValue(null);
const mockClearMfcCookies = jest.fn();
const mockGetStorageType = jest.fn().mockReturnValue('session');
const mockHasMfcCookies = jest.fn().mockReturnValue(false);

jest.mock('../../utils/crypto', () => ({
  storeMfcCookies: (...args: any[]) => mockStoreMfcCookies(...args),
  retrieveMfcCookies: (...args: any[]) => mockRetrieveMfcCookies(...args),
  clearMfcCookies: (...args: any[]) => mockClearMfcCookies(...args),
  getStorageType: (...args: any[]) => mockGetStorageType(...args),
  hasMfcCookies: (...args: any[]) => mockHasMfcCookies(...args),
}));

// Mock the scraper API for allowlist fetching
const mockGetMfcCookieAllowlist = jest.fn().mockResolvedValue({
  allowedCookies: ['PHPSESSID', 'sesUID', 'sesDID', 'cf_clearance'],
  scriptReadable: ['PHPSESSID', 'sesUID', 'sesDID'],
  manualCopy: ['cf_clearance'],
});

jest.mock('../../api/scraper', () => ({
  getMfcCookieAllowlist: (...args: any[]) => mockGetMfcCookieAllowlist(...args),
}));

// Mock useAuthStore
jest.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: { _id: 'user1', username: 'test', email: 'test@test.com' },
      isAuthenticated: true,
    }),
}));

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onCookiesChanged: jest.fn(),
};

describe('MfcCookiesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRetrieveMfcCookies.mockResolvedValue(null);
    mockGetStorageType.mockReturnValue('session');
    mockHasMfcCookies.mockReturnValue(false);
    mockGetMfcCookieAllowlist.mockResolvedValue({
      allowedCookies: ['PHPSESSID', 'sesUID', 'sesDID', 'cf_clearance'],
      scriptReadable: ['PHPSESSID', 'sesUID', 'sesDID'],
      manualCopy: ['cf_clearance'],
    });
  });

  describe('Modal rendering', () => {
    it('should render modal with title when open', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByText('MFC Session Cookies')).toBeInTheDocument();
    });

    it('should not render content when closed', async () => {
      render(<MfcCookiesModal {...defaultProps} isOpen={false} />);

      // Modal content should not be visible when closed
      expect(screen.queryByText('MFC Session Cookies')).not.toBeInTheDocument();
    });

    it('should show storage options', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      // Check for storage option radio buttons - use getAllByText since text may appear multiple times
      const sessionOptions = screen.getAllByText(/Remember for this session/i);
      const persistentOptions = screen.getAllByText(/Remember until cleared/i);
      expect(sessionOptions.length).toBeGreaterThan(0);
      expect(persistentOptions.length).toBeGreaterThan(0);
    });

    it('should have Save and Clear buttons', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear Cookies/i })).toBeInTheDocument();
    });
  });

  describe('Security & Privacy section', () => {
    it('should have a collapsible Security & Privacy section', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      // The button text includes "Security & Privacy"
      const securityButton = screen.getByRole('button', { name: /security.*privacy/i });
      expect(securityButton).toBeInTheDocument();
    });

    it('should expand Security & Privacy section on click', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const securityButton = screen.getByRole('button', { name: /security.*privacy/i });
      await userEvent.click(securityButton);

      // After expanding, should show security information
      await waitFor(() => {
        expect(screen.getByText(/MFC cookies are encrypted and stored only in your browser/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step-by-step instructions', () => {
    it('should display step 1 instructions for running script', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByText(/Step 1: Run this script in MFC Console/i)).toBeInTheDocument();
    });

    it('should display step 2 instructions for pasting JSON output', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByText(/Step 2: Paste the copied JSON here/i)).toBeInTheDocument();
    });

    it('should display step 3 instructions for cf_clearance', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByText(/Step 3: Enter cf_clearance/i)).toBeInTheDocument();
    });

    it('should have a Copy button for the extraction script', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
    });
  });

  describe('Console output validation', () => {
    it('should show invalid JSON message for bad input', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      fireEvent.change(textarea, { target: { value: 'not json' } });

      expect(screen.getByText(/Invalid JSON/i)).toBeInTheDocument();
    });

    it('should show missing required cookies warning', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      fireEvent.change(textarea, { target: { value: '{"PHPSESSID": "abc"}' } });

      expect(screen.getByText(/Missing required cookies/i)).toBeInTheDocument();
    });

    it('should show valid message when all required cookies present', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      const validJson = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
      fireEvent.change(textarea, { target: { value: validJson } });

      expect(screen.getByText(/Valid/i)).toBeInTheDocument();
    });

    it('should show cf_clearance warning when empty', () => {
      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByText(/Without cf_clearance/i)).toBeInTheDocument();
    });

    it('should show cf_clearance provided message when entered', () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const cfInput = screen.getByPlaceholderText(/cf_clearance value/i);
      fireEvent.change(cfInput, { target: { value: 'some-cf-value' } });

      expect(screen.getByText(/cf_clearance provided/i)).toBeInTheDocument();
    });
  });

  describe('Save handler', () => {
    it('should save cookies when valid JSON with all required cookies', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      const validJson = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
      fireEvent.change(textarea, { target: { value: validJson } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockStoreMfcCookies).toHaveBeenCalled();
      });
    });

    it('should include cf_clearance in saved cookies when provided', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      const validJson = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
      fireEvent.change(textarea, { target: { value: validJson } });

      const cfInput = screen.getByPlaceholderText(/cf_clearance value/i);
      fireEvent.change(cfInput, { target: { value: 'cf-test-value' } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockStoreMfcCookies).toHaveBeenCalled();
        const storedValue = mockStoreMfcCookies.mock.calls[0][0];
        const parsed = JSON.parse(storedValue);
        expect(parsed.cf_clearance).toBe('cf-test-value');
      });
    });

    it('should call onCookiesChanged after saving', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      const validJson = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' });
      fireEvent.change(textarea, { target: { value: validJson } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(defaultProps.onCookiesChanged).toHaveBeenCalled();
      });
    });

    it('should not save when JSON is invalid', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/PHPSESSID/);
      fireEvent.change(textarea, { target: { value: 'bad json' } });

      const saveBtn = screen.getByRole('button', { name: /Save/i });
      // Save button should be disabled since output is invalid
      expect(saveBtn).toBeDisabled();
    });
  });

  describe('Clear handler', () => {
    it('should clear cookies and call onCookiesChanged', async () => {
      // Set up as if cookies are stored
      mockRetrieveMfcCookies.mockResolvedValue(
        JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456' })
      );

      render(<MfcCookiesModal {...defaultProps} />);

      // Wait for stored cookies to load
      await waitFor(() => {
        expect(mockRetrieveMfcCookies).toHaveBeenCalled();
      });

      const clearBtn = screen.getByRole('button', { name: /Clear Cookies/i });
      fireEvent.click(clearBtn);

      expect(mockClearMfcCookies).toHaveBeenCalled();
      expect(defaultProps.onCookiesChanged).toHaveBeenCalled();
    });
  });

  describe('Storage type change', () => {
    it('should allow changing storage type', () => {
      render(<MfcCookiesModal {...defaultProps} />);

      const persistentOption = screen.getAllByText(/Remember until cleared/i);
      fireEvent.click(persistentOption[0]);

      // No error thrown
      expect(persistentOption[0]).toBeInTheDocument();
    });
  });

  describe('Stored cookies loading', () => {
    it('should load and display stored cookies on open', async () => {
      const storedCookies = JSON.stringify({ PHPSESSID: 'abc', sesUID: '123', sesDID: '456', cf_clearance: 'stored-cf' });
      mockRetrieveMfcCookies.mockResolvedValue(storedCookies);
      mockGetStorageType.mockReturnValue('persistent');

      render(<MfcCookiesModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockRetrieveMfcCookies).toHaveBeenCalled();
      });

      // Should show "Stored" badge after loading
      await waitFor(() => {
        expect(screen.getByText('Stored')).toBeInTheDocument();
      });
    });

    it('should handle no stored cookies', async () => {
      mockRetrieveMfcCookies.mockResolvedValue(null);

      render(<MfcCookiesModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockRetrieveMfcCookies).toHaveBeenCalled();
      });

      // Should not show "Stored" badge
      expect(screen.queryByText('Stored')).not.toBeInTheDocument();
    });
  });

  describe('Allowlist loading', () => {
    it('should show extraction script after allowlist loads', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetMfcCookieAllowlist).toHaveBeenCalled();
      });

      // Script should contain the cookie names
      await waitFor(() => {
        const codeBlocks = document.querySelectorAll('code');
        const scriptCode = Array.from(codeBlocks).find(el => el.textContent?.includes('PHPSESSID'));
        expect(scriptCode).toBeTruthy();
      });
    });

    it('should show warning when allowlist fetch fails', async () => {
      mockGetMfcCookieAllowlist.mockRejectedValue(new Error('Network error'));

      render(<MfcCookiesModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/using defaults/i)).toBeInTheDocument();
      });
    });

    it('should show Loading... while allowlist is fetching', () => {
      // Never resolve the promise
      mockGetMfcCookieAllowlist.mockReturnValue(new Promise(() => {}));

      render(<MfcCookiesModal {...defaultProps} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Copy script button', () => {
    it('should have a copy button that is enabled after allowlist loads', async () => {
      render(<MfcCookiesModal {...defaultProps} />);

      await waitFor(() => {
        const copyBtn = screen.getByRole('button', { name: /copy/i });
        expect(copyBtn).toBeInTheDocument();
        expect(copyBtn).not.toBeDisabled();
      }, { timeout: 10000 });
    }, 15000);

    it('should disable copy button while allowlist is loading', () => {
      mockGetMfcCookieAllowlist.mockReturnValue(new Promise(() => {}));

      render(<MfcCookiesModal {...defaultProps} />);

      const copyBtn = screen.getByRole('button', { name: /copy/i });
      expect(copyBtn).toBeDisabled();
    });
  });

  describe('Modal close', () => {
    it('should call onClose when modal is closed', async () => {
      const user = userEvent.setup();
      render(<MfcCookiesModal {...defaultProps} />);

      // Chakra v3 renders the close control as Dialog.CloseTrigger
      // (data-scope="dialog" data-part="close-trigger"), which has no
      // accessible label, so query it via its dialog part attributes.
      const closeButton = document.body.querySelector(
        '[data-scope="dialog"][data-part="close-trigger"]'
      ) as HTMLElement;
      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });
});
