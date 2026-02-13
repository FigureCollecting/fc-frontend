/**
 * TDD Tests for Schema v3.0 fields: quantity and note
 *
 * These tests are written FIRST (TDD red phase).
 * Implementation will follow to make them pass.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FigureForm from '../FigureForm';
import { ChakraProvider } from '@chakra-ui/react';
import { Figure, FigureFormData } from '../../types';

// Mock usePublicConfigs
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

// Mock crypto utilities
jest.mock('../../utils/crypto', () => ({
  storeMfcCookies: jest.fn(),
  retrieveMfcCookies: jest.fn().mockResolvedValue(null),
  clearMfcCookies: jest.fn(),
  getStorageType: jest.fn().mockReturnValue('session'),
  hasMfcCookies: jest.fn().mockReturnValue(false),
}));

const mockOnSubmit = jest.fn();

const renderFigureForm = (props: Partial<React.ComponentProps<typeof FigureForm>> = {}) => {
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
    ...props,
  };

  return render(
    <ChakraProvider>
      <FigureForm {...defaultProps} />
    </ChakraProvider>
  );
};

describe('FigureForm - Quantity Field (Schema v3.0)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render a quantity input field', () => {
      renderFigureForm();

      // Use exact match for the input field's aria-label
      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i });
      expect(quantityInput).toBeInTheDocument();
    });

    it('should have quantity field with default value of 1', () => {
      renderFigureForm();

      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i }) as HTMLInputElement;
      expect(quantityInput.value).toBe('1');
    });

    it('should display quantity from initialData when editing', () => {
      const initialData = {
        _id: '123',
        manufacturer: 'Test',
        name: 'Test Figure',
        scale: '1/7',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        quantity: 3,
      } as Figure;

      renderFigureForm({ initialData });

      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i }) as HTMLInputElement;
      expect(quantityInput.value).toBe('3');
    });
  });

  describe('Validation', () => {
    it('should not allow quantity less than 1', async () => {
      renderFigureForm();

      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i }) as HTMLInputElement;

      // Chakra NumberInput enforces min via component logic, not HTML attribute
      // When value goes below min, it resets to min on blur
      // Use fireEvent for more direct control
      fireEvent.change(quantityInput, { target: { value: '0' } });
      fireEvent.blur(quantityInput);

      // Wait for Chakra's validation to enforce min value
      await waitFor(() => {
        expect(quantityInput.value).toBe('1');
      });
    });

    it('should allow incrementing quantity', async () => {
      renderFigureForm();

      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i }) as HTMLInputElement;

      // Find increment button (Chakra NumberInputStepper)
      const incrementButton = screen.getByLabelText(/increment quantity/i);
      await userEvent.click(incrementButton);

      expect(quantityInput.value).toBe('2');
    });
  });

  describe('Form Submission', () => {
    it('should include quantity in form submission', async () => {
      renderFigureForm();

      // Fill required field (name is required when no mfcLink)
      await userEvent.type(screen.getByLabelText(/figure name/i), 'Test Figure');

      // Set quantity to 2 - use fireEvent.change for direct value setting
      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i });
      fireEvent.change(quantityInput, { target: { value: '2' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /^save$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ quantity: 2 }),
          expect.any(Boolean)
        );
      }, { timeout: 10000 });
    }, 15000);
  });
});

describe('FigureForm - Note Field (Schema v3.0)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render a note textarea field', () => {
      renderFigureForm();

      // Use role 'textbox' with name for more specific matching
      const noteInput = screen.getByRole('textbox', { name: /^note$/i });
      expect(noteInput).toBeInTheDocument();
      expect(noteInput.tagName.toLowerCase()).toBe('textarea');
    });

    it('should display note from initialData when editing', () => {
      const initialData = {
        _id: '123',
        manufacturer: 'Test',
        name: 'Test Figure',
        scale: '1/7',
        userId: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        note: 'This is my favorite figure!',
      } as Figure;

      renderFigureForm({ initialData });

      const noteInput = screen.getByRole('textbox', { name: /^note$/i }) as HTMLTextAreaElement;
      expect(noteInput.value).toBe('This is my favorite figure!');
    });

    it('should have placeholder text for note field', () => {
      renderFigureForm();

      const noteInput = screen.getByRole('textbox', { name: /^note$/i });
      expect(noteInput).toHaveAttribute('placeholder');
    });
  });

  describe('User Input', () => {
    it('should allow typing in the note field', async () => {
      renderFigureForm();

      const noteInput = screen.getByRole('textbox', { name: /^note$/i });
      await userEvent.type(noteInput, 'Great condition, no box damage');

      expect(noteInput).toHaveValue('Great condition, no box damage');
    });

    it('should preserve note content after other form interactions', async () => {
      renderFigureForm();

      const noteInput = screen.getByRole('textbox', { name: /^note$/i });
      await userEvent.type(noteInput, 'My note content');

      // Interact with another field (using name field since manufacturer was removed)
      const nameInput = screen.getByLabelText(/figure name/i);
      await userEvent.type(nameInput, 'Test Figure');

      // Note should still have its content
      expect(noteInput).toHaveValue('My note content');
    });
  });

  describe('Form Submission', () => {
    it('should include note in form submission', async () => {
      renderFigureForm();

      // Fill required field (name is required when no mfcLink)
      await userEvent.type(screen.getByLabelText(/figure name/i), 'Test Figure');

      // Add a note
      const noteInput = screen.getByRole('textbox', { name: /^note$/i });
      await userEvent.type(noteInput, 'Bought at convention');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /^save$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ note: 'Bought at convention' }),
          expect.any(Boolean)
        );
      });
    });

    it('should allow empty note on submission', async () => {
      renderFigureForm();

      // Fill required field only (name is required when no mfcLink)
      await userEvent.type(screen.getByLabelText(/figure name/i), 'Test Figure');

      // Submit form without note
      const submitButton = screen.getByRole('button', { name: /^save$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        // Note should be empty string or undefined
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.note === '' || submittedData.note === undefined).toBe(true);
      });
    });
  });

  describe('Form Reset', () => {
    it('should start with empty note on new form render', async () => {
      // Simply verify new form starts with empty note
      renderFigureForm();

      const noteInput = screen.getByRole('textbox', { name: /^note$/i });
      expect(noteInput).toHaveValue('');
    });
  });
});

describe('FigureForm - Quantity and Note Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should submit both quantity and note together', async () => {
    renderFigureForm();

    // Fill required field (name is required when no mfcLink)
    await userEvent.type(screen.getByLabelText(/figure name/i), 'Limited Edition Figure');

    // Set quantity - use fireEvent.change for direct value setting
    const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i });
    fireEvent.change(quantityInput, { target: { value: '2' } });

    // Add note
    const noteInput = screen.getByRole('textbox', { name: /^note$/i });
    await userEvent.type(noteInput, 'Bought 2 for collecting and display');

    // Submit
    const submitButton = screen.getByRole('button', { name: /^save$/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 2,
          note: 'Bought 2 for collecting and display',
        }),
        expect.any(Boolean)
      );
    }, { timeout: 10000 });
  }, 15000);

  it('should preserve quantity and note when editing existing figure', () => {
    const initialData = {
      _id: '123',
      manufacturer: 'Max Factory',
      name: 'figma Link',
      scale: 'figma',
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quantity: 5,
      note: 'Complete set with all accessories',
    } as Figure;

    renderFigureForm({ initialData });

    const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i }) as HTMLInputElement;
    const noteInput = screen.getByRole('textbox', { name: /^note$/i }) as HTMLTextAreaElement;

    expect(quantityInput.value).toBe('5');
    expect(noteInput.value).toBe('Complete set with all accessories');
  });
});
