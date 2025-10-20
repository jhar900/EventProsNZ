import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractorMatching } from '@/components/features/matching/ContractorMatching';
import { EventRequirementAnalysis } from '@/components/features/matching/EventRequirementAnalysis';
import { CompatibilityScoring } from '@/components/features/matching/CompatibilityScoring';
import { AvailabilityChecker } from '@/components/features/matching/AvailabilityChecker';
import { BudgetCompatibility } from '@/components/features/matching/BudgetCompatibility';
import { LocationMatching } from '@/components/features/matching/LocationMatching';
import { PerformanceIntegration } from '@/components/features/matching/PerformanceIntegration';
import { ContractorRanking } from '@/components/features/matching/ContractorRanking';
import { MatchingResults } from '@/components/features/matching/MatchingResults';
import { InquiryIntegration } from '@/components/features/matching/InquiryIntegration';
import { MatchingFiltersComponent as MatchingFilters } from '@/components/features/matching/MatchingFilters';
import { MatchingPagination } from '@/components/features/matching/MatchingPagination';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Matching Components', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('ContractorMatching', () => {
    it('should render contractor matching interface', () => {
      render(<ContractorMatching eventId="event-1" />);

      expect(
        screen.getByText('Intelligent Contractor Matching')
      ).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should handle tab switching', () => {
      render(<ContractorMatching eventId="event-1" />);

      const filtersTab = screen.getByText('Filters');
      fireEvent.click(filtersTab);

      expect(screen.getByText('Matching Filters')).toBeInTheDocument();
    });
  });

  describe('EventRequirementAnalysis', () => {
    it('should render event requirement analysis', () => {
      render(<EventRequirementAnalysis eventId="event-1" />);

      expect(
        screen.getByText('Event Requirements Analysis')
      ).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<EventRequirementAnalysis eventId="event-1" />);

      expect(screen.getByText('Loading event details...')).toBeInTheDocument();
    });
  });

  describe('CompatibilityScoring', () => {
    it('should render compatibility scoring', () => {
      render(
        <CompatibilityScoring eventId="event-1" contractorId="contractor-1" />
      );

      expect(screen.getByText('Compatibility Scoring')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <CompatibilityScoring eventId="event-1" contractorId="contractor-1" />
      );

      expect(
        screen.getByText('Calculating compatibility...')
      ).toBeInTheDocument();
    });
  });

  describe('AvailabilityChecker', () => {
    it('should render availability checker', () => {
      render(
        <AvailabilityChecker
          contractorId="contractor-1"
          eventDate="2024-12-25"
          duration={8}
        />
      );

      expect(screen.getByText('Availability Check')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <AvailabilityChecker
          contractorId="contractor-1"
          eventDate="2024-12-25"
          duration={8}
        />
      );

      expect(screen.getByText('Checking availability...')).toBeInTheDocument();
    });
  });

  describe('BudgetCompatibility', () => {
    it('should render budget compatibility', () => {
      render(
        <BudgetCompatibility eventId="event-1" contractorId="contractor-1" />
      );

      expect(screen.getByText('Budget Compatibility')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <BudgetCompatibility eventId="event-1" contractorId="contractor-1" />
      );

      expect(
        screen.getByText('Calculating budget compatibility...')
      ).toBeInTheDocument();
    });
  });

  describe('LocationMatching', () => {
    it('should render location matching', () => {
      render(
        <LocationMatching eventId="event-1" contractorId="contractor-1" />
      );

      expect(screen.getByText('Location Matching')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <LocationMatching eventId="event-1" contractorId="contractor-1" />
      );

      expect(
        screen.getByText('Calculating location match...')
      ).toBeInTheDocument();
    });
  });

  describe('PerformanceIntegration', () => {
    it('should render performance integration', () => {
      render(<PerformanceIntegration contractorId="contractor-1" />);

      expect(screen.getByText('Performance Integration')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<PerformanceIntegration contractorId="contractor-1" />);

      expect(
        screen.getByText('Loading performance data...')
      ).toBeInTheDocument();
    });
  });

  describe('ContractorRanking', () => {
    const mockMatches = [
      {
        id: 'match-1',
        event_id: 'event-1',
        contractor_id: 'contractor-1',
        compatibility_score: 0.8,
        availability_score: 0.9,
        budget_score: 0.7,
        location_score: 0.8,
        performance_score: 0.85,
        overall_score: 0.8,
        is_premium: false,
        match_algorithm: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    it('should render contractor ranking', () => {
      render(<ContractorRanking matches={mockMatches} algorithm="default" />);

      expect(screen.getByText('Contractor Ranking')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<ContractorRanking matches={mockMatches} algorithm="default" />);

      expect(screen.getByText('Calculating ranking...')).toBeInTheDocument();
    });
  });

  describe('MatchingResults', () => {
    const mockMatches = [
      {
        id: 'match-1',
        event_id: 'event-1',
        contractor_id: 'contractor-1',
        compatibility_score: 0.8,
        availability_score: 0.9,
        budget_score: 0.7,
        location_score: 0.8,
        performance_score: 0.85,
        overall_score: 0.8,
        is_premium: false,
        match_algorithm: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    it('should render matching results', () => {
      render(<MatchingResults matches={mockMatches} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('Contractor contractor-1')).toBeInTheDocument();
    });

    it('should handle empty results', () => {
      render(<MatchingResults matches={[]} />);

      expect(
        screen.getByText('No matching contractors found')
      ).toBeInTheDocument();
    });

    it('should handle match selection', () => {
      const onMatchSelect = jest.fn();
      render(
        <MatchingResults matches={mockMatches} onMatchSelect={onMatchSelect} />
      );

      const selectButton = screen.getByText('Select');
      fireEvent.click(selectButton);

      expect(onMatchSelect).toHaveBeenCalledWith(mockMatches[0]);
    });
  });

  describe('InquiryIntegration', () => {
    it('should render inquiry integration', () => {
      render(
        <InquiryIntegration eventId="event-1" contractorId="contractor-1" />
      );

      expect(
        screen.getByRole('button', { name: 'Send Inquiry' })
      ).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <InquiryIntegration eventId="event-1" contractorId="contractor-1" />
      );

      const textarea = screen.getByPlaceholderText(
        "Tell the contractor about your event and what you're looking for..."
      );
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      const submitButton = screen.getByRole('button', { name: 'Send Inquiry' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/matching/inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: 'event-1',
            contractor_id: 'contractor-1',
            message: 'Test message',
          }),
        });
      });
    });
  });

  describe('MatchingFilters', () => {
    it('should render matching filters', () => {
      render(<MatchingFilters filters={{}} onFiltersChange={jest.fn()} />);

      expect(screen.getByText('Matching Filters')).toBeInTheDocument();
      expect(screen.getByText('Service Types')).toBeInTheDocument();
      expect(screen.getByText('Budget Range')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
    });

    it('should handle filter changes', () => {
      const onFiltersChange = jest.fn();
      render(
        <MatchingFilters filters={{}} onFiltersChange={onFiltersChange} />
      );

      const photographyCheckbox = screen.getByLabelText('Photography');
      fireEvent.click(photographyCheckbox);

      expect(onFiltersChange).toHaveBeenCalledWith({
        service_types: ['Photography'],
      });
    });
  });

  describe('MatchingPagination', () => {
    it('should render pagination', () => {
      render(
        <MatchingPagination
          currentPage={1}
          totalPages={5}
          onPageChange={jest.fn()}
        />
      );

      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('should handle page changes', () => {
      const onPageChange = jest.fn();
      render(
        <MatchingPagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getAllByRole('button')[4]; // The next button (ChevronRight)
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should not render when total pages is 1', () => {
      render(
        <MatchingPagination
          currentPage={1}
          totalPages={1}
          onPageChange={jest.fn()}
        />
      );

      expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
    });
  });
});
