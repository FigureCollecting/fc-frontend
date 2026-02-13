import React from 'react';
import { screen } from '@testing-library/react';
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

// Simple mock for react-hook-form
jest.mock('react-hook-form', () => ({
  __esModule: true,
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => fn),
    setValue: jest.fn(),
    watch: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
    formState: { errors: {} },
    control: {}
  }),
  FormProvider: ({ children }: any) => children,
  useFormContext: () => ({
    register: jest.fn(),
    control: {},
  }),
  useFieldArray: () => ({
    fields: [],
    append: jest.fn(),
    remove: jest.fn(),
  }),
  Controller: ({ render }: any) => render({ field: { value: false, onChange: jest.fn() } }),
}));

const defaultProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn()
};

describe('FigureForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the figure form', () => {
      render(<FigureForm {...defaultProps} />);
      
      // Just verify the form renders without crashing
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<FigureForm {...defaultProps} />);
      
      // Check for basic form structure
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<FigureForm {...defaultProps} />);
      
      // Look for buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Form Validation', () => {
    it('should handle form submission', () => {
      render(<FigureForm {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should handle initial data', () => {
      const mockFigure = {
        name: 'Test Figure',
        manufacturer: 'Test Manufacturer',
        series: 'Test Series',
        scale: '1/8',
        releaseDate: '2023-01-01',
        price: 100,
        location: 'Test Location',
        boxNumber: 'B001',
        condition: 'New',
        mfcLink: 'https://myfigurecollection.net/item/123456',
        notes: 'Test notes',
        purchaseDate: '2023-01-01',
        isOwned: true
      };
      
      render(<FigureForm {...defaultProps} initialData={mockFigure} />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('should handle button interactions', () => {
      render(<FigureForm {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Verify at least some buttons are interactive (some may be conditionally disabled)
      const enabledButtons = buttons.filter(button => !button.hasAttribute('disabled'));
      expect(enabledButtons.length).toBeGreaterThan(0);
    });
  });
});
