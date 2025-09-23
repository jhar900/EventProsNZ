import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceCategorySuggestions } from '@/components/features/ai/ServiceCategorySuggestions';

describe('ServiceCategorySuggestions', () => {
  const mockOnCategorySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render service category suggestions correctly for wedding events', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getByText('Photography & Videography')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
  });

  it('should display priority badges for each category', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getAllByText('Priority 5')).toHaveLength(3); // 3 priority 5 categories
    expect(screen.getAllByText('Priority 4')).toHaveLength(2); // 2 priority 4 categories
  });

  it('should display confidence scores for each category', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getAllByText('95%')).toHaveLength(3); // 3 categories with 95% confidence
    expect(screen.getAllByText('90%')).toHaveLength(2); // 1 category with 90% confidence + 1 in summary
  });

  it('should display required badges for required categories', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getAllByText('Required')).toHaveLength(6); // 6 required categories for wedding (5 in cards + 1 in summary)
  });

  it('should handle category selection', async () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const addButtons = screen.getAllByText('Add Category');
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      expect(mockOnCategorySelect).toHaveBeenCalled();
    });
  });

  it('should handle search functionality', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search service categories...'
    );
    fireEvent.change(searchInput, { target: { value: 'photography' } });

    expect(screen.getByText('Photography & Videography')).toBeInTheDocument();
    expect(screen.queryByText('Catering')).not.toBeInTheDocument();
  });

  it('should handle priority filtering', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const prioritySelect = screen.getByDisplayValue('All Priorities');
    fireEvent.change(prioritySelect, { target: { value: '5' } });

    // Should only show priority 5 categories
    expect(screen.getByText('Photography & Videography')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
  });

  it('should show insights when toggle is clicked', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const insightsButton = screen.getByText('Show Insights');
    fireEvent.click(insightsButton);

    expect(screen.getAllByText('Industry Insight')).toHaveLength(6); // 6 categories with insights
  });

  it('should display category summary', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getByText('Category Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Categories')).toBeInTheDocument();
    expect(screen.getAllByText('Required')).toHaveLength(6); // 5 in cards + 1 in summary
  });

  it('should handle corporate events', () => {
    render(
      <ServiceCategorySuggestions
        eventType="corporate"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getByText('Event Venue')).toBeInTheDocument();
    expect(screen.getByText('Corporate Catering')).toBeInTheDocument();
    expect(screen.getByText('AV Equipment & Technology')).toBeInTheDocument();
  });

  it('should handle birthday events', () => {
    render(
      <ServiceCategorySuggestions
        eventType="birthday"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(screen.getByText('Party Venue')).toBeInTheDocument();
    expect(screen.getByText('Party Catering')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
  });

  it('should handle unknown event types', () => {
    render(
      <ServiceCategorySuggestions
        eventType="unknown"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(
      screen.getByText(
        'No service categories found matching your search criteria.'
      )
    ).toBeInTheDocument();
  });

  it('should show selected categories with different styling', () => {
    render(
      <ServiceCategorySuggestions
        eventType="wedding"
        onCategorySelect={mockOnCategorySelect}
        selectedCategories={['photography']}
      />
    );

    // The photography card should have ring styling
    const photographyCard = screen
      .getByText('Photography & Videography')
      .closest('.ring-2');
    expect(photographyCard).toBeInTheDocument();
  });
});
