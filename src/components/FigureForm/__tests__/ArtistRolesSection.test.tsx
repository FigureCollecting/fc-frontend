/**
 * ArtistRolesSection TDD Tests
 *
 * Tests for the artist roles array section in the figure form.
 * Following TDD: tests written FIRST, component implementation follows.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../test-utils';
import ArtistRolesSection from '../ArtistRolesSection';
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
      artistRoles: [],
      ...defaultValues,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

// Mock the lookup data hook
const mockRoleTypes = [
  { _id: 'role1', name: 'Sculptor', kind: 'artist' },
  { _id: 'role2', name: 'Painter', kind: 'artist' },
  { _id: 'role3', name: 'Illustrator', kind: 'artist' },
];

const mockArtists = [
  { _id: 'artist1', name: 'Famous Sculptor' },
  { _id: 'artist2', name: 'Master Painter' },
];

jest.mock('../../../hooks/useLookupData', () => ({
  useLookupData: () => ({
    roleTypes: mockRoleTypes,
    companies: [],
    artists: mockArtists,
    isLoading: false,
    isError: false,
  }),
}));

describe('ArtistRolesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the section heading', () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      const headings = screen.getAllByText(/Artists/i);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it('should render Add Artist button', () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /add artist/i })).toBeInTheDocument();
    });

    it('should render empty state when no artist roles exist', () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      expect(screen.getByText(/no artists added/i)).toBeInTheDocument();
    });
  });

  describe('Displaying Existing Artist Roles', () => {
    it('should display existing artist roles when editing', () => {
      const existingRoles = [
        { artistId: 'artist1', artistName: 'Famous Sculptor', roleId: 'role1', roleName: 'Sculptor' },
        { artistId: 'artist2', artistName: 'Master Painter', roleId: 'role2', roleName: 'Painter' },
      ];

      render(
        <TestWrapper defaultValues={{ artistRoles: existingRoles }}>
          <ArtistRolesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Famous Sculptor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Master Painter')).toBeInTheDocument();
    });

    it('should display role badges for existing roles', () => {
      const existingRoles = [
        { artistId: 'artist1', artistName: 'Famous Sculptor', roleId: 'role1', roleName: 'Sculptor' },
      ];

      render(
        <TestWrapper defaultValues={{ artistRoles: existingRoles }}>
          <ArtistRolesSection />
        </TestWrapper>
      );

      const sculptorElements = screen.getAllByText('Sculptor');
      expect(sculptorElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Adding Artist Roles', () => {
    it('should add new artist role row when Add button clicked', async () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add artist/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/artist name/i)).toBeInTheDocument();
      });
    });

    it('should add multiple artist role rows', async () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add artist/i });

      // Add first role
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/artist name/i)).toHaveLength(1);
      });

      // Add second role
      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/artist name/i)).toHaveLength(2);
      });
    });
  });

  describe('Removing Artist Roles', () => {
    it('should show delete button for each artist role', () => {
      const existingRoles = [
        { artistId: 'artist1', artistName: 'Famous Sculptor', roleId: 'role1', roleName: 'Sculptor' },
      ];

      render(
        <TestWrapper defaultValues={{ artistRoles: existingRoles }}>
          <ArtistRolesSection />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    it('should remove artist role when delete clicked', async () => {
      const existingRoles = [
        { artistId: 'artist1', artistName: 'Famous Sculptor', roleId: 'role1', roleName: 'Sculptor' },
        { artistId: 'artist2', artistName: 'Master Painter', roleId: 'role2', roleName: 'Painter' },
      ];

      render(
        <TestWrapper defaultValues={{ artistRoles: existingRoles }}>
          <ArtistRolesSection />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Famous Sculptor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Master Painter')).toBeInTheDocument();

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Famous Sculptor')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('Master Painter')).toBeInTheDocument();
      });
    });
  });

  describe('Role Type Selection', () => {
    it('should show role type dropdown with artist role options', async () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add artist/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const roleSelect = screen.getByRole('combobox', { name: /role/i });
        expect(roleSelect).toBeInTheDocument();
      });
    });

    it('should only show artist kind role types', async () => {
      render(
        <TestWrapper>
          <ArtistRolesSection />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add artist/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        const sculptorElements = screen.getAllByText('Sculptor');
        const painterElements = screen.getAllByText('Painter');
        expect(sculptorElements.length).toBeGreaterThanOrEqual(1);
        expect(painterElements.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 1000 });
    });
  });
});
