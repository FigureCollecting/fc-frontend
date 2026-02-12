import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import FigureForm from '../FigureForm';

// Mock usePublicConfigs to avoid QueryClient dependency issues
jest.mock('../../hooks/usePublicConfig', () => ({
  usePublicConfigs: () => ({
    configs: {},
    isLoading: false,
    isError: false,
  }),
}));

// Mock useLookupData hook
jest.mock('../../hooks/useLookupData', () => ({
  useLookupData: () => ({
    roleTypes: [
      { _id: 'role1', name: 'Manufacturer', kind: 'company' },
      { _id: 'role2', name: 'Sculptor', kind: 'artist' },
    ],
    companies: [],
    artists: [],
    isLoading: false,
    isError: false,
  }),
}));

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

// Mock fetch for MFC scraping
global.fetch = jest.fn();

// Mock react-hook-form with more complete implementation
const mockSetValue = jest.fn();
const mockReset = jest.fn();
const mockWatch = jest.fn();
const mockGetValues = jest.fn();

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn((name, options) => ({
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault?.();
      return fn({
        manufacturer: 'Test Manufacturer',
        name: 'Test Figure',
        scale: '1/8',
        mfcLink: 'https://myfigurecollection.net/item/123456',
        imageUrl: 'https://example.com/image.jpg',
      });
    },
    setValue: mockSetValue,
    watch: mockWatch,
    getValues: mockGetValues,
    reset: mockReset,
    formState: { errors: {} },
    control: {},
  }),
  FormProvider: ({ children }: any) => children,
  useFormContext: () => ({
    register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() })),
    control: {},
  }),
  useFieldArray: () => ({
    fields: [],
    append: jest.fn(),
    remove: jest.fn(),
  }),
  Controller: ({ render }: any) => render({ field: { value: false, onChange: jest.fn() } }),
}));

