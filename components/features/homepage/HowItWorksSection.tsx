'use client';

import React, { useState, useContext } from 'react';
import {
  Search,
  MessageCircle,
  CheckCircle,
  Users,
  Calendar,
  Star,
  ArrowRight,
  User,
  Briefcase,
} from 'lucide-react';
import { HomepageModalContext } from './HomepageLayout';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
}

interface HowItWorksSectionProps {
  className?: string;
}

const eventManagerSteps: Step[] = [
  {
    id: '1',
    title: 'Create Your Event',
    description: 'Tell us about your event and requirements',
    icon: Calendar,
    details: [
      'Event type and date',
      'Guest count and budget',
      'Location and special requirements',
      'Preferred contractor types',
    ],
  },
  {
    id: '2',
    title: 'Get Matched',
    description: 'Our AI finds the perfect contractors for you',
    icon: Search,
    details: [
      'AI-powered matching algorithm',
      'Verified contractor profiles',
      'Customized recommendations',
      'Budget-optimized suggestions',
    ],
  },
  {
    id: '3',
    title: 'Book & Enjoy',
    description: 'Connect with contractors and plan your event',
    icon: CheckCircle,
    details: [
      'Direct contractor communication',
      'Secure payment processing',
      'Event timeline management',
      'Real-time updates and support',
    ],
  },
];

const contractorSteps: Step[] = [
  {
    id: '1',
    title: 'Join Our Platform',
    description: 'Create your professional contractor profile',
    icon: User,
    details: [
      'Complete your profile',
      'Upload portfolio and credentials',
      'Set your service areas',
    ],
  },
  {
    id: '2',
    title: 'Get Discovered',
    description: 'Let event managers find you through our platform',
    icon: Users,
    details: [
      'Appear in search results',
      'Receive booking requests',
      'Showcase your work',
      'Build your reputation',
    ],
  },
  {
    id: '3',
    title: 'Grow Your Business',
    description: 'Build relationships and grow your client base',
    icon: Star,
    details: [
      'Secure new bookings',
      'Receive reviews and ratings',
      'Access business tools',
      'Join our contractor community',
    ],
  },
];

export function HowItWorksSection({ className = '' }: HowItWorksSectionProps) {
  const [activeTab, setActiveTab] = useState<'event-managers' | 'contractors'>(
    'event-managers'
  );
  const modalContext = useContext(HomepageModalContext);

  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple steps to connect event managers with qualified contractors
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('event-managers')}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                activeTab === 'event-managers'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Event Managers
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contractors')}
              className={`px-6 py-3 rounded-md font-semibold transition-all duration-300 ${
                activeTab === 'contractors'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contractors
              </div>
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {(activeTab === 'event-managers'
            ? eventManagerSteps
            : contractorSteps
          ).map((step, index) => {
            const IconComponent = step.icon;

            return (
              <div key={step.id} className="relative h-full">
                {/* Connection line */}
                {index <
                  (activeTab === 'event-managers'
                    ? eventManagerSteps
                    : contractorSteps
                  ).length -
                    1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-orange-200 to-amber-200 transform translate-x-4 z-0"></div>
                )}

                <div className="relative z-10 bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-full flex flex-col">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-orange-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Why Choose Event Pros NZ?
            </h3>
            <p className="text-gray-600">
              Join many satisfied users across New Zealand
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Verified Contractors
              </h4>
              <p className="text-sm text-gray-600">
                All contractors are verified and background checked
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Direct Communication
              </h4>
              <p className="text-sm text-gray-600">
                Connect directly with contractors through our platform
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Quality Guaranteed
              </h4>
              <p className="text-sm text-gray-600">
                5-star rated contractors with proven track records
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => modalContext?.onRegisterClick('event_manager')}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              Get Started as Event Manager
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => modalContext?.onRegisterClick('contractor')}
              className="border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-300 flex items-center gap-2"
            >
              Join as Contractor
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
