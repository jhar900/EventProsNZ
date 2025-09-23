import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '@/components/features/search/SearchBar';
import { FilterPanel } from '@/components/features/search/FilterPanel';
import { ServiceTypeFilter } from '@/components/features/search/ServiceTypeFilter';
import { LocationFilter } from '@/components/features/search/LocationFilter';
import { BudgetFilter } from '@/components/features/search/BudgetFilter';
import { RatingFilter } from '@/components/features/search/RatingFilter';
import { SortControls } from '@/components/features/search/SortControls';

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <div data-testid="magnifying-glass-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  FunnelIcon: () => <div data-testid="funnel-icon" />,
  MapPinIcon: () => <div data-testid="map-pin-icon" />,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
}));

describe('Search Components', () => {
  describe('SearchBar', () => {
    const defaultProps = {
      value: '',
      onChange: jest.fn(),
      onSearch: jest.fn(),
      suggestions: [],
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render search input', () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByPlaceholderText(/search contractors/i);
      expect(input).toBeInTheDocument();
    });

    it('should call onChange when typing', async () => {
      const onChange = jest.fn();
      render(<SearchBar {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText(/search contractors/i);
      fireEvent.change(input, { target: { value: 'photography' } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('photography');
      });
    });

    it('should debounce search calls', async () => {
      const onSearch = jest.fn();
      render(
        <SearchBar {...defaultProps} onSearch={onSearch} debounceMs={100} />
      );

      const input = screen.getByPlaceholderText(/search contractors/i);
      fireEvent.change(input, { target: { value: 'photography' } });

      // Should not call immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Should call after debounce delay
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith('photography');
        },
        { timeout: 200 }
      );
    });

    it('should show suggestions when available', () => {
      const suggestions = ['Photography Pro', 'Photo Studio'];
      render(
        <SearchBar {...defaultProps} suggestions={suggestions} value="photo" />
      );

      expect(screen.getByText('Photography Pro')).toBeInTheDocument();
      expect(screen.getByText('Photo Studio')).toBeInTheDocument();
    });

    it('should handle suggestion selection', () => {
      const onChange = jest.fn();
      const onSearch = jest.fn();
      const suggestions = ['Photography Pro'];

      render(
        <SearchBar
          {...defaultProps}
          onChange={onChange}
          onSearch={onSearch}
          suggestions={suggestions}
          value="photo"
        />
      );

      const suggestion = screen.getByText('Photography Pro');
      fireEvent.click(suggestion);

      expect(onChange).toHaveBeenCalledWith('Photography Pro');
      expect(onSearch).toHaveBeenCalledWith('Photography Pro');
    });

    it('should clear input when clear button is clicked', () => {
      const onChange = jest.fn();
      const onSearch = jest.fn();

      render(
        <SearchBar
          {...defaultProps}
          value="photography"
          onChange={onChange}
          onSearch={onSearch}
        />
      );

      const clearButton = screen.getByTestId('x-mark-icon').parentElement;
      fireEvent.click(clearButton!);

      expect(onChange).toHaveBeenCalledWith('');
      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('should show loading indicator when loading', () => {
      render(<SearchBar {...defaultProps} isLoading={true} />);

      const loadingSpinner = screen.getByRole('status', { hidden: true });
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('FilterPanel', () => {
    const defaultProps = {
      filters: {},
      onFiltersChange: jest.fn(),
      filterOptions: {
        serviceTypes: ['catering', 'photography', 'music'],
        regions: ['Auckland', 'Wellington', 'Christchurch'],
        priceRanges: [
          { label: 'Under $100', min: 0, max: 100 },
          { label: '$100 - $500', min: 100, max: 500 },
        ],
        ratingRanges: [
          { label: '4+ Stars', min: 4, max: 5 },
          { label: '3+ Stars', min: 3, max: 5 },
        ],
      },
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render filter toggle button', () => {
      render(<FilterPanel {...defaultProps} />);

      const filterButton = screen.getByText('Filters');
      expect(filterButton).toBeInTheDocument();
    });

    it('should show active filter count', () => {
      const filters = {
        serviceTypes: ['catering'],
        location: 'Auckland',
      };

      render(<FilterPanel {...defaultProps} filters={filters} />);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('2')).toBeInTheDocument(); // Badge with count
    });

    it('should show active filters as badges', () => {
      const filters = {
        serviceTypes: ['catering'],
        location: 'Auckland',
      };

      render(<FilterPanel {...defaultProps} filters={filters} />);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('Service: catering')).toBeInTheDocument();
      expect(screen.getByText('Location: Auckland')).toBeInTheDocument();
    });

    it('should clear all filters when clear button is clicked', () => {
      const onFiltersChange = jest.fn();
      const filters = {
        serviceTypes: ['catering'],
        location: 'Auckland',
      };

      render(
        <FilterPanel
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      );

      const clearButton = screen.getByText('Clear all filters');
      fireEvent.click(clearButton);

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });

    it('should expand filters when toggle is clicked', () => {
      render(<FilterPanel {...defaultProps} />);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('Service Types')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Budget Range')).toBeInTheDocument();
    });
  });

  describe('ServiceTypeFilter', () => {
    const defaultProps = {
      value: [],
      onChange: jest.fn(),
      options: ['catering', 'photography', 'music'],
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render service type buttons', () => {
      render(<ServiceTypeFilter {...defaultProps} />);

      expect(screen.getByText('Catering')).toBeInTheDocument();
      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    it('should toggle service type selection', () => {
      const onChange = jest.fn();
      render(<ServiceTypeFilter {...defaultProps} onChange={onChange} />);

      const cateringButton = screen.getByText('Catering');
      fireEvent.click(cateringButton);

      expect(onChange).toHaveBeenCalledWith(['catering']);
    });

    it('should remove service type when already selected', () => {
      const onChange = jest.fn();
      render(
        <ServiceTypeFilter
          {...defaultProps}
          value={['catering']}
          onChange={onChange}
        />
      );

      const cateringButton = screen.getByText('Catering');
      fireEvent.click(cateringButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('should show selection count', () => {
      render(
        <ServiceTypeFilter
          {...defaultProps}
          value={['catering', 'photography']}
        />
      );

      expect(screen.getByText('2 service types selected')).toBeInTheDocument();
    });
  });

  describe('LocationFilter', () => {
    const defaultProps = {
      value: '',
      radius: 25,
      onChange: jest.fn(),
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render location input', () => {
      render(<LocationFilter {...defaultProps} />);

      const input = screen.getByPlaceholderText(/enter city/i);
      expect(input).toBeInTheDocument();
    });

    it('should show radius options when location is entered', () => {
      render(<LocationFilter {...defaultProps} value="Auckland" />);

      expect(screen.getByText('Search Radius')).toBeInTheDocument();
      expect(screen.getByText('5 km')).toBeInTheDocument();
      expect(screen.getByText('10 km')).toBeInTheDocument();
    });

    it('should call onChange when location changes', () => {
      const onChange = jest.fn();
      render(<LocationFilter {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText(/enter city/i);
      fireEvent.change(input, { target: { value: 'Auckland' } });

      expect(onChange).toHaveBeenCalledWith('Auckland', 25);
    });

    it('should call onChange when radius changes', () => {
      const onChange = jest.fn();
      render(
        <LocationFilter
          {...defaultProps}
          value="Auckland"
          onChange={onChange}
        />
      );

      const radiusButton = screen.getByText('10 km');
      fireEvent.click(radiusButton);

      expect(onChange).toHaveBeenCalledWith('Auckland', 10);
    });
  });

  describe('BudgetFilter', () => {
    const defaultProps = {
      priceMin: undefined,
      priceMax: undefined,
      onChange: jest.fn(),
      priceRanges: [
        { label: 'Under $100', min: 0, max: 100 },
        { label: '$100 - $500', min: 100, max: 500 },
      ],
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render price range buttons', () => {
      render(<BudgetFilter {...defaultProps} />);

      expect(screen.getByText('Under $100')).toBeInTheDocument();
      expect(screen.getByText('$100 - $500')).toBeInTheDocument();
    });

    it('should render custom price inputs', () => {
      render(<BudgetFilter {...defaultProps} />);

      const minInput = screen.getByPlaceholderText('0');
      const maxInput = screen.getByPlaceholderText('No limit');

      expect(minInput).toBeInTheDocument();
      expect(maxInput).toBeInTheDocument();
    });

    it('should call onChange when price range is selected', () => {
      const onChange = jest.fn();
      render(<BudgetFilter {...defaultProps} onChange={onChange} />);

      const rangeButton = screen.getByText('Under $100');
      fireEvent.click(rangeButton);

      expect(onChange).toHaveBeenCalledWith(0, 100);
    });

    it('should call onChange when custom prices are entered', () => {
      const onChange = jest.fn();
      render(<BudgetFilter {...defaultProps} onChange={onChange} />);

      const minInput = screen.getByPlaceholderText('0');
      fireEvent.change(minInput, { target: { value: '50' } });
      fireEvent.blur(minInput);

      expect(onChange).toHaveBeenCalledWith(50, undefined);
    });
  });

  describe('RatingFilter', () => {
    const defaultProps = {
      value: undefined,
      onChange: jest.fn(),
      ratingRanges: [
        { label: '4+ Stars', min: 4, max: 5 },
        { label: '3+ Stars', min: 3, max: 5 },
      ],
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render rating buttons', () => {
      render(<RatingFilter {...defaultProps} />);

      expect(screen.getByText('4+ Stars')).toBeInTheDocument();
      expect(screen.getByText('3+ Stars')).toBeInTheDocument();
    });

    it('should call onChange when rating is selected', () => {
      const onChange = jest.fn();
      render(<RatingFilter {...defaultProps} onChange={onChange} />);

      const ratingButton = screen.getByText('4+ Stars');
      fireEvent.click(ratingButton);

      expect(onChange).toHaveBeenCalledWith(4);
    });

    it('should deselect rating when already selected', () => {
      const onChange = jest.fn();
      render(<RatingFilter {...defaultProps} value={4} onChange={onChange} />);

      const ratingButton = screen.getByText('4+ Stars');
      fireEvent.click(ratingButton);

      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('SortControls', () => {
    const defaultProps = {
      sortBy: 'relevance',
      onSortChange: jest.fn(),
      isLoading: false,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render sort dropdown', () => {
      render(<SortControls {...defaultProps} />);

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Relevance')).toBeInTheDocument();
    });

    it('should call onSortChange when sort option changes', () => {
      const onSortChange = jest.fn();
      render(<SortControls {...defaultProps} onSortChange={onSortChange} />);

      const select = screen.getByDisplayValue('Relevance');
      fireEvent.change(select, { target: { value: 'rating' } });

      expect(onSortChange).toHaveBeenCalledWith('rating');
    });

    it('should show current sort option', () => {
      render(<SortControls {...defaultProps} sortBy="rating" />);

      expect(screen.getByDisplayValue('Highest Rated')).toBeInTheDocument();
    });
  });
});
