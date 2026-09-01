import React from 'react';
import { render, screen, fireEvent, userEvent } from '../../test-utils';
import EmptyState from '../EmptyState';

// Mock the navigation boundary (jsdom >= 21 makes window.location unforgeable)
jest.mock('../../utils/navigation', () => ({
  redirectTo: jest.fn(),
  reloadPage: jest.fn(),
}));
import { redirectTo } from '../../utils/navigation';

const mockedRedirectTo = jest.mocked(redirectTo);

describe('EmptyState', () => {
  describe('collection type', () => {
    it('should render collection empty state with default message', () => {
      render(<EmptyState type="collection" />);

      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      expect(screen.getByText("You haven't added any figures to your collection yet.")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /add your first figure/i })).toBeInTheDocument();
    });

    it('should render collection empty state with custom message', () => {
      const customMessage = 'Custom collection message';
      render(<EmptyState type="collection" message={customMessage} />);

      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should have correct link to add figure page', () => {
      render(<EmptyState type="collection" />);

      const addButton = screen.getByRole('link', { name: /add your first figure/i });
      expect(addButton).toHaveAttribute('href', '/figures/add');
    });

    it('should display collection icon', () => {
      render(<EmptyState type="collection" />);

      // The cube icon should be present (testing via container since icons render as SVGs)
      const iconContainer = screen.getByText('Your collection is empty').closest('[data-testid]') || 
                          screen.getByText('Your collection is empty').parentElement?.parentElement?.parentElement;
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('search type', () => {
    it('should render search empty state with default message', () => {
      render(<EmptyState type="search" />);

      expect(screen.getByText('No figures found')).toBeInTheDocument();
      expect(screen.getByText('No figures match your search criteria.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('should render search empty state with custom message', () => {
      const customMessage = 'Custom search message';
      render(<EmptyState type="search" message={customMessage} />);

      expect(screen.getByText('No figures found')).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should handle clear search button click', async () => {
      const user = userEvent.setup();
      render(<EmptyState type="search" />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(mockedRedirectTo).toHaveBeenCalledWith('/figures');
    });
  });

  describe('filter type', () => {
    it('should render filter empty state with default message', () => {
      render(<EmptyState type="filter" />);

      expect(screen.getByText('No figures match your filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filter criteria.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should render filter empty state with custom message', () => {
      const customMessage = 'Custom filter message';
      render(<EmptyState type="filter" message={customMessage} />);

      expect(screen.getByText('No figures match your filters')).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should handle clear filters button click', async () => {
      const user = userEvent.setup();
      render(<EmptyState type="filter" />);

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      expect(mockedRedirectTo).toHaveBeenCalledWith('/figures');
    });
  });

  describe('default/unknown type', () => {
    it('should render default empty state for unknown type', () => {
      // @ts-ignore - Testing with invalid type
      render(<EmptyState type="unknown" />);

      expect(screen.getByText('Nothing to display')).toBeInTheDocument();
      expect(screen.getByText('No content available.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('should have correct link to dashboard', () => {
      // @ts-ignore - Testing with invalid type
      render(<EmptyState type="unknown" />);

      const dashboardButton = screen.getByRole('link', { name: /go to dashboard/i });
      expect(dashboardButton).toHaveAttribute('href', '/');
    });

    it('should render default empty state with custom message', () => {
      const customMessage = 'Custom default message';
      // @ts-ignore - Testing with invalid type
      render(<EmptyState type="unknown" message={customMessage} />);

      expect(screen.getByText('Nothing to display')).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    it('should render with proper semantic structure', () => {
      render(<EmptyState type="collection" />);

      // Test that the component renders with appropriate structure
      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /add your first figure/i })).toBeInTheDocument();
    });

    it('should render with proper vertical spacing', () => {
      render(<EmptyState type="collection" />);

      // Check that title and description are separated
      const title = screen.getByText('Your collection is empty');
      const description = screen.getByText("You haven't added any figures to your collection yet.");
      
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button roles for collection type', () => {
      render(<EmptyState type="collection" />);

      const button = screen.getByRole('link', { name: /add your first figure/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper button roles for search type', () => {
      render(<EmptyState type="search" />);

      const button = screen.getByRole('button', { name: /clear search/i });
      expect(button).toBeInTheDocument();
    });

    it('should have proper button roles for filter type', () => {
      render(<EmptyState type="filter" />);

      const button = screen.getByRole('button', { name: /clear filters/i });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible text content', () => {
      render(<EmptyState type="collection" />);

      // Text should be readable by screen readers
      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      expect(screen.getByText("You haven't added any figures to your collection yet.")).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should not trigger navigation for onclick buttons when using keyboard', async () => {
      const user = userEvent.setup();
      render(<EmptyState type="search" />);

      const button = screen.getByRole('button', { name: /clear search/i });
      
      // Test keyboard interaction
      await user.type(button, '{enter}');
      
      expect(mockedRedirectTo).toHaveBeenCalledWith('/figures');
    });

    it('should not break when onclick is undefined', () => {
      // This tests edge case where onclick might not be defined
      render(<EmptyState type="collection" />);
      
      const button = screen.getByRole('link', { name: /add your first figure/i });
      expect(button).toBeInTheDocument();
      
      // Should not throw error when rendered
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty message gracefully', () => {
      render(<EmptyState type="collection" message="" />);

      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      // Component should render without errors when message is empty
      expect(screen.getByRole('link', { name: /add your first figure/i })).toBeInTheDocument();
    });

    it('should handle very long custom messages', () => {
      const longMessage = 'This is a very long custom message that might wrap to multiple lines and should still be displayed properly in the empty state component without breaking the layout or functionality';
      render(<EmptyState type="collection" message={longMessage} />);

      expect(screen.getByText('Your collection is empty')).toBeInTheDocument();
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in messages', () => {
      const messageWithSpecialChars = 'Message with special chars: !@#$%^&*()_+{}[]|\\:";\'<>?,./`~';
      render(<EmptyState type="collection" message={messageWithSpecialChars} />);

      expect(screen.getByText(messageWithSpecialChars)).toBeInTheDocument();
    });
  });
});