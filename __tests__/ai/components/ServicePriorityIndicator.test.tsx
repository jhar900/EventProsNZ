import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServicePriorityIndicator } from '@/components/features/ai/ServicePriorityIndicator';

describe('ServicePriorityIndicator', () => {
  it('renders high priority service correctly', () => {
    render(
      <ServicePriorityIndicator
        priority={5}
        confidence={0.95}
        isRequired={true}
        showDetails={true}
      />
    );

    expect(screen.getByText('Priority 5 - Critical')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Very High (95%)')).toBeInTheDocument();
    expect(
      screen.getByText('Essential service that cannot be omitted')
    ).toBeInTheDocument();
  });

  it('displays correct priority badge for high priority', () => {
    render(<ServicePriorityIndicator priority={5} confidence={0.95} />);

    const priorityBadge = screen.getByText('Priority 5 - Critical');
    expect(priorityBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays correct priority badge for medium priority', () => {
    render(<ServicePriorityIndicator priority={3} confidence={0.7} />);

    const priorityBadge = screen.getByText('Priority 3 - Medium');
    expect(priorityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('displays correct priority badge for low priority', () => {
    render(<ServicePriorityIndicator priority={2} confidence={0.3} />);

    const priorityBadge = screen.getByText('Priority 2 - Low');
    expect(priorityBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('shows confidence percentage', () => {
    render(<ServicePriorityIndicator priority={5} confidence={0.95} />);

    expect(screen.getByText('Very High (95%)')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
  });

  it('displays required badge when isRequired is true', () => {
    render(<ServicePriorityIndicator priority={5} isRequired={true} />);

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('handles missing confidence gracefully', () => {
    render(<ServicePriorityIndicator priority={5} />);

    expect(screen.getByText('Priority 5 - Critical')).toBeInTheDocument();
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
  });

  it('shows detailed information when showDetails is true', () => {
    render(
      <ServicePriorityIndicator
        priority={5}
        confidence={0.95}
        isRequired={true}
        showDetails={true}
      />
    );

    expect(
      screen.getByText('Essential service that cannot be omitted')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Based on industry data, user preferences, and event type analysis'
      )
    ).toBeInTheDocument();
  });

  it('renders with compact variant (showDetails false)', () => {
    render(
      <ServicePriorityIndicator
        priority={5}
        confidence={0.95}
        showDetails={false}
      />
    );

    expect(screen.getByText('Priority 5 - Critical')).toBeInTheDocument();
    expect(screen.getByText('Very High (95%)')).toBeInTheDocument();
    expect(
      screen.queryByText('Essential service that cannot be omitted')
    ).not.toBeInTheDocument();
  });

  it('renders with detailed variant (showDetails true)', () => {
    render(
      <ServicePriorityIndicator
        priority={5}
        confidence={0.95}
        isRequired={true}
        showDetails={true}
      />
    );

    expect(screen.getByText('Priority 5 - Critical')).toBeInTheDocument();
    expect(screen.getByText('Very High (95%)')).toBeInTheDocument();
    expect(
      screen.getByText('Essential service that cannot be omitted')
    ).toBeInTheDocument();
  });
});
