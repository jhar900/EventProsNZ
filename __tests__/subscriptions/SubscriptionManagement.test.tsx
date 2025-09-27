import { render, screen, waitFor } from '@testing-library/react';
import { SubscriptionManagement } from '@/components/features/subscriptions/SubscriptionManagement';

// Mock the subscription hook
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    subscription: {
      id: 'test-subscription-id',
      user_id: 'test-user-id',
      tier: 'showcase',
      status: 'active',
      billing_cycle: 'monthly',
      price: 29,
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    tiers: [
      {
        id: 'essential',
        name: 'Essential',
        price: 0,
        billing_cycle: 'monthly',
        features: ['Basic Profile', 'Portfolio Upload'],
        limits: { portfolio_uploads: 5 },
        is_trial_eligible: false,
      },
      {
        id: 'showcase',
        name: 'Showcase',
        price: 29,
        billing_cycle: 'monthly',
        features: ['Enhanced Profile', 'Priority Visibility'],
        limits: { portfolio_uploads: 20 },
        is_trial_eligible: true,
      },
      {
        id: 'spotlight',
        name: 'Spotlight',
        price: 69,
        billing_cycle: 'monthly',
        features: ['Premium Profile', 'Top Visibility'],
        limits: { portfolio_uploads: -1 },
        is_trial_eligible: true,
      },
    ],
    trial: null,
    loading: false,
    error: null,
    createSubscription: jest.fn(),
    startTrial: jest.fn(),
    upgradeSubscription: jest.fn(),
    downgradeSubscription: jest.fn(),
    calculatePricing: jest.fn(),
    validatePromotionalCode: jest.fn(),
    hasFeatureAccess: jest.fn(),
    refreshSubscription: jest.fn(),
  }),
}));

describe('SubscriptionManagement', () => {
  it('renders subscription management interface', async () => {
    render(<SubscriptionManagement />);

    expect(screen.getByText('Subscription Management')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your subscription and access premium features')
    ).toBeInTheDocument();
  });

  it('displays current subscription information', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText('Current Subscription')).toBeInTheDocument();
      expect(screen.getByText('Showcase')).toBeInTheDocument();
      expect(screen.getByText('$29.00')).toBeInTheDocument();
    });
  });

  it('shows subscription management tabs', async () => {
    render(<SubscriptionManagement />);

    expect(screen.getByText('Plans')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('Upgrade/Downgrade')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('displays quick actions for current subscription', async () => {
    render(<SubscriptionManagement />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('View Billing History')).toBeInTheDocument();
      expect(screen.getByText('Update Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Download Invoice')).toBeInTheDocument();
    });
  });
});
