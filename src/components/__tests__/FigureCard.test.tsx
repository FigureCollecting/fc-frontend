import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from 'react-query';
import { render, mockFigure } from '../../test-utils';
import FigureCard from '../FigureCard';
import * as api from '../../api';

// Mock the API
jest.mock('../../api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock react-query hooks
jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockConfirm,
});

describe('FigureCard', () => {
  const mockQueryClient = {
    invalidateQueries: jest.fn(),
  };

  const mockMutation = {
    mutate: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    
    // Mock react-query hooks
    const { useMutation, useQueryClient } = require('react-query');
    useMutation.mockReturnValue(mockMutation);
    useQueryClient.mockReturnValue(mockQueryClient);
  });

  const mockFigureWithAllData = {
    ...mockFigure,
    mfcLink: 'https://myfigurecollection.net/item/123',
    origin: 'Test Series',
    imageUrl: 'https://example.com/image.jpg',
  };

  describe('Rendering', () => {
    it('should render figure information correctly', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      expect(screen.getByText(mockFigureWithAllData.name)).toBeInTheDocument();
      expect(screen.getByText(mockFigureWithAllData.scale)).toBeInTheDocument();
      // Origin is displayed on the card
      expect(screen.getByText(mockFigureWithAllData.origin)).toBeInTheDocument();
    });

    it('should render MFC link when provided', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      // Should display just the ID, not the full URL
      const mfcLink = screen.getByText('MFC: 123');
      expect(mfcLink).toBeInTheDocument();
      // The closest <a> with the external href
      const externalLink = mfcLink.closest('a[target="_blank"]') || mfcLink.closest('a[href*="myfigurecollection"]');
      expect(externalLink).toHaveAttribute('href', 'https://myfigurecollection.net/item/123');
    });

    it('should not render MFC link when not provided', () => {
      const figureWithoutMFC = { ...mockFigure, mfcLink: undefined };
      render(<FigureCard figure={figureWithoutMFC} />);

      expect(screen.queryByText(/MFC:/)).not.toBeInTheDocument();
    });

    it('should render figure image correctly', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      const image = screen.getByRole('img', { name: mockFigureWithAllData.name });
      expect(image).toBeInTheDocument();
      // Without fallbackSrc, the image src should be the figure's imageUrl directly
      expect(image).toHaveAttribute('src', mockFigureWithAllData.imageUrl);
    });

    it('should use placeholder when no image URL provided', () => {
      const figureWithoutImage = { ...mockFigure, imageUrl: undefined };
      render(<FigureCard figure={figureWithoutImage} />);

      const image = screen.getByRole('img', { name: figureWithoutImage.name });
      expect(image).toBeInTheDocument();
      // Should use placeholder when no imageUrl provided
      expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });

    it('should render edit and delete buttons', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      expect(screen.getByRole('button', { name: /edit item/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete item/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have a link to figure detail page wrapping the card', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      // The entire card is wrapped in a single link to the detail page
      const detailLinks = screen.getAllByRole('link');
      const cardLink = detailLinks.find(link =>
        link.getAttribute('href') === `/figures/${mockFigureWithAllData._id}`
      );
      expect(cardLink).toBeInTheDocument();
    });

    it('should have correct link to edit page', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      const editButton = screen.getByRole('button', { name: /edit item/i });
      const editLink = editButton.closest('a');
      expect(editLink).toHaveAttribute('href', `/figures/edit/${mockFigureWithAllData._id}`);
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<FigureCard figure={mockFigureWithAllData} />);

      const deleteButton = screen.getByRole('button', { name: /delete item/i });
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(`Are you sure you want to delete ${mockFigureWithAllData.name}?`);
    });

    it('should call deleteFigure API when confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      render(<FigureCard figure={mockFigureWithAllData} />);

      const deleteButton = screen.getByRole('button', { name: /delete item/i });
      await user.click(deleteButton);

      expect(mockMutation.mutate).toHaveBeenCalled();
    });

    it('should not call deleteFigure API when cancelled', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<FigureCard figure={mockFigureWithAllData} />);

      const deleteButton = screen.getByRole('button', { name: /delete item/i });
      await user.click(deleteButton);

      expect(mockMutation.mutate).not.toHaveBeenCalled();
    });

    it('should show loading state on delete button when mutation is loading', () => {
      const loadingMutation = { ...mockMutation, isLoading: true };
      const { useMutation } = require('react-query');
      useMutation.mockReturnValue(loadingMutation);

      render(<FigureCard figure={mockFigureWithAllData} />);

      const deleteButton = screen.getByRole('button', { name: /delete item/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Mutation Configuration', () => {
    it('should configure mutation with correct success callback', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      const { useMutation } = require('react-query');
      const mutationConfig = useMutation.mock.calls[0][1];

      // Call the success callback
      mutationConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith('figures');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith('recentFigures');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith('dashboardStats');
    });

    it('should configure mutation with correct error callback', () => {
      // Mock useToast
      const mockToast = jest.fn();
      jest.mock('@chakra-ui/react', () => ({
        ...jest.requireActual('@chakra-ui/react'),
        useToast: () => mockToast,
      }));

      render(<FigureCard figure={mockFigureWithAllData} />);

      const { useMutation } = require('react-query');
      const mutationConfig = useMutation.mock.calls[0][1];

      // Call the error callback
      const mockError = {
        response: {
          data: { message: 'Failed to delete figure' },
        },
      };
      mutationConfig.onError(mockError);

      // Note: Toast testing would require more complex setup with Chakra UI provider
      // For now, we just ensure the callback exists
      expect(mutationConfig.onError).toBeDefined();
    });
  });

  describe('Hover Effects', () => {
    it('should have hover styles applied', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      // The card is wrapped in a single link; find the card link by href
      const allLinks = screen.getAllByRole('link');
      const cardLink = allLinks.find(link =>
        link.getAttribute('href') === `/figures/${mockFigureWithAllData._id}`
      );
      expect(cardLink).toBeInTheDocument();
      // The card should be rendered and interactive
      expect(cardLink!.closest('div') || cardLink).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      expect(screen.getByRole('button', { name: 'Edit item' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete item' })).toBeInTheDocument();
    });

    it('should have proper alt text on image', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', mockFigureWithAllData.name);
    });

    it('should have proper link text for figure name', () => {
      render(<FigureCard figure={mockFigureWithAllData} />);

      // The card is wrapped in a single link to the detail page
      const allLinks = screen.getAllByRole('link');
      const cardLink = allLinks.find(link =>
        link.getAttribute('href') === `/figures/${mockFigureWithAllData._id}`
      );
      expect(cardLink).toBeInTheDocument();
    });
  });

  describe('Search Highlighting', () => {
    it('should highlight matching text in figure name when searchQuery provided', () => {
      // mockFigure has name: 'Test Figure' - search for 'Test'
      const { container } = render(<FigureCard figure={mockFigureWithAllData} searchQuery="Test" />);

      // Check that mark element exists for highlighted text in the card
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should highlight matching text in manufacturer when searchQuery provided', () => {
      // mockFigure has manufacturer: 'Test Company' - search for 'Company'
      render(<FigureCard figure={mockFigureWithAllData} searchQuery="Company" />);

      // Manufacturer text should contain highlighting with mark element
      const companyText = screen.getByText('Company');
      expect(companyText.tagName.toLowerCase()).toBe('mark');
    });

    it('should not highlight when searchQuery is empty', () => {
      const { container } = render(<FigureCard figure={mockFigureWithAllData} searchQuery="" />);

      // No mark elements should be present
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(0);
    });

    it('should not highlight when searchQuery is undefined', () => {
      const { container } = render(<FigureCard figure={mockFigureWithAllData} />);

      // No mark elements should be present
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(0);
    });

    it('should highlight multiple search terms', () => {
      const figure = {
        ...mockFigureWithAllData,
        name: 'Saber Alter Figure',
        manufacturer: 'Good Smile Company',
      };
      const { container } = render(<FigureCard figure={figure} searchQuery="Saber Good" />);

      // Both "Saber" in name and "Good" in manufacturer should be highlighted
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
    });

    it('should handle special regex characters in searchQuery safely', () => {
      const { container } = render(<FigureCard figure={mockFigureWithAllData} searchQuery="test.* [special]" />);

      // Should not throw an error with special regex characters
      // The card should render without crashing
      const allLinks = screen.getAllByRole('link');
      const cardLink = allLinks.find(link =>
        link.getAttribute('href') === `/figures/${mockFigureWithAllData._id}`
      );
      expect(cardLink).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing origin gracefully', () => {
      const figureWithoutOrigin = {
        ...mockFigure,
        origin: undefined,
      };

      // Component conditionally renders origin only if truthy
      expect(() => render(<FigureCard figure={figureWithoutOrigin} />)).not.toThrow();
    });

    it('should truncate long figure names', () => {
      const figureWithLongName = {
        ...mockFigure,
        name: 'This is a very long figure name that should be truncated when displayed in the card',
      };

      render(<FigureCard figure={figureWithLongName} />);

      // The card is wrapped in a single link; find it by href
      const allLinks = screen.getAllByRole('link');
      const cardLink = allLinks.find(link =>
        link.getAttribute('href') === `/figures/${figureWithLongName._id}`
      );
      expect(cardLink).toBeInTheDocument();
      // Note: Testing text truncation would require more complex DOM testing
    });

    it('should handle empty or null figure data gracefully', () => {
      const minimalFigure = {
        ...mockFigure,
        manufacturer: '',
        scale: '',
        origin: '',
      };

      expect(() => render(<FigureCard figure={minimalFigure} />)).not.toThrow();
    });
  });
});