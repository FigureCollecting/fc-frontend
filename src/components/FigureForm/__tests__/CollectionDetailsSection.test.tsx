/**
 * Tests for CollectionDetailsSection component
 */
import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import CollectionDetailsSection from '../CollectionDetailsSection';

// Create mock form functions
function createMockFormProps(overrides: Record<string, any> = {}) {
  const watchValues: Record<string, any> = {
    collectionStatus: 'owned',
    rating: undefined,
    wishRating: undefined,
    quantity: 1,
    ...overrides,
  };

  return {
    register: jest.fn((name: string) => ({
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })),
    setValue: jest.fn(),
    watch: jest.fn((name: string) => watchValues[name]),
  };
}

describe('CollectionDetailsSection', () => {
  it('should render collection status radio buttons', () => {
    const props = createMockFormProps();
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByText('Collection Details')).toBeInTheDocument();
    expect(screen.getByText('Owned')).toBeInTheDocument();
    expect(screen.getByText('Ordered')).toBeInTheDocument();
    expect(screen.getByText('Wished')).toBeInTheDocument();
  });

  it('should render rating input for owned status', () => {
    const props = createMockFormProps({ collectionStatus: 'owned' });
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1-10')).toBeInTheDocument();
  });

  it('should render priority stars for wished status', () => {
    const props = createMockFormProps({ collectionStatus: 'wished' });
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByText('Priority')).toBeInTheDocument();
    // Should show 5 star buttons
    expect(screen.getByRole('button', { name: '1 star' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 stars' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5 stars' })).toBeInTheDocument();
  });

  it('should render no rating for ordered status', () => {
    const props = createMockFormProps({ collectionStatus: 'ordered' });
    render(<CollectionDetailsSection {...props} />);

    expect(screen.queryByText('Rating')).not.toBeInTheDocument();
    expect(screen.queryByText('Priority')).not.toBeInTheDocument();
  });

  it('should render condition dropdowns', () => {
    const props = createMockFormProps();
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByText('Figure Condition')).toBeInTheDocument();
    expect(screen.getByText('Box Condition')).toBeInTheDocument();
  });

  it('should render quantity input', () => {
    const props = createMockFormProps();
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByText('Quantity')).toBeInTheDocument();
    // Chakra NumberInput steppers use aria-label
    expect(screen.getByLabelText('Increment quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrement quantity')).toBeInTheDocument();
  });

  it('should render note textarea', () => {
    const props = createMockFormProps();
    render(<CollectionDetailsSection {...props} />);

    // Use getAllByLabelText since multiple textareas may match, then check at least one exists
    const noteElements = screen.getAllByLabelText(/^Note$/);
    expect(noteElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render condition notes textareas', () => {
    const props = createMockFormProps();
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByText('Figure Condition Notes')).toBeInTheDocument();
    expect(screen.getByText('Box Condition Notes')).toBeInTheDocument();
  });

  it('should call setValue when star is clicked for wished status', () => {
    const props = createMockFormProps({ collectionStatus: 'wished', wishRating: 0 });
    render(<CollectionDetailsSection {...props} />);

    const star3 = screen.getByRole('button', { name: '3 stars' });
    fireEvent.click(star3);

    expect(props.setValue).toHaveBeenCalledWith('wishRating', 3);
  });

  it('should clear wish rating when same star is clicked', () => {
    const props = createMockFormProps({ collectionStatus: 'wished', wishRating: 3 });
    render(<CollectionDetailsSection {...props} />);

    const star3 = screen.getByRole('button', { name: '3 stars' });
    fireEvent.click(star3);

    expect(props.setValue).toHaveBeenCalledWith('wishRating', undefined);
  });

  it('should render increase/decrease buttons for owned rating', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: 5 });
    render(<CollectionDetailsSection {...props} />);

    expect(screen.getByRole('button', { name: 'Increase' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeInTheDocument();
  });

  it('should handle Increase button click for owned rating', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: 5 });
    render(<CollectionDetailsSection {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(props.setValue).toHaveBeenCalledWith('rating', 6);
  });

  it('should handle Decrease button click for owned rating', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: 5 });
    render(<CollectionDetailsSection {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(props.setValue).toHaveBeenCalledWith('rating', 4);
  });

  it('should set rating to 1 when increasing from undefined', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: undefined });
    render(<CollectionDetailsSection {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(props.setValue).toHaveBeenCalledWith('rating', 1);
  });

  it('should set rating to 10 when decreasing from undefined', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: undefined });
    render(<CollectionDetailsSection {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(props.setValue).toHaveBeenCalledWith('rating', 10);
  });

  it('should clear rating when increasing past 10', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: 10 });
    render(<CollectionDetailsSection {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(props.setValue).toHaveBeenCalledWith('rating', undefined);
  });

  it('should clear rating when decreasing below 1', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: 1 });
    render(<CollectionDetailsSection {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(props.setValue).toHaveBeenCalledWith('rating', undefined);
  });

  it('should have a clear rating button', () => {
    const props = createMockFormProps({ collectionStatus: 'owned', rating: 7 });
    render(<CollectionDetailsSection {...props} />);

    const clearBtn = screen.getByRole('button', { name: 'Clear rating' });
    fireEvent.click(clearBtn);
    expect(props.setValue).toHaveBeenCalledWith('rating', undefined);
  });
});
