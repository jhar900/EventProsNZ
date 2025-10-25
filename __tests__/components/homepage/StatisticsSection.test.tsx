import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StatisticsSection } from '@/components/features/homepage/StatisticsSection';

const mockStatistics = [
  {
    id: '1',
    value: 500,
    label: 'Verified Contractors',
    description: 'Professional contractors across New Zealand',
    color: 'blue',
    suffix: '+',
  },
  {
    id: '2',
    value: 1000,
    label: 'Events Planned',
    description: 'Successful events delivered',
    color: 'green',
    suffix: '+',
  },
];

describe('StatisticsSection', () => {
  it('renders the section heading', () => {
    render(<StatisticsSection />);

    expect(screen.getByText('Our Impact in Numbers')).toBeInTheDocument();
    expect(
      screen.getByText(/Join thousands of satisfied customers/)
    ).toBeInTheDocument();
  });

  it('renders statistics with animated values', async () => {
    render(<StatisticsSection statistics={mockStatistics} />);

    expect(screen.getByText('Verified Contractors')).toBeInTheDocument();
    expect(screen.getByText('Events Planned')).toBeInTheDocument();

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(screen.getByText('500+')).toBeInTheDocument();
        expect(screen.getByText('1000+')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('renders platform growth section', () => {
    render(<StatisticsSection />);

    expect(screen.getByText('Platform Growth')).toBeInTheDocument();
    expect(
      screen.getByText(/We're growing fast and making a real impact/)
    ).toBeInTheDocument();
  });

  it('renders additional stats', () => {
    render(<StatisticsSection />);

    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('renders testimonial quote', () => {
    render(<StatisticsSection />);

    expect(
      screen.getByText(/Event Pros NZ has revolutionized/)
    ).toBeInTheDocument();
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
    expect(
      screen.getByText('Event Manager, Wellington Events Co.')
    ).toBeInTheDocument();
  });

  it('renders CTA button', () => {
    render(<StatisticsSection />);

    expect(screen.getByText('Join Our Growing Community')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatisticsSection className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty statistics array', () => {
    render(<StatisticsSection statistics={[]} />);

    expect(screen.getByText('Our Impact in Numbers')).toBeInTheDocument();
  });
});
