import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureComparisonTable } from '@/components/features/pricing/FeatureComparisonTable';

const mockTiers = [
  {
    id: 'essential',
    name: 'Essential',
    price: 0,
    price_annual: 0,
    billing_cycle: 'monthly',
    features: ['Basic profile', '3 events'],
    limits: { events: 3 },
    is_trial_eligible: false,
    is_popular: false,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    price: 29,
    price_annual: 299,
    billing_cycle: 'monthly',
    features: ['Enhanced profile', 'Unlimited events'],
    limits: { events: -1 },
    is_trial_eligible: true,
    is_popular: true,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    price: 69,
    price_annual: 699,
    billing_cycle: 'monthly',
    features: ['Premium profile', 'All features'],
    limits: { events: -1 },
    is_trial_eligible: true,
    is_popular: false,
  },
];

describe('FeatureComparisonTable', () => {
  it('renders feature comparison table', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    expect(screen.getByText('Feature Comparison')).toBeInTheDocument();
    expect(screen.getAllByText('Essential').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Showcase').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Spotlight').length).toBeGreaterThan(0);
  });

  it('displays feature categories', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visibility').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Events').length).toBeGreaterThan(0);
  });

  it('shows feature descriptions', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    expect(
      screen.getByText('Create and manage your business profile')
    ).toBeInTheDocument();
    expect(
      screen.getByText('How prominently you appear in search results')
    ).toBeInTheDocument();
  });

  it('displays feature availability for each tier', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    expect(screen.getAllByText('Basic profile').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Enhanced profile').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Premium profile').length).toBeGreaterThan(0);
  });

  it('shows checkmarks for included features', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    // Look for check icons by their class name
    const checkIcons = document.querySelectorAll('.lucide-check');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('shows X marks for excluded features', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    // Look for X icons by their class name
    const xIcons = document.querySelectorAll('.lucide-x');
    expect(xIcons.length).toBeGreaterThan(0);
  });

  it('handles tier selection', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    const chooseButtons = screen.getAllByText(/Choose/);
    expect(chooseButtons.length).toBe(3);

    fireEvent.click(chooseButtons[0]);
    // Should not throw error
    expect(chooseButtons[0]).toBeInTheDocument();
  });

  it('displays popular badge for popular tier', () => {
    render(<FeatureComparisonTable tiers={mockTiers} />);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('handles empty tiers array', () => {
    render(<FeatureComparisonTable tiers={[]} />);

    // Should not crash
    expect(screen.getByText('Feature Comparison')).toBeInTheDocument();
  });

  it('renders mobile view correctly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<FeatureComparisonTable tiers={mockTiers} />);

    expect(screen.getByText('Feature Comparison')).toBeInTheDocument();
  });
});
