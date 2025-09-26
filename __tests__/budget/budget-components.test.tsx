import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetPlanning } from '@/components/features/budget/BudgetPlanning';
import { BudgetRecommendations } from '@/components/features/budget/BudgetRecommendations';
import { BudgetAdjustment } from '@/components/features/budget/BudgetAdjustment';
import { PricingDataDisplay } from '@/components/features/budget/PricingDataDisplay';
import { SeasonalAdjustments } from '@/components/features/budget/SeasonalAdjustments';
import { LocationVariations } from '@/components/features/budget/LocationVariations';
import { PackageDeals } from '@/components/features/budget/PackageDeals';
import { BudgetTracking } from '@/components/features/budget/BudgetTracking';
import { CostSavingSuggestions } from '@/components/features/budget/CostSavingSuggestions';
import { BudgetValidation } from '@/components/features/budget/BudgetValidation';

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock scrollIntoView for JSDOM
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

describe('Budget Components', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('BudgetPlanning', () => {
    it('should render budget planning interface', () => {
      render(<BudgetPlanning />);

      expect(screen.getByText('Budget Planning')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Configure your event details to get personalized budget recommendations'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Event Type')).toBeInTheDocument();
      expect(screen.getByText('Attendee Count')).toBeInTheDocument();
      expect(screen.getByText('Duration (hours)')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('should handle event details change', async () => {
      render(<BudgetPlanning />);

      const eventTypeSelect = screen.getByRole('combobox');
      fireEvent.click(eventTypeSelect);

      await waitFor(() => {
        expect(screen.getByText('Wedding')).toBeInTheDocument();
      });
    });

    it('should generate budget recommendations', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recommendations: [
            {
              id: '1',
              service_category: 'catering',
              recommended_amount: 5000,
              confidence_score: 0.8,
              pricing_source: 'historical',
            },
          ],
          total_budget: 15000,
          metadata: {},
        }),
      });

      render(<BudgetPlanning />);

      const generateButton = screen.getByText(
        'Generate Budget Recommendations'
      );
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
        const calls = (fetch as jest.Mock).mock.calls;
        const urls = calls.map(call => call[0]);
        expect(
          urls.some(url => url.includes('/api/budget/recommendations'))
        ).toBe(true);
        expect(urls.some(url => url.includes('/api/budget/packages'))).toBe(
          true
        );
      });
    });
  });

  describe('BudgetRecommendations', () => {
    const mockRecommendations = [
      {
        id: '1',
        service_category: 'catering',
        recommended_amount: 5000,
        confidence_score: 0.8,
        pricing_source: 'historical',
      },
      {
        id: '2',
        service_category: 'photography',
        recommended_amount: 2000,
        confidence_score: 0.9,
        pricing_source: 'contractor',
      },
    ];

    it('should render budget recommendations', () => {
      render(
        <BudgetRecommendations
          recommendations={mockRecommendations}
          totalBudget={15000}
        />
      );

      expect(screen.getByText('Budget Recommendations')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('catering')).toBeInTheDocument();
      expect(screen.getByText('photography')).toBeInTheDocument();
    });

    it('should display confidence scores', () => {
      render(
        <BudgetRecommendations
          recommendations={mockRecommendations}
          totalBudget={15000}
        />
      );

      expect(screen.getAllByText('High Confidence')).toHaveLength(2);
      expect(screen.getAllByText('80%')).toHaveLength(2);
      expect(screen.getAllByText('90%')).toHaveLength(2);
    });

    it('should handle feedback submission', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          feedback: { id: '1', rating: 5 },
        }),
      });

      render(
        <BudgetRecommendations
          recommendations={mockRecommendations}
          totalBudget={15000}
        />
      );

      const thumbsUpButton = screen.getAllByRole('button', {
        name: /thumbs up/i,
      })[0];
      fireEvent.click(thumbsUpButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/budget/recommendations/feedback',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });
  });

  describe('BudgetAdjustment', () => {
    it('should render budget adjustment interface', () => {
      render(<BudgetAdjustment adjustments={[]} />);

      expect(screen.getByText('Budget Adjustments')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Customize your budget by adjusting individual service categories'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Add Adjustment')).toBeInTheDocument();
    });

    it('should add new adjustment', () => {
      render(<BudgetAdjustment adjustments={[]} />);

      const addButton = screen.getByText('Add Adjustment');
      fireEvent.click(addButton);

      expect(screen.getByText('Add Budget Adjustment')).toBeInTheDocument();
      expect(screen.getByText('Service Category')).toBeInTheDocument();
      expect(screen.getByText('Adjustment Type')).toBeInTheDocument();
      expect(screen.getByText('Adjustment Value (%)')).toBeInTheDocument();
      expect(screen.getByText('Reason for Adjustment')).toBeInTheDocument();
    });

    it('should handle adjustment form submission', () => {
      render(<BudgetAdjustment adjustments={[]} />);

      const addButton = screen.getByText('Add Adjustment');
      fireEvent.click(addButton);

      const serviceCategorySelect = screen.getAllByRole('combobox')[0];
      fireEvent.click(serviceCategorySelect);

      // This would need to be expanded to test the full form submission flow
    });
  });

  describe('PricingDataDisplay', () => {
    it('should render pricing data display', () => {
      render(
        <PricingDataDisplay
          serviceType="catering"
          location={{ lat: 40.7128, lng: -74.006, city: 'New York' }}
        />
      );

      expect(screen.getByText('Loading pricing data...')).toBeInTheDocument();
    });

    it('should handle pricing data loading', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pricing: {
            service_type: 'catering',
            base_pricing: {
              price_min: 1000,
              price_max: 5000,
              price_average: 3000,
            },
            adjusted_pricing: {
              price_min: 1200,
              price_max: 6000,
              price_average: 3600,
            },
            real_time_pricing: {
              min: 1100,
              max: 5500,
              average: 3300,
              contractor_count: 5,
            },
            confidence_score: 0.8,
          },
          real_time: true,
          metadata: {},
        }),
      });

      render(
        <PricingDataDisplay
          serviceType="catering"
          location={{ lat: 40.7128, lng: -74.006, city: 'New York' }}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText('Pricing Data for Catering')
        ).toBeInTheDocument();
      });
    });
  });

  describe('SeasonalAdjustments', () => {
    it('should render seasonal adjustments', () => {
      render(
        <SeasonalAdjustments
          serviceType="catering"
          eventDate="2024-06-15T10:00:00Z"
          location={{ lat: 40.7128, lng: -74.006, city: 'New York' }}
        />
      );

      expect(
        screen.getByText('Loading seasonal adjustments...')
      ).toBeInTheDocument();
    });
  });

  describe('LocationVariations', () => {
    it('should render location variations', () => {
      render(
        <LocationVariations
          serviceType="catering"
          location={{ lat: 40.7128, lng: -74.006, city: 'New York' }}
        />
      );

      expect(screen.getByText('Loading location data...')).toBeInTheDocument();
    });
  });

  describe('PackageDeals', () => {
    const mockPackages = [
      {
        id: '1',
        name: 'Wedding Package',
        description: 'Complete wedding package',
        service_categories: ['catering', 'photography'],
        base_price: 10000,
        discount_percentage: 15,
        final_price: 8500,
        savings: 1500,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('should render package deals', async () => {
      // Mock the initial fetch for loading packages
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          packages: mockPackages,
        }),
      });

      render(
        <PackageDeals
          packages={mockPackages}
          eventType="wedding"
          location={{ lat: 40.7128, lng: -74.006, city: 'New York' }}
        />
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Package Deals')).toBeInTheDocument();
      });

      expect(screen.getByText('Available Packages')).toBeInTheDocument();
      expect(screen.getByText('Total Potential Savings')).toBeInTheDocument();
      expect(screen.getByText('Wedding Package')).toBeInTheDocument();
    });

    it('should handle package application', async () => {
      // Mock the initial fetch for loading packages
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          packages: mockPackages,
        }),
      });

      // Mock the apply package fetch
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          applied_package: mockPackages[0],
        }),
      });

      render(
        <PackageDeals
          packages={mockPackages}
          eventType="wedding"
          location={{ lat: 40.7128, lng: -74.006, city: 'New York' }}
        />
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Apply Package')).toBeInTheDocument();
      });

      const applyButton = screen.getByText('Apply Package');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/budget/packages/apply',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });
  });

  describe('BudgetTracking', () => {
    const mockTracking = [
      {
        id: '1',
        service_category: 'catering',
        estimated_cost: 5000,
        actual_cost: 4500,
        variance: -500,
        tracking_date: '2024-01-01T00:00:00Z',
      },
    ];

    it('should render budget tracking', () => {
      render(<BudgetTracking tracking={mockTracking} totalBudget={15000} />);

      expect(screen.getByText('Budget Tracking Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Estimated')).toBeInTheDocument();
      expect(screen.getByText('Total Actual')).toBeInTheDocument();
      expect(screen.getByText('Total Variance')).toBeInTheDocument();
    });

    it('should handle cost updates', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tracking: mockTracking[0],
        }),
      });

      render(<BudgetTracking tracking={mockTracking} totalBudget={15000} />);

      const editButton = screen.getByRole('button', {
        name: /edit actual cost/i,
      });
      fireEvent.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/budget/tracking',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });
  });

  describe('CostSavingSuggestions', () => {
    const mockBudgetPlan = {
      totalBudget: 15000,
      serviceBreakdown: [
        { service_category: 'catering', estimated_cost: 5000 },
        { service_category: 'photography', estimated_cost: 2000 },
      ],
      recommendations: [],
      packages: [],
      tracking: [],
      adjustments: [],
    };

    it('should render cost saving suggestions', () => {
      render(<CostSavingSuggestions budgetPlan={mockBudgetPlan} />);

      expect(screen.getByText('Cost-Saving Suggestions')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Personalized recommendations to help you save money on your event'
        )
      ).toBeInTheDocument();
    });

    it('should generate suggestions based on budget plan', () => {
      render(<CostSavingSuggestions budgetPlan={mockBudgetPlan} />);

      // The component should generate suggestions based on the budget plan
      // This would need to be expanded to test the actual suggestion generation logic
    });
  });

  describe('BudgetValidation', () => {
    const mockBudgetPlan = {
      totalBudget: 15000,
      serviceBreakdown: [
        { service_category: 'catering', estimated_cost: 5000 },
        { service_category: 'photography', estimated_cost: 2000 },
      ],
      recommendations: [],
      packages: [],
      tracking: [],
      adjustments: [],
    };

    it('should render budget validation', () => {
      render(<BudgetValidation budgetPlan={mockBudgetPlan} />);

      expect(screen.getByText('Budget Validation')).toBeInTheDocument();
      expect(
        screen.getByText('Comprehensive analysis of your budget plan')
      ).toBeInTheDocument();
    });

    it('should display budget health score', () => {
      render(<BudgetValidation budgetPlan={mockBudgetPlan} />);

      expect(screen.getByText('Health Score')).toBeInTheDocument();
      expect(screen.getByText('Issues Found')).toBeInTheDocument();
      expect(screen.getByText('Total Recommendations')).toBeInTheDocument();
    });
  });
});
