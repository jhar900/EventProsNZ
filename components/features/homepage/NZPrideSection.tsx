'use client';

import React from 'react';
import {
  MapPin,
  Heart,
  Flag,
  Users,
  Award,
  Coffee,
  Mountain,
  Waves,
} from 'lucide-react';

interface NZPrideSectionProps {
  className?: string;
}

export function NZPrideSection({ className = '' }: NZPrideSectionProps) {
  return (
    <section
      className={`py-20 bg-gradient-to-br from-red-50 via-white to-blue-50 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Flag className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              EventPros.co.nz Is Proudly Made In NZ
            </h2>
            <Flag className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Supporting New Zealand&apos;s event industry with local expertise,
            innovative technology, and a deep commitment to our community.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Mission statement */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Heart className="w-6 h-6 text-red-500" />
                Our Mission
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We&apos;re passionate about supporting New Zealand&apos;s
                vibrant event industry. Our platform connects local talent with
                local opportunities, fostering economic growth and community
                connections across Aotearoa.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Local Focus</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Supporting New Zealand businesses and keeping money in our
                  local economy.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Quality First</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Maintaining high standards that reflect New Zealand&apos;s
                  reputation for excellence.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Coffee className="w-6 h-6 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">
                    Community Spirit
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Building connections and relationships that strengthen our
                  communities.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Mountain className="w-6 h-6 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Innovation</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Using technology to solve real problems for New Zealand event
                  professionals.
                </p>
              </div>
            </div>
          </div>

          {/* NZ Map visualization */}
          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Serving All of New Zealand
              </h3>

              {/* Simplified NZ map representation */}
              <div className="relative w-full h-80 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl overflow-hidden">
                {/* North Island */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-20 bg-green-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold text-green-800">
                      North Island
                    </div>
                  </div>
                </div>

                {/* South Island */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-28 h-32 bg-green-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold text-green-800">
                      South Island
                    </div>
                  </div>
                </div>

                {/* Major cities indicators */}
                <div className="absolute top-12 left-8 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute top-16 right-12 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 left-16 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute bottom-12 right-8 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>

                {/* Waves decoration */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-200 to-transparent">
                  <Waves className="w-full h-full text-blue-300" />
                </div>
              </div>

              {/* Stats overlay */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">15+</div>
                  <div className="text-sm text-gray-600">Cities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-gray-600">Contractors</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Flag className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Heart className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* Testimonial from NZ business */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center">
            <blockquote className="text-xl text-gray-700 italic mb-6">
              &quot;As a New Zealand business, we&apos;re proud to support local
              contractors and event managers. Event Pros NZ understands our
              unique market and delivers solutions that work for Kiwi
              businesses.&quot;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                JM
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">
                  James Mitchell
                </div>
                <div className="text-gray-600">
                  Founder, Auckland Events Ltd.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-red-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Join the NZ Event Community
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Support Local Business
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
