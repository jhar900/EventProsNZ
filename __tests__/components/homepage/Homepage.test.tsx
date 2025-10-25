import React from 'react';
import { render, screen } from '@testing-library/react';
import { Homepage } from '@/components/features/homepage/Homepage';

// Mock the individual components
jest.mock('@/components/features/homepage/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
}));

jest.mock('@/components/features/homepage/TestimonialsSection', () => ({
  TestimonialsSection: () => (
    <div data-testid="testimonials-section">Testimonials Section</div>
  ),
}));

jest.mock('@/components/features/homepage/InteractiveMapSection', () => ({
  InteractiveMapSection: () => (
    <div data-testid="interactive-map-section">Interactive Map Section</div>
  ),
}));

jest.mock('@/components/features/homepage/ServiceCategoriesSection', () => ({
  ServiceCategoriesSection: () => (
    <div data-testid="service-categories-section">
      Service Categories Section
    </div>
  ),
}));

jest.mock('@/components/features/homepage/HowItWorksSection', () => ({
  HowItWorksSection: () => (
    <div data-testid="how-it-works-section">How It Works Section</div>
  ),
}));

jest.mock('@/components/features/homepage/FeaturedContractorsSection', () => ({
  FeaturedContractorsSection: () => (
    <div data-testid="featured-contractors-section">
      Featured Contractors Section
    </div>
  ),
}));

jest.mock('@/components/features/homepage/StatisticsSection', () => ({
  StatisticsSection: () => (
    <div data-testid="statistics-section">Statistics Section</div>
  ),
}));

jest.mock('@/components/features/homepage/NZPrideSection', () => ({
  NZPrideSection: () => (
    <div data-testid="nz-pride-section">NZ Pride Section</div>
  ),
}));

jest.mock('@/components/features/homepage/HomepageFooter', () => ({
  HomepageFooter: () => (
    <div data-testid="homepage-footer">Homepage Footer</div>
  ),
}));

jest.mock('@/components/features/homepage/HomepageNavigation', () => ({
  HomepageNavigation: () => (
    <div data-testid="homepage-navigation">Homepage Navigation</div>
  ),
}));

describe('Homepage', () => {
  it('renders all homepage sections', () => {
    render(<Homepage />);

    expect(screen.getByTestId('homepage-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials-section')).toBeInTheDocument();
    expect(screen.getByTestId('interactive-map-section')).toBeInTheDocument();
    expect(
      screen.getByTestId('service-categories-section')
    ).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works-section')).toBeInTheDocument();
    expect(
      screen.getByTestId('featured-contractors-section')
    ).toBeInTheDocument();
    expect(screen.getByTestId('statistics-section')).toBeInTheDocument();
    expect(screen.getByTestId('nz-pride-section')).toBeInTheDocument();
    expect(screen.getByTestId('homepage-footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Homepage className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper structure with navigation, main content, and footer', () => {
    render(<Homepage />);

    const navigation = screen.getByTestId('homepage-navigation');
    const main = navigation.parentElement?.querySelector('main');
    const footer = screen.getByTestId('homepage-footer');

    expect(navigation).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });
});
