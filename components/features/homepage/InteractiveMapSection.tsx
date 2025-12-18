'use client';

import React from 'react';
import { SimpleMap } from './SimpleMap';
import Link from 'next/link';

interface InteractiveMapSectionProps {
  className?: string;
}

export function InteractiveMapSection({
  className = '',
}: InteractiveMapSectionProps) {
  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Find Contractors Across New Zealand
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover qualified contractors in your area with our interactive map
          </p>
        </div>
      </div>

      {/* Map container - Full width of screen */}
      <div className="w-full mb-8">
        <SimpleMap className="w-full" />
      </div>

      {/* CTA - Back in container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mt-12">
          <Link
            href="/contractors"
            className="inline-block bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          >
            Explore All Contractors
          </Link>
        </div>
      </div>
    </section>
  );
}
