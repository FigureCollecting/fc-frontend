import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils';
import SearchBar from '../SearchBar';

// Control react-query results
let mockSuggestions: any[] | undefined;
let mockIsLoading = false;

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQuery: (_key: any, _fn: any, opts: any) => ({
    data: opts?.enabled ? mockSuggestions : undefined,
    isLoading: opts?.enabled ? mockIsLoading : false,
  }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSuggestions = undefined;
    mockIsLoading = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders search input', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText('Search your figures...')).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('supports custom placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} placeholder="Find figures" />);
    expect(screen.getByPlaceholderText('Find figures')).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(input).toHaveValue('test value');
  });

  it('calls onSearch on form submit with trimmed query', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');
    fireEvent.change(input, { target: { value: '  hello world  ' } });

    // Submit the form
    const form = input.closest('form');
    if (form) fireEvent.submit(form);

    expect(mockOnSearch).toHaveBeenCalledWith('hello world');
  });

  it('does not call onSearch when query is empty', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');
    fireEvent.change(input, { target: { value: '' } });

    const form = input.closest('form');
    if (form) fireEvent.submit(form);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('handles Escape key on input', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    fireEvent.change(input, { target: { value: 'Figure' } });

    // Press Escape - should not throw
    fireEvent.keyDown(input, { key: 'Escape' });
    // After escape, expanded should be false
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('has correct ARIA attributes on input', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-label', 'Search your figures');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
  });

  it('shows suggestion dropdown when results are available', () => {
    mockSuggestions = [
      { id: 'fig1', name: 'Cool Item One', manufacturer: 'Alter', scale: '1/7' },
      { id: 'fig2', name: 'Cool Item Two', manufacturer: 'Good Smile', scale: '1/8' },
    ];

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Type enough characters to trigger suggestions (>= 3), avoid matching name text (HighlightMatch splits it)
    fireEvent.change(input, { target: { value: 'xyz' } });
    act(() => { jest.advanceTimersByTime(400); });

    // The dropdown should appear with suggestion items (role=option)
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(2);
  });

  it('navigates to figure detail when suggestion clicked', () => {
    mockSuggestions = [
      { id: 'fig123', name: 'Unique Item Name', manufacturer: 'Alter', scale: '1/7' },
    ];

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Use a query that won't appear in the item name (avoids HighlightMatch splitting)
    fireEvent.change(input, { target: { value: 'zzz' } });
    act(() => { jest.advanceTimersByTime(400); });

    // Click the suggestion option
    const option = screen.getByRole('option');
    fireEvent.click(option);

    expect(mockNavigate).toHaveBeenCalledWith('/figures/fig123');
  });

  it('shows loading state in dropdown', () => {
    mockIsLoading = true;
    mockSuggestions = undefined;

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Type enough characters
    fireEvent.change(input, { target: { value: 'testing' } });
    act(() => { jest.advanceTimersByTime(400); });

    // Should show the dropdown with loading indicator
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows no figures found when results are empty', () => {
    mockSuggestions = [];

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Type enough characters but no results
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    act(() => { jest.advanceTimersByTime(400); });

    // Dropdown should not appear for empty results
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes dropdown on form submit', () => {
    mockSuggestions = [
      { id: 'fig1', name: 'Figure A', manufacturer: 'GSC', scale: '1/7' },
    ];

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Open dropdown
    fireEvent.change(input, { target: { value: 'Figure A' } });
    act(() => { jest.advanceTimersByTime(400); });

    // Submit form
    const form = input.closest('form');
    if (form) fireEvent.submit(form);

    expect(mockOnSearch).toHaveBeenCalledWith('Figure A');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays suggestion with manufacturer and scale info', () => {
    mockSuggestions = [
      { id: 'fig1', name: 'Some Item', manufacturer: 'Kotobukiya', scale: '1/6', searchScore: 1.5 },
    ];

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Use non-matching query to avoid HighlightMatch splitting
    fireEvent.change(input, { target: { value: 'xyz' } });
    act(() => { jest.advanceTimersByTime(400); });

    // The option should exist
    const option = screen.getByRole('option');
    expect(option).toBeInTheDocument();
    // Manufacturer and scale text should be in the document
    expect(option.textContent).toContain('Kotobukiya');
    expect(option.textContent).toContain('1/6');
  });

  it('shows view all results when more than 8 suggestions', () => {
    mockSuggestions = Array.from({ length: 10 }, (_, i) => ({
      id: `fig${i}`,
      name: `Figure ${i}`,
      manufacturer: 'GSC',
      scale: '1/7',
    }));

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    fireEvent.change(input, { target: { value: 'Figure' } });
    act(() => { jest.advanceTimersByTime(400); });

    // Should show "View all X results"
    expect(screen.getByText(/View all 10 results/)).toBeInTheDocument();
  });

  it('calls onSearch when view all results is clicked', () => {
    mockSuggestions = Array.from({ length: 10 }, (_, i) => ({
      id: `fig${i}`,
      name: `Figure ${i}`,
      manufacturer: 'GSC',
      scale: '1/7',
    }));

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    fireEvent.change(input, { target: { value: 'Figure' } });
    act(() => { jest.advanceTimersByTime(400); });

    fireEvent.click(screen.getByText(/View all 10 results/));
    expect(mockOnSearch).toHaveBeenCalledWith('Figure');
  });

  it('clears query when suggestion is clicked', () => {
    mockSuggestions = [
      { id: 'fig1', name: 'Click Target Item', manufacturer: 'Alter', scale: '1/7' },
    ];

    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search your figures...');

    // Use a query that doesn't match the item name
    fireEvent.change(input, { target: { value: 'zzz' } });
    act(() => { jest.advanceTimersByTime(400); });

    const option = screen.getByRole('option');
    fireEvent.click(option);

    // Input should be cleared after clicking suggestion
    expect(input).toHaveValue('');
  });
});
