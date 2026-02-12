import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: mockOnPageChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render content when there is only one page', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} showPageSizeSelector={false} />
      );

      // The component returns null when totalPages <= 1 and showPageSizeSelector is false
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('should not render content when there are no pages', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={mockOnPageChange} showPageSizeSelector={false} />
      );

      // The component returns null when totalPages <= 1 and showPageSizeSelector is false
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('should render pagination controls when there are multiple pages', () => {
      render(<Pagination {...defaultProps} />);

      // Check for navigation elements
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    });

    it('should render page number buttons', () => {
      render(<Pagination {...defaultProps} />);

      // Basic page buttons should be present
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    });
  });

  describe('Previous Button', () => {
    it('should be disabled on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it('should be enabled when not on first page', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).not.toBeDisabled();
    });

    it('should call onPageChange with previous page when clicked', async () => {
      const user = userEvent.setup();
      render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should not call onPageChange when disabled', async () => {
      const user = userEvent.setup();
      render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Next Button', () => {
    it('should be disabled on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).toBeDisabled();
    });

    it('should be enabled when not on last page', () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should call onPageChange with next page when clicked', async () => {
      const user = userEvent.setup();
      render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should not call onPageChange when disabled', async () => {
      const user = userEvent.setup();
      render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Page Number Buttons', () => {
    it('should call onPageChange when page button clicked', async () => {
      const user = userEvent.setup();
      render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

      const page2Button = screen.getByRole('button', { name: '2' });
      await user.click(page2Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange for first page', async () => {
      const user = userEvent.setup();
      render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const page1Button = screen.getByRole('button', { name: '1' });
      await user.click(page1Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Page Display Logic', () => {
    it('should show first page button', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    });

    it('should show last page button when totalPages > 1', () => {
      render(<Pagination currentPage={1} totalPages={3} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });

    it('should show pages around current page', () => {
      render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      // Should show page 1, page 3 (current), and page 5
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    });

    it('should show ellipsis when there are gaps', () => {
      render(<Pagination currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />);

      // The component uses middle dots (···) for ellipsis gaps
      const ellipsisElements = screen.getAllByText('···');
      expect(ellipsisElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle currentPage = 1 with 2 total pages', () => {
      expect(() => {
        render(<Pagination currentPage={1} totalPages={2} onPageChange={mockOnPageChange} />);
      }).not.toThrow();
    });

    it('should handle currentPage = 1 with 3 total pages', () => {
      render(<Pagination currentPage={1} totalPages={3} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });

    it('should handle large page numbers', () => {
      render(<Pagination currentPage={50} totalPages={100} onPageChange={mockOnPageChange} />);

      // Should render without errors
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const page1Button = screen.getByRole('button', { name: '1' });
      page1Button.focus();
      expect(page1Button).toHaveFocus();

      await user.tab();
      const page2Button = screen.getByRole('button', { name: '2' });
      expect(page2Button).toHaveFocus();
    });

    it('should support Enter key activation', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const page2Button = screen.getByRole('button', { name: '2' });
      page2Button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const page2Button = screen.getByRole('button', { name: '2' });
      page2Button.focus();
      await user.keyboard(' ');

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Component Integration', () => {
    it('should render without errors', () => {
      expect(() => render(<Pagination {...defaultProps} />)).not.toThrow();
    });

    it('should handle prop changes correctly', () => {
      const { rerender } = render(<Pagination {...defaultProps} />);

      // Should handle prop changes without errors
      rerender(<Pagination currentPage={3} totalPages={10} onPageChange={mockOnPageChange} />);
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    });
  });
});