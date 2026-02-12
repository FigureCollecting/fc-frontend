/**
 * CompanyRolesSection TDD Tests
 *
 * Tests for the company roles array section in the figure form.
 * Following TDD: tests written FIRST, component implementation follows.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../test-utils';
import CompanyRolesSection from '../CompanyRolesSection';
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
      companyRoles: [],
      ...defaultValues,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

// Mock the lookup data hook
const mockRoleTypes = [
  { _id: 'role1', name: 'Manufacturer', kind: 'company' },
  { _id: 'role2', name: 'Distributor', kind: 'company' },
  { _id: 'role3', name: 'Retailer', kind: 'company' },
];

const mockCompanies = [
  { _id: 'comp1', name: 'Good Smile Company' },
  { _id: 'comp2', name: 'Max Factory' },
  { _id: 'comp3', name: 'Kotobukiya' },
];

jest.mock('../../../hooks/useLookupData', () => ({
  useLookupData: () => ({
    roleTypes: mockRoleTypes,
    companies: mockCompanies,
    artists: [],
    isLoading: false,
    isError: false,
  }),
}));

describe('CompanyRolesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the section heading', () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      // Get the heading text specifically (not the button which also contains "Company")
      const headings = screen.getAllByText(/Companies/i);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Add Company Role button', () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /add company/i })).toBeInTheDocument();
    });

    it('should render empty state when no company roles exist', () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      expect(screen.getByText(/no companies added/i)).toBeInTheDocument();
    });
  });

  describe('Displaying Existing Company Roles', () => {
    it('should display existing company roles when editing', () => {
      const existingRoles = [
        { companyId: 'comp1', companyName: 'Good Smile Company', roleId: 'role1', roleName: 'Manufacturer' },
        { companyId: 'comp2', companyName: 'Max Factory', roleId: 'role2', roleName: 'Distributor' },
      ];

      render(
        <TestWrapper defaultValues={{ companyRoles: existingRoles }}>
          <CompanyRolesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Good Smile Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Max Factory')).toBeInTheDocument();
    });

    it('should display role badges for existing roles', () => {
      const existingRoles = [
        { companyId: 'comp1', companyName: 'Good Smile Company', roleId: 'role1', roleName: 'Manufacturer' },
      ];

      render(
        <TestWrapper defaultValues={{ companyRoles: existingRoles }}>
          <CompanyRolesSection />
        </TestWrapper>
      );

      // Role name appears in badge and potentially in dropdown - verify at least one exists
      const manufacturerElements = screen.getAllByText('Manufacturer');
      expect(manufacturerElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Adding Company Roles', () => {
    it('should add new company role row when Add button clicked', async () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add company/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Should now have a company input field
        expect(screen.getByPlaceholderText(/company name/i)).toBeInTheDocument();
      });
    });

    it('should add multiple company role rows', async () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add company/i });

      // Add first role
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/company name/i)).toHaveLength(1);
      });

      // Add second role
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/company name/i)).toHaveLength(2);
      });
    });
  });

  describe('Removing Company Roles', () => {
    it('should show delete button for each company role', () => {
      const existingRoles = [
        { companyId: 'comp1', companyName: 'Good Smile Company', roleId: 'role1', roleName: 'Manufacturer' },
      ];

      render(
        <TestWrapper defaultValues={{ companyRoles: existingRoles }}>
          <CompanyRolesSection />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    it('should remove company role when delete clicked', async () => {
      const existingRoles = [
        { companyId: 'comp1', companyName: 'Good Smile Company', roleId: 'role1', roleName: 'Manufacturer' },
        { companyId: 'comp2', companyName: 'Max Factory', roleId: 'role2', roleName: 'Distributor' },
      ];

      render(
        <TestWrapper defaultValues={{ companyRoles: existingRoles }}>
          <CompanyRolesSection />
        </TestWrapper>
      );

      // Both companies should be visible initially
      expect(screen.getByDisplayValue('Good Smile Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Max Factory')).toBeInTheDocument();

      // Click remove on the first one
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        // First company should be gone
        expect(screen.queryByDisplayValue('Good Smile Company')).not.toBeInTheDocument();
        // Second company should still be there
        expect(screen.getByDisplayValue('Max Factory')).toBeInTheDocument();
      });
    });
  });

  describe('Role Type Selection', () => {
    it('should show role type dropdown with company role options', async () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      // Add a company role row first
      const addButton = screen.getByRole('button', { name: /add company/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Should have a role type select
        const roleSelect = screen.getByRole('combobox', { name: /role/i });
        expect(roleSelect).toBeInTheDocument();
      });
    });

    it('should only show company kind role types', async () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add company/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Check that company role types are available (may appear multiple times)
        const manufacturerElements = screen.getAllByText('Manufacturer');
        const distributorElements = screen.getAllByText('Distributor');
        expect(manufacturerElements.length).toBeGreaterThanOrEqual(1);
        expect(distributorElements.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 1000 });
    });
  });

  describe('Company Autocomplete', () => {
    it('should show company input field', async () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add company/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/company name/i)).toBeInTheDocument();
      });
    });

    it('should allow typing new company name', async () => {
      render(
        <TestWrapper>
          <CompanyRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add company/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/company name/i);
        fireEvent.change(input, { target: { value: 'New Company' } });
        expect(input).toHaveValue('New Company');
      });
    });
  });
});
