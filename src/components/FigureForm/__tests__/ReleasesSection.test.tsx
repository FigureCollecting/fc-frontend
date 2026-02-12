/**
 * ReleasesSection TDD Tests
 *
 * Tests for the releases array section in the figure form.
 * Manages multiple release entries with date, price, currency, JAN, and isRerelease.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../test-utils';
import ReleasesSection from '../ReleasesSection';
import { useForm, FormProvider } from 'react-hook-form';
import { FigureFormData } from '../../../types';

// Wrapper component to provide react-hook-form context
const TestWrapper: React.FC<{ defaultValues?: Partial<FigureFormData>; children: React.ReactNode }> = ({
  defaultValues = {},
  children,
}) => {
  const methods = useForm<FigureFormData>({
    defaultValues: {
      manufacturer: '',
      name: '',
      scale: '',
      releases: [],
      ...defaultValues,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ReleasesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the section heading', () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      const headings = screen.getAllByText(/Releases/i);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Add Release button', () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /add release/i })).toBeInTheDocument();
    });

    it('should render empty state when no releases exist', () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByText(/no releases added/i)).toBeInTheDocument();
    });
  });

  describe('Displaying Existing Releases', () => {
    it('should display existing releases when editing', () => {
      const existingReleases = [
        { date: '2024-01', price: 15000, currency: 'JPY', jan: '4562301520123', isRerelease: false },
        { date: '2025-06', price: 16000, currency: 'JPY', jan: '4562301520456', isRerelease: true },
      ];

      render(
        <TestWrapper defaultValues={{ releases: existingReleases }}>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('2024-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06')).toBeInTheDocument();
    });

    it('should display price and currency for existing releases', () => {
      const existingReleases = [
        { date: '2024-01', price: 15000, currency: 'JPY', isRerelease: false },
      ];

      render(
        <TestWrapper defaultValues={{ releases: existingReleases }}>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
    });

    it('should display JAN barcode for existing releases', () => {
      const existingReleases = [
        { date: '2024-01', price: 15000, currency: 'JPY', jan: '4562301520123', isRerelease: false },
      ];

      render(
        <TestWrapper defaultValues={{ releases: existingReleases }}>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('4562301520123')).toBeInTheDocument();
    });
  });

  describe('Adding Releases', () => {
    it('should add new release row when Add button clicked', async () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add release/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/yyyy-mm/i)).toBeInTheDocument();
      });
    });

    it('should add multiple release rows', async () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add release/i });

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/yyyy-mm/i)).toHaveLength(1);
      });

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/yyyy-mm/i)).toHaveLength(2);
      });
    });
  });

  describe('Removing Releases', () => {
    it('should show delete button for each release', () => {
      const existingReleases = [
        { date: '2024-01', price: 15000, currency: 'JPY', isRerelease: false },
      ];

      render(
        <TestWrapper defaultValues={{ releases: existingReleases }}>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    it('should remove release when delete clicked', async () => {
      const existingReleases = [
        { date: '2024-01', price: 15000, currency: 'JPY', isRerelease: false },
        { date: '2025-06', price: 16000, currency: 'JPY', isRerelease: true },
      ];

      render(
        <TestWrapper defaultValues={{ releases: existingReleases }}>
          <ReleasesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('2024-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06')).toBeInTheDocument();

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('2024-01')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('2025-06')).toBeInTheDocument();
      });
    });
  });

  describe('Rerelease Checkbox', () => {
    it('should show isRerelease checkbox for each release', async () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add release/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /rerelease/i })).toBeInTheDocument();
      });
    });

    it('should mark rerelease checkbox when isRerelease is true', () => {
      const existingReleases = [
        { date: '2024-01', price: 15000, currency: 'JPY', isRerelease: true },
      ];

      render(
        <TestWrapper defaultValues={{ releases: existingReleases }}>
          <ReleasesSection />
        </TestWrapper>
      );

      const checkbox = screen.getByRole('checkbox', { name: /rerelease/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe('Currency Selection', () => {
    it('should show currency dropdown', async () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add release/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const currencySelect = screen.getByRole('combobox', { name: /currency/i });
        expect(currencySelect).toBeInTheDocument();
      });
    });

    it('should default to JPY currency', async () => {
      render(
        <TestWrapper>
          <ReleasesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add release/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const currencySelect = screen.getByRole('combobox', { name: /currency/i });
        expect(currencySelect).toHaveValue('JPY');
      });
    });
  });
});
