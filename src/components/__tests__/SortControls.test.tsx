import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SortControls, { SortField, SortDirection, SortParams } from '../SortControls';
import { render } from '../../test-utils';

describe('SortControls', () => {
  const defaultProps = {
    sortBy: 'createdAt' as SortField,
    sortOrder: 'desc' as SortDirection,
    onSortChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render sort field select and direction button', () => {
      render(<SortControls {...defaultProps} />);

      expect(screen.getByTestId('sort-controls')).toBeInTheDocument();
      expect(screen.getByTestId('sort-field-select')).toBeInTheDocument();
      expect(screen.getByTestId('sort-direction-button')).toBeInTheDocument();
    });

    it('should render all sort options', () => {
      render(<SortControls {...defaultProps} />);

      const select = screen.getByTestId('sort-field-select');
      expect(select).toHaveValue('createdAt');

      // Check all options exist
      expect(screen.getByRole('option', { name: 'Date Added' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Manufacturer' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Scale' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Price' })).toBeInTheDocument();
    });

    it('should display correct selected sort field', () => {
      render(<SortControls {...defaultProps} sortBy="name" />);

      expect(screen.getByTestId('sort-field-select')).toHaveValue('name');
    });

    it('should display ascending icon when sortOrder is asc', () => {
      render(<SortControls {...defaultProps} sortOrder="asc" />);

      const button = screen.getByTestId('sort-direction-button');
      expect(button).toHaveAttribute('aria-label', 'Sort ascending');
    });

    it('should display descending icon when sortOrder is desc', () => {
      render(<SortControls {...defaultProps} sortOrder="desc" />);

      const button = screen.getByTestId('sort-direction-button');
      expect(button).toHaveAttribute('aria-label', 'Sort descending');
    });
  });

  describe('interactions', () => {
    it('should call onSortChange when sort field changes', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} onSortChange={onSortChange} />);

      const select = screen.getByTestId('sort-field-select');
      await user.selectOptions(select, 'name');

      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: 'name',
        sortOrder: 'desc',
      });
    });

    it('should call onSortChange when direction button is clicked', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} onSortChange={onSortChange} />);

      const button = screen.getByTestId('sort-direction-button');
      await user.click(button);

      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
    });

    it('should toggle sort direction from asc to desc', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} sortOrder="asc" onSortChange={onSortChange} />);

      const button = screen.getByTestId('sort-direction-button');
      await user.click(button);

      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should maintain sort field when changing direction', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} sortBy="manufacturer" onSortChange={onSortChange} />);

      const button = screen.getByTestId('sort-direction-button');
      await user.click(button);

      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: 'manufacturer',
        sortOrder: 'asc',
      });
    });

    it('should maintain sort direction when changing field', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} sortOrder="asc" onSortChange={onSortChange} />);

      const select = screen.getByTestId('sort-field-select');
      await user.selectOptions(select, 'scale');

      expect(onSortChange).toHaveBeenCalledWith({
        sortBy: 'scale',
        sortOrder: 'asc',
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible label for sort field', () => {
      render(<SortControls {...defaultProps} />);

      const select = screen.getByLabelText('Sort by field');
      expect(select).toBeInTheDocument();
    });

    it('should have accessible label for sort direction button', () => {
      render(<SortControls {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} onSortChange={onSortChange} />);

      const select = screen.getByTestId('sort-field-select');
      select.focus();
      expect(select).toHaveFocus();

      await user.tab();
      const button = screen.getByTestId('sort-direction-button');
      expect(button).toHaveFocus();
    });
  });
});
