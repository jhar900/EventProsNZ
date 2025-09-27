import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionTiers } from '@/components/features/subscriptions/SubscriptionTiers';

const mockTiers = [
  {
    id: 'essential',
    name: 'Essential',
    price: 0,
    billing_cycle: 'monthly',
    features: ['Basic Profile', 'Portfolio Upload', 'Basic Search Visibility'],
    limits: { portfolio_uploads: 5 },
    is_trial_eligible: false,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    price: 29,
    billing_cycle: 'monthly',
    features: ['Enhanced Profile', 'Priority Visibility', 'Advanced Analytics'],
    limits: { portfolio_uploads: 20 },
    is_trial_eligible: true,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 69,
    billing_cycle: 'monthly',
    features: ['Premium Profile', 'Top Visibility', 'Premium Analytics'],
    limits: { portfolio_uploads: -1 },
    is_trial_eligible: true,
  },
];

const mockCurrentSubscription = {
  id: 'test-subscription-id',
  user_id: 'test-user-id',
  tier: 'showcase',
  status: 'active',
  billing_cycle: 'monthly',
  price: 29,
  start_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('SubscriptionTiers', () => {
  it('renders subscription tiers', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={mockCurrentSubscription}
        onSubscriptionChange={jest.fn()}
      />
    );

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByText('Showcase')).toBeInTheDocument();
    expect(screen.getByText('Spotlight')).toBeInTheDocument();
  });

  it('displays tier pricing correctly', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={mockCurrentSubscription}
        onSubscriptionChange={jest.fn()}
      />
    );

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('$69')).toBeInTheDocument();
  });

  it('shows current plan badge for active subscription', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={mockCurrentSubscription}
        onSubscriptionChange={jest.fn()}
      />
    );

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('displays tier features', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={mockCurrentSubscription}
        onSubscriptionChange={jest.fn()}
      />
    );

    expect(screen.getByText('Basic Profile')).toBeInTheDocument();
    expect(screen.getByText('Enhanced Profile')).toBeInTheDocument();
    expect(screen.getByText('Premium Profile')).toBeInTheDocument();
  });

  it('shows trial buttons for eligible tiers', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={null}
        onSubscriptionChange={jest.fn()}
      />
    );

    expect(screen.getAllByText('Start Free Trial')).toHaveLength(2);
    expect(screen.getAllByText('Subscribe Now')).toHaveLength(3);
  });

  it('disables current plan button', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={mockCurrentSubscription}
        onSubscriptionChange={jest.fn()}
      />
    );

    const currentPlanButton = screen.getByText('Current Plan');
    expect(currentPlanButton).toBeDisabled();
  });

  it('shows pricing calculator toggle', () => {
    render(
      <SubscriptionTiers
        tiers={mockTiers}
        currentSubscription={mockCurrentSubscription}
        onSubscriptionChange={jest.fn()}
      />
    );

    expect(screen.getByText('Show Pricing Calculator')).toBeInTheDocument();
  });
});
