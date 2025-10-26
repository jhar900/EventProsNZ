'use client';

import React from 'react';
import { HeroSection } from './HeroSection';
import { TestimonialsSection } from './TestimonialsSection';
import { InteractiveMapSection } from './InteractiveMapSection';
import { ServiceCategoriesSection } from './ServiceCategoriesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturedContractorsSection } from './FeaturedContractorsSection';
import { StatisticsSection } from './StatisticsSection';
import { NZPrideSection } from './NZPrideSection';
import { HomepageFooter } from './HomepageFooter';
import { HomepageLayout } from './HomepageLayout';

interface HomepageProps {
  className?: string;
}

export function Homepage({ className = '' }: HomepageProps) {
  return (
    <HomepageLayout className={`min-h-screen ${className}`}>
      {/* Main content with top padding to account for fixed navigation */}
      <main className="pt-16">
        {/* Hero Section */}
        <HeroSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Interactive Map Section */}
        <InteractiveMapSection />

        {/* Service Categories Section */}
        <ServiceCategoriesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Featured Contractors Section */}
        <FeaturedContractorsSection />

        {/* Statistics Section */}
        <StatisticsSection />

        {/* New Zealand Pride Section */}
        <NZPrideSection />
      </main>

      {/* Footer */}
      <HomepageFooter />
    </HomepageLayout>
  );
}
