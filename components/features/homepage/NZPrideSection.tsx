'use client';

import React, { useContext } from 'react';
import { Heart, Flag, Users, Award, Coffee, Mountain } from 'lucide-react';
import { HomepageModalContext } from './HomepageLayout';

interface NZPrideSectionProps {
  className?: string;
}

export function NZPrideSection({ className = '' }: NZPrideSectionProps) {
  const modalContext = useContext(HomepageModalContext);

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

        <div className="grid lg:grid-cols-1 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 max-w-4xl mx-auto">
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
        </div>

        {/* Testimonial from NZ business - Hidden */}
        {/* <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
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
        </div> */}

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => modalContext?.onRegisterClick()}
            className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <Flag className="w-5 h-5" />
            Join the NZ Event Community
          </button>
        </div>
      </div>
    </section>
  );
}