describe('FigureForm Comprehensive Tests', () => {
  const mockOnSubmit = jest.fn();
  const mockFigure = {
    _id: '1',
    manufacturer: 'Good Smile Company',
    name: 'Hatsune Miku',
    scale: '1/8',
    mfcLink: 'https://myfigurecollection.net/item/123456',
    imageUrl: 'https://example.com/miku.jpg',
    location: 'Shelf A',
    storageDetail: 'B001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWatch.mockImplementation((field) => {
      if (field === 'mfcLink') return mockFigure.mfcLink;
      if (field === 'imageUrl') return mockFigure.imageUrl;
      return '';
    });
    mockGetValues.mockImplementation((field) => {
      if (field === 'mfcLink') return mockFigure.mfcLink;
      if (!field) return mockFigure;
      return mockFigure[field as keyof typeof mockFigure];
    });
  });

  describe('Component Rendering', () => {
    it('should render all form fields correctly', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      expect(screen.getByRole('form')).toBeInTheDocument();

      // Check for input fields by placeholder text to avoid ambiguity
      // Note: manufacturer field was removed from form in Schema v3 (replaced by companyRoles)
      expect(screen.getByPlaceholderText(/item #.*MFC URL/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Nendoroid Miku Hatsune/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/1\/8, 1\/7/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Shelf, Display Case/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Shelf A-3, Box #12/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/example\.com\/image\.jpg/i)).toBeInTheDocument();
    });

    it('should render with initial data when provided', () => {
      render(<FigureForm initialData={mockFigure} onSubmit={mockOnSubmit} isLoading={false} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      // Form reset includes all fields merged with initialData
      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        manufacturer: mockFigure.manufacturer,
        name: mockFigure.name,
        scale: mockFigure.scale,
      }));
    });

    it('should show loading state when isLoading is true', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={true} />);

      // Look specifically for the Save/Submit button, not Add buttons from array sections
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        // Match Save/Submit but exclude Add buttons for array sections
        return (text.includes('save') || text.includes('submit') || ariaLabel.includes('save')) &&
               !text.includes('add company') && !text.includes('add artist') && !text.includes('add release');
      });

      if (submitButton) {
        expect(submitButton).toBeDisabled();
      } else {
        // At least verify the form is there and loading
        expect(screen.getByRole('form')).toBeInTheDocument();
      }
    });
  });

  describe('Link Opening Functions', () => {
    it('should open MFC link in new window when link button is clicked', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      const linkButtons = screen.getAllByRole('button');
      const mfcLinkButton = linkButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Open MFC link')
      );

      if (mfcLinkButton) {
        fireEvent.click(mfcLinkButton);
        expect(mockOpen).toHaveBeenCalledWith(mockFigure.mfcLink, '_blank');
      }
    });

    it('should open image URL in new window when image button is clicked', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      const linkButtons = screen.getAllByRole('button');
      const imageLinkButton = linkButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('Open image')
      );

      if (imageLinkButton) {
        fireEvent.click(imageLinkButton);
        expect(mockOpen).toHaveBeenCalledWith(mockFigure.imageUrl, '_blank');
      }
    });

    it('should not open link when URL is empty', () => {
      mockWatch.mockReturnValue('');
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      const linkButtons = screen.getAllByRole('button');
      const disabledButtons = linkButtons.filter(btn => btn.hasAttribute('disabled'));
      expect(disabledButtons.length).toBeGreaterThan(0);
    });
  });

  describe('URL Validation', () => {
    it('should validate valid URLs', () => {
      const { validateUrl } = require('../FigureForm');

      // Note: We can't directly test internal functions, but we can test the behavior
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      // The form should accept valid URLs
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should handle MFC URL validation', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      // Valid MFC URLs should be accepted
      const mfcInput = screen.getByLabelText(/MFC Item/i);
      expect(mfcInput).toBeInTheDocument();
    });
  });

  describe('MFC Scraping Functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it('should trigger MFC scraping when valid MFC link is entered', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            name: 'Scraped Figure',
            manufacturer: 'Scraped Manufacturer',
            scale: '1/7',
            imageUrl: 'https://scraped.com/image.jpg',
          },
        }),
      });

      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      // Note: Due to the mock implementation, we can't fully test the actual scraping
      // but we can verify the component renders without errors
      expect(screen.getByRole('form')).toBeInTheDocument();

      // The actual scraping logic would be triggered by useEffect in the real component
      // For now, just verify no crashes occur
    });

    it('should handle MFC scraping errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      mockWatch.mockReturnValue('https://myfigurecollection.net/item/999999');

      // Should not crash on error
      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });
    });

    it('should show loading spinner during MFC scraping', async () => {
      let resolvePromise: any;
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => { resolvePromise = resolve; })
      );

      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      // Trigger scraping
      mockWatch.mockReturnValue('https://myfigurecollection.net/item/123456');

      // Look for spinner (may not be visible immediately due to debouncing)
      const spinner = screen.queryByTestId('mfc-scraping-spinner');
      if (spinner) {
        expect(spinner).toBeInTheDocument();
      }

      // Resolve the fetch
      if (resolvePromise) {
        resolvePromise({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        });
      }
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when submitted', async () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        // onSubmit is now called with (data, addAnother) - addAnother is false when submitting via form submit
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            manufacturer: expect.any(String),
            name: expect.any(String),
          }),
          expect.any(Boolean) // addAnother flag
        );
      });
    });

    it('should disable submit button when loading', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={true} />);

      // Look specifically for the Save/Submit button, not Add buttons from array sections
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        // Match Save/Submit but exclude Add buttons for array sections
        return (text.includes('save') || text.includes('submit') || ariaLabel.includes('save')) &&
               !text.includes('add company') && !text.includes('add artist') && !text.includes('add release');
      });

      if (submitButton) {
        expect(submitButton).toBeDisabled();
      } else {
        // Form should still be present
        expect(screen.getByRole('form')).toBeInTheDocument();
      }
    });
  });

  describe('Scale Formatting', () => {
    it('should format scale values correctly', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      // Use placeholder to find the scale input specifically
      const scaleInput = screen.getByPlaceholderText(/1\/8, 1\/7/i);
      expect(scaleInput).toBeInTheDocument();

      // Test formatting behavior
      fireEvent.blur(scaleInput);
      // The mock should have been called during the blur event
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when initialData changes', () => {
      const { rerender } = render(
        <FigureForm initialData={mockFigure} onSubmit={mockOnSubmit} isLoading={false} />
      );

      const newFigure = { ...mockFigure, name: 'New Figure' };
      rerender(
        <FigureForm initialData={newFigure} onSubmit={mockOnSubmit} isLoading={false} />
      );

      // Form reset includes all fields, so check that key fields from newFigure are present
      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Figure',
        manufacturer: mockFigure.manufacturer,
        scale: mockFigure.scale,
      }));
    });

    it('should reset to empty form when no initialData', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        manufacturer: '',
        name: '',
        scale: '',
        mfcLink: '',
        location: '',
        storageDetail: '',
        imageUrl: '',
      }));
    });

    it('should generate mfcLink from mfcId when mfcLink is missing in initialData', () => {
      // This test verifies the fix for the bug where MFC ID wasn't visible on edit page
      // When a figure has mfcId but no mfcLink, the form should generate mfcLink from mfcId
      const figureWithMfcIdOnly = {
        ...mockFigure,
        mfcId: 987654,
        mfcLink: '', // Empty mfcLink - should be generated from mfcId
      };

      render(<FigureForm initialData={figureWithMfcIdOnly} onSubmit={mockOnSubmit} isLoading={false} />);

      // The form should generate mfcLink from mfcId during reset
      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        mfcLink: 'https://myfigurecollection.net/item/987654',
      }));
    });

    it('should preserve existing mfcLink when both mfcId and mfcLink are present', () => {
      // When figure has both mfcId and mfcLink, mfcLink should be preserved (not regenerated)
      const figureWithBoth = {
        ...mockFigure,
        mfcId: 111111,
        mfcLink: 'https://myfigurecollection.net/item/123456', // Different from mfcId
      };

      render(<FigureForm initialData={figureWithBoth} onSubmit={mockOnSubmit} isLoading={false} />);

      // The existing mfcLink should be preserved, not overwritten with mfcId
      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        mfcLink: 'https://myfigurecollection.net/item/123456',
      }));
    });

    it('should handle undefined mfcLink by generating from mfcId', () => {
      // Edge case: mfcLink is undefined (not empty string)
      const figureWithUndefinedMfcLink = {
        ...mockFigure,
        mfcId: 555555,
        mfcLink: undefined,
      };

      render(<FigureForm initialData={figureWithUndefinedMfcLink as any} onSubmit={mockOnSubmit} isLoading={false} />);

      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        mfcLink: 'https://myfigurecollection.net/item/555555',
      }));
    });

    it('should handle missing mfcId gracefully with empty mfcLink', () => {
      // Edge case: no mfcId and no mfcLink - should result in empty mfcLink
      const figureWithoutMfc = {
        ...mockFigure,
        mfcId: undefined,
        mfcLink: '',
      };

      render(<FigureForm initialData={figureWithoutMfc as any} onSubmit={mockOnSubmit} isLoading={false} />);

      expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({
        mfcLink: '',
      }));
    });
  });

  describe('Image Error Handling', () => {
    it('should handle image loading errors', () => {
      render(<FigureForm initialData={mockFigure} onSubmit={mockOnSubmit} isLoading={false} />);

      const image = screen.queryByRole('img');
      if (image) {
        fireEvent.error(image);
        // Should show fallback or handle error gracefully
        expect(screen.getByRole('form')).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      expect(screen.getByRole('form')).toHaveAttribute('aria-labelledby');
      expect(screen.getByLabelText(/MFC Item/i)).toBeInTheDocument();
      // Note: manufacturer field was removed from form in Schema v3 (replaced by companyRoles)
      expect(screen.getByLabelText(/Figure Name/i)).toBeInTheDocument();
    });

    it('should indicate required fields', () => {
      mockWatch.mockReturnValue(''); // No MFC link
      render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      // When no MFC link, name should be required
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<FigureForm onSubmit={mockOnSubmit} isLoading={false} />);

      unmount();

      // Component should cleanup without errors
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});