import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InternalJobFilters,
  InternalJobFilterState,
} from '@/components/features/jobs/InternalJobFilters';

describe('InternalJobFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders all filter sections', () => {
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText('Filter Internal Jobs')).toBeInTheDocument();
    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getByText('Job Categories')).toBeInTheDocument();
    expect(screen.getByText('Service Categories')).toBeInTheDocument();
    expect(screen.getByText('Experience Levels')).toBeInTheDocument();
    expect(screen.getByText('Work Arrangements')).toBeInTheDocument();
    expect(screen.getByText('Required Skills')).toBeInTheDocument();
    expect(screen.getByText('Budget Range (NZD)')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Remote Work')).toBeInTheDocument();
  });

  it('shows job category options with icons', () => {
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText('Casual Work')).toBeInTheDocument();
    expect(screen.getByText('Subcontracting')).toBeInTheDocument();
    expect(screen.getByText('Partnerships')).toBeInTheDocument();
  });

  it('allows searching by text', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByLabelText(/search/i);
    await user.type(searchInput, 'photographer');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'photographer',
      })
    );
  });

  it('allows selecting job categories', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const casualWorkCheckbox = screen.getByLabelText(/casual work/i);
    await user.click(casualWorkCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        job_category: ['casual_work'],
      })
    );
  });

  it('allows selecting multiple job categories', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const casualWorkCheckbox = screen.getByLabelText(/casual work/i);
    const subcontractingCheckbox = screen.getByLabelText(/subcontracting/i);

    await user.click(casualWorkCheckbox);
    await user.click(subcontractingCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        job_category: ['casual_work', 'subcontracting'],
      })
    );
  });

  it('allows selecting service categories', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const photographyCheckbox = screen.getByLabelText(/photography/i);
    await user.click(photographyCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        service_category: ['photography'],
      })
    );
  });

  it('allows selecting experience levels', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const intermediateCheckbox = screen.getByLabelText(/intermediate/i);
    await user.click(intermediateCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        experience_level: ['intermediate'],
      })
    );
  });

  it('allows selecting work arrangements', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const remoteCheckbox = screen.getByLabelText(/remote work available/i);
    await user.click(remoteCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        is_remote: true,
      })
    );
  });

  it('allows adding and removing skills', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const skillInput = screen.getByPlaceholderText(/add a skill to filter by/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    // Add a skill
    await user.type(skillInput, 'Photography');
    await user.click(addButton);

    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: ['Photography'],
      })
    );

    // Remove the skill
    const removeButton = screen.getByRole('button', { name: '×' });
    await user.click(removeButton);

    expect(screen.queryByText('Photography')).not.toBeInTheDocument();
  });

  it('allows setting budget range', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const minBudgetInput = screen.getByLabelText(/min/i);
    const maxBudgetInput = screen.getByLabelText(/max/i);

    await user.type(minBudgetInput, '500');
    await user.type(maxBudgetInput, '1000');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        budget_min: 500,
        budget_max: 1000,
      })
    );
  });

  it('allows setting location filter', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const locationInput = screen.getByLabelText(/location/i);
    await user.type(locationInput, 'Auckland');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Auckland',
      })
    );
  });

  it('shows active filters count', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    // Initially no active filters
    expect(screen.queryByText(/active/i)).not.toBeInTheDocument();

    // Add some filters
    await user.type(screen.getByLabelText(/search/i), 'test');
    await user.click(screen.getByLabelText(/casual work/i));

    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  it('allows clearing all filters', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    // Add some filters
    await user.type(screen.getByLabelText(/search/i), 'test');
    await user.click(screen.getByLabelText(/casual work/i));

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      search: '',
      job_category: [],
      service_category: [],
      experience_level: [],
      work_arrangement: [],
      budget_min: undefined,
      budget_max: undefined,
      location: '',
      is_remote: null,
      skills: [],
    });
  });

  it('disables clear button when no filters are active', () => {
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDisabled();
  });

  it('handles skill input with Enter key', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const skillInput = screen.getByPlaceholderText(/add a skill to filter by/i);
    await user.type(skillInput, 'Photography');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Photography')).toBeInTheDocument();
  });

  it('prevents adding duplicate skills', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const skillInput = screen.getByPlaceholderText(/add a skill to filter by/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    // Add a skill
    await user.type(skillInput, 'Photography');
    await user.click(addButton);

    // Try to add the same skill again
    await user.type(skillInput, 'Photography');
    await user.click(addButton);

    // Should only have one instance
    expect(screen.getAllByText('Photography')).toHaveLength(1);
  });

  it('handles initial filters correctly', () => {
    const initialFilters: InternalJobFilterState = {
      search: 'photographer',
      job_category: ['casual_work'],
      service_category: ['photography'],
      experience_level: ['intermediate'],
      work_arrangement: ['onsite'],
      budget_min: 500,
      budget_max: 1000,
      location: 'Auckland',
      is_remote: false,
      skills: ['Photography'],
    };

    render(
      <InternalJobFilters
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
      />
    );

    expect(screen.getByDisplayValue('photographer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auckland')).toBeInTheDocument();
    expect(screen.getByText('Photography')).toBeInTheDocument();
  });

  it('handles remote work filter correctly', async () => {
    const user = userEvent.setup();
    render(<InternalJobFilters onFiltersChange={mockOnFiltersChange} />);

    const remoteYesCheckbox = screen.getByLabelText(/remote work available/i);
    const remoteNoCheckbox = screen.getByLabelText(/on-site only/i);

    // Select remote work available
    await user.click(remoteYesCheckbox);
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        is_remote: true,
      })
    );

    // Select on-site only
    await user.click(remoteNoCheckbox);
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        is_remote: false,
      })
    );
  });
});
