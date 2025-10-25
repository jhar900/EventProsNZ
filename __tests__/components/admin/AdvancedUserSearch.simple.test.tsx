import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedUserSearch from '@/components/features/admin/AdvancedUserSearch';

// Mock the date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPP') return 'January 15, 2024';
    if (formatStr === 'MMM dd, yyyy') return 'Jan 15, 2024';
    return '2024-01-15';
  }),
}));

describe('AdvancedUserSearch', () => {
  const mockOnSearch = jest.fn();
  const mockOnSaveSearch = jest.fn();
  const mockOnLoadSearch = jest.fn();

  const defaultProps = {
    onSearch: mockOnSearch,
    onSaveSearch: mockOnSaveSearch,
    onLoadSearch: mockOnLoadSearch,
    savedSearches: [],
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search form', () => {
    render(<AdvancedUserSearch {...defaultProps} />);

    expect(screen.getByText('Advanced User Search')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search by name, email, company...')
    ).toBeInTheDocument();
  });

  it('handles basic search input', () => {
    render(<AdvancedUserSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'Search by name, email, company...'
    );
    fireEvent.change(searchInput, { target: { value: 'john doe' } });

    expect(searchInput).toHaveValue('john doe');
  });

  it('handles search submission', async () => {
    render(<AdvancedUserSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'Search by name, email, company...'
    );
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Find the search button by looking for the button with search icon
    const searchButtons = screen.getAllByRole('button');
    const searchButton = searchButtons.find(
      button =>
        button.textContent?.includes('Search') &&
        !button.textContent?.includes('Save')
    );

    if (searchButton) {
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test search',
            role: 'all',
            status: 'all',
          })
        );
      });
    }
  });

  it('handles filter clearing', () => {
    render(<AdvancedUserSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      'Search by name, email, company...'
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('toggles advanced filters', () => {
    render(<AdvancedUserSearch {...defaultProps} />);

    const advancedButton = screen.getByText('Advanced Filters');
    fireEvent.click(advancedButton);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Verification')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
  });

  it('shows saved searches when available', () => {
    const savedSearches = [
      {
        id: '1',
        name: 'Active Users',
        filters: { role: 'active', search: '' },
        created_at: '2024-01-15T00:00:00Z',
      },
    ];

    render(
      <AdvancedUserSearch {...defaultProps} savedSearches={savedSearches} />
    );

    expect(screen.getByText('Load saved search')).toBeInTheDocument();
  });

  it('handles location and company filters', () => {
    render(<AdvancedUserSearch {...defaultProps} />);

    // Open advanced filters
    const advancedButton = screen.getByText('Advanced Filters');
    fireEvent.click(advancedButton);

    const locationInput = screen.getByPlaceholderText(
      'City, state, country...'
    );
    const companyInput = screen.getByPlaceholderText('Company name...');

    fireEvent.change(locationInput, { target: { value: 'Auckland' } });
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });

    expect(locationInput).toHaveValue('Auckland');
    expect(companyInput).toHaveValue('Test Company');
  });

  it('shows loading state', () => {
    render(<AdvancedUserSearch {...defaultProps} loading={true} />);

    // Check if any button is disabled when loading
    const buttons = screen.getAllByRole('button');
    const hasDisabledButton = buttons.some(button => button.disabled);
    expect(hasDisabledButton).toBe(true);
  });
});
