import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PremiumFeatureAccess } from '@/components/features/premium/PremiumFeatureAccess';
import { TierFeatures } from '@/components/features/premium/TierFeatures';
import { SpotlightFeatures } from '@/components/features/premium/SpotlightFeatures';
import { AdvancedAnalytics } from '@/components/features/premium/AdvancedAnalytics';
import { PrioritySupport } from '@/components/features/premium/PrioritySupport';
import { CustomProfileURL } from '@/components/features/premium/CustomProfileURL';
import { ContractorSpotlight } from '@/components/features/premium/ContractorSpotlight';
import { EarlyAccess } from '@/components/features/premium/EarlyAccess';
import { HomepageServiceSelection } from '@/components/features/premium/HomepageServiceSelection';

// Mock fetch
global.fetch = jest.fn();

describe('Premium Feature Access Components', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('PremiumFeatureAccess', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<PremiumFeatureAccess />);
      expect(
        screen.getByText('Loading premium features...')
      ).toBeInTheDocument();
    });

    it('renders error state', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      render(<PremiumFeatureAccess />);
      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('renders premium features successfully', async () => {
      const mockData = {
        features: [],
        tierFeatures: [
          {
            id: '1',
            tier: 'essential',
            feature_name: 'basic_profile',
            feature_description: 'Basic profile features',
            is_included: true,
            limit_value: 1,
          },
        ],
        tier: 'essential',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<PremiumFeatureAccess />);

      await waitFor(() => {
        expect(screen.getByText('Premium Features')).toBeInTheDocument();
        expect(screen.getAllByText('Essential Plan')).toHaveLength(2);
      });
    });
  });

  describe('TierFeatures', () => {
    const mockFeatures = [
      {
        id: '1',
        tier: 'essential',
        feature_name: 'basic_profile',
        feature_description: 'Basic profile features',
        is_included: true,
        limit_value: 1,
      },
      {
        id: '2',
        tier: 'showcase',
        feature_name: 'advanced_analytics',
        feature_description: 'Advanced analytics features',
        is_included: true,
        limit_value: 5,
      },
    ];

    it('renders tier features correctly', () => {
      render(<TierFeatures tier="essential" features={mockFeatures} />);

      expect(screen.getByText('Essential Plan')).toBeInTheDocument();
      expect(screen.getAllByText('Basic Profile')).toHaveLength(2);
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });

    it('shows feature limits', () => {
      render(<TierFeatures tier="essential" features={mockFeatures} />);

      expect(screen.getByText('Limit: 1')).toBeInTheDocument();
      expect(screen.getByText('Limit: 5')).toBeInTheDocument();
    });
  });

  describe('SpotlightFeatures', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<SpotlightFeatures />);
      expect(
        screen.getByText('Loading spotlight features...')
      ).toBeInTheDocument();
    });

    it('renders empty state', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ spotlight_features: [] }),
      });

      render(<SpotlightFeatures />);

      await waitFor(() => {
        expect(screen.getByText('No Spotlight Features')).toBeInTheDocument();
        expect(
          screen.getByText('Create Your First Feature')
        ).toBeInTheDocument();
      });
    });

    it('renders spotlight features', async () => {
      const mockFeatures = [
        {
          id: '1',
          user_id: 'user1',
          feature_type: 'homepage_featured',
          feature_data: { title: 'Featured Contractor' },
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ spotlight_features: mockFeatures }),
      });

      render(<SpotlightFeatures />);

      await waitFor(() => {
        expect(screen.getByText('Homepage Featured')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('AdvancedAnalytics', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AdvancedAnalytics />);
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('renders no access state', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ has_analytics_access: false }),
      });

      render(<AdvancedAnalytics />);

      await waitFor(() => {
        expect(
          screen.getByText('Advanced Analytics Not Available')
        ).toBeInTheDocument();
        expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
      });
    });

    it('renders analytics data', async () => {
      const mockAnalytics = {
        profile_views: 150,
        search_appearances: 75,
        inquiries: 25,
        conversion_rate: 16.7,
        top_search_terms: [
          { term: 'wedding planning', count: 10 },
          { term: 'event coordination', count: 8 },
        ],
        recent_activity: [],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          analytics: mockAnalytics,
          has_analytics_access: true,
        }),
      });

      render(<AdvancedAnalytics />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Profile views
        expect(screen.getByText('75')).toBeInTheDocument(); // Search appearances
        expect(screen.getByText('25')).toBeInTheDocument(); // Inquiries
        expect(screen.getByText('16.7%')).toBeInTheDocument(); // Conversion rate
      });
    });
  });

  describe('PrioritySupport', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<PrioritySupport />);
      expect(
        screen.getByText('Loading support features...')
      ).toBeInTheDocument();
    });

    it('renders support features', async () => {
      const mockSupport = {
        priority_level: 'high',
        response_time: '4-8 hours',
        features: [
          {
            feature_name: 'priority_support',
            feature_description: 'Priority support access',
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSupport,
      });

      render(<PrioritySupport />);

      await waitFor(() => {
        expect(screen.getByText('4-8 hours')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
      });
    });
  });

  describe('CustomProfileURL', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<CustomProfileURL />);
      expect(screen.getByText('Loading custom URL...')).toBeInTheDocument();
    });

    it('renders no access state', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ has_custom_url_access: false }),
      });

      render(<CustomProfileURL />);

      await waitFor(() => {
        expect(
          screen.getByText('Custom URLs Not Available')
        ).toBeInTheDocument();
        expect(screen.getByText('Upgrade to Spotlight')).toBeInTheDocument();
      });
    });

    it('renders custom URL', async () => {
      const mockCustomURL = {
        id: '1',
        user_id: 'user1',
        custom_url: 'my-company',
        tier_required: 'spotlight',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          custom_url: mockCustomURL,
          has_custom_url_access: true,
        }),
      });

      render(<CustomProfileURL />);

      await waitFor(() => {
        expect(
          screen.getByText('eventpros.co.nz/my-company')
        ).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });
  });

  describe('ContractorSpotlight', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<ContractorSpotlight />);
      expect(
        screen.getByText('Loading spotlight contractors...')
      ).toBeInTheDocument();
    });

    it('renders spotlight contractors', async () => {
      const mockContractors = [
        {
          id: '1',
          user_id: 'user1',
          company_name: 'Elite Event Solutions',
          description: 'Premium event planning services',
          service_categories: ['Event Planning', 'Catering'],
          average_rating: 4.9,
          review_count: 127,
          is_verified: true,
          subscription_tier: 'spotlight',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ spotlight_contractors: mockContractors }),
      });

      render(<ContractorSpotlight />);

      await waitFor(() => {
        expect(screen.getByText('Elite Event Solutions')).toBeInTheDocument();
        expect(screen.getByText('4.9')).toBeInTheDocument();
        expect(screen.getByText('127 reviews')).toBeInTheDocument();
      });
    });
  });

  describe('EarlyAccess', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<EarlyAccess />);
      expect(
        screen.getByText('Loading early access features...')
      ).toBeInTheDocument();
    });

    it('renders no access state', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ has_early_access: false }),
      });

      render(<EarlyAccess />);

      await waitFor(() => {
        expect(
          screen.getByText('Early Access Not Available')
        ).toBeInTheDocument();
        expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
      });
    });

    it('renders early access features', async () => {
      const mockFeatures = [
        {
          id: '1',
          feature_name: 'AI Recommendations',
          feature_description: 'AI-powered service recommendations',
          tier_required: 'showcase',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          early_access_features: mockFeatures,
          has_early_access: true,
        }),
      });

      render(<EarlyAccess />);

      await waitFor(() => {
        expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
        expect(
          screen.getByText('AI-powered service recommendations')
        ).toBeInTheDocument();
      });
    });
  });

  describe('HomepageServiceSelection', () => {
    it('renders loading state', () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<HomepageServiceSelection />);
      expect(
        screen.getByText('Loading featured contractors...')
      ).toBeInTheDocument();
    });

    it('renders featured contractors', async () => {
      const mockContractors = [
        {
          id: '1',
          user_id: 'user1',
          company_name: 'Elite Event Solutions',
          description: 'Premium event planning services',
          service_categories: ['Event Planning', 'Catering'],
          average_rating: 4.9,
          review_count: 127,
          is_verified: true,
          subscription_tier: 'spotlight',
          location: 'Auckland, NZ',
          website: 'https://eliteevents.co.nz',
          phone: '+64 9 123 4567',
          email: 'info@eliteevents.co.nz',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ spotlight_contractors: mockContractors }),
      });

      render(<HomepageServiceSelection />);

      await waitFor(() => {
        expect(screen.getByText('Featured Contractors')).toBeInTheDocument();
        expect(screen.getByText('Elite Event Solutions')).toBeInTheDocument();
        expect(screen.getByText('4.9')).toBeInTheDocument();
        expect(screen.getByText('(127 reviews)')).toBeInTheDocument();
      });
    });
  });
});
