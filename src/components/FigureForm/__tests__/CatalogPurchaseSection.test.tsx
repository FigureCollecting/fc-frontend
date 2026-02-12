/**
 * Tests for CatalogPurchaseSection component
 */
import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import CatalogPurchaseSection from '../CatalogPurchaseSection';

function createMockFormProps(overrides: Record<string, any> = {}) {
  const watchValues: Record<string, any> = {
    heightMm: undefined,
    widthMm: undefined,
    depthMm: undefined,
    purchaseDate: undefined,
    purchasePrice: undefined,
    purchaseCurrency: 'USD',
    merchantName: undefined,
    merchantUrl: undefined,
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

describe('CatalogPurchaseSection', () => {
  it('should render collapsible sections', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    expect(screen.getByText('Physical Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Purchase Information')).toBeInTheDocument();
  });

  it('should toggle Physical Dimensions section', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    const dimensionsBtn = screen.getByText('Physical Dimensions');
    fireEvent.click(dimensionsBtn);

    expect(screen.getByText('Physical Dimensions')).toBeInTheDocument();
  });

  it('should toggle Purchase Information section', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    const purchaseBtn = screen.getByText('Purchase Information');
    fireEvent.click(purchaseBtn);

    expect(screen.getByText('Purchase Information')).toBeInTheDocument();
  });

  it('should render dimension fields when expanded', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Physical Dimensions'));

    expect(screen.getByText('Height (mm)')).toBeInTheDocument();
    expect(screen.getByText('Width (mm)')).toBeInTheDocument();
    expect(screen.getByText('Depth (mm)')).toBeInTheDocument();
  });

  it('should render purchase fields when expanded', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Purchase Information'));

    expect(screen.getByText('Purchase Date')).toBeInTheDocument();
    expect(screen.getByText('Purchase Price')).toBeInTheDocument();
    expect(screen.getByText('Purchase Currency')).toBeInTheDocument();
    expect(screen.getByText('Merchant Name')).toBeInTheDocument();
    expect(screen.getByText('Merchant URL')).toBeInTheDocument();
  });

  it('should have currency options', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Purchase Information'));

    expect(screen.getByText('USD ($)')).toBeInTheDocument();
    expect(screen.getByText('JPY (¥)')).toBeInTheDocument();
    expect(screen.getByText('EUR (€)')).toBeInTheDocument();
    expect(screen.getByText('GBP (£)')).toBeInTheDocument();
  });

  it('should call setValue for height when dimension input changes', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    // Expand dimensions
    fireEvent.click(screen.getByText('Physical Dimensions'));

    // Find the height input
    const heightInput = screen.getByPlaceholderText('e.g., 230');
    fireEvent.change(heightInput, { target: { value: '250' } });

    expect(props.setValue).toHaveBeenCalledWith('heightMm', 250);
  });

  it('should call setValue for width when dimension input changes', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Physical Dimensions'));

    const widthInput = screen.getByPlaceholderText('e.g., 150');
    fireEvent.change(widthInput, { target: { value: '180' } });

    expect(props.setValue).toHaveBeenCalledWith('widthMm', 180);
  });

  it('should call setValue for depth when dimension input changes', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Physical Dimensions'));

    const depthInput = screen.getByPlaceholderText('e.g., 120');
    fireEvent.change(depthInput, { target: { value: '100' } });

    expect(props.setValue).toHaveBeenCalledWith('depthMm', 100);
  });

  it('should call setValue for purchase price when input changes', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Purchase Information'));

    const priceInput = screen.getByPlaceholderText('e.g., 150.00');
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    expect(props.setValue).toHaveBeenCalledWith('purchasePrice', 99.99);
  });

  it('should render with existing watch values', () => {
    const props = createMockFormProps({
      heightMm: 230,
      widthMm: 150,
      depthMm: 120,
      purchasePrice: 200,
    });
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Physical Dimensions'));

    // watch is called for the values
    expect(props.watch).toHaveBeenCalledWith('heightMm');
    expect(props.watch).toHaveBeenCalledWith('widthMm');
    expect(props.watch).toHaveBeenCalledWith('depthMm');
  });

  it('should collapse dimensions section when toggled twice', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    const dimensionsBtn = screen.getByText('Physical Dimensions');

    // Expand
    fireEvent.click(dimensionsBtn);
    // Collapse
    fireEvent.click(dimensionsBtn);

    // Section should still exist (just collapsed)
    expect(screen.getByText('Physical Dimensions')).toBeInTheDocument();
  });

  it('should have GBP and CNY currency options', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Purchase Information'));

    expect(screen.getByText('GBP (£)')).toBeInTheDocument();
    expect(screen.getByText('CNY (¥)')).toBeInTheDocument();
  });

  it('should have merchant info tooltips', () => {
    const props = createMockFormProps();
    render(<CatalogPurchaseSection {...props} />);

    fireEvent.click(screen.getByText('Purchase Information'));

    expect(screen.getByLabelText('Merchant info')).toBeInTheDocument();
    expect(screen.getByLabelText('Merchant URL info')).toBeInTheDocument();
  });
});
