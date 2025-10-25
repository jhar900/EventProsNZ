'use client';

import React, { useEffect, useState } from 'react';
import { Users, Calendar, Star, TrendingUp, Award, Globe } from 'lucide-react';

interface Statistic {
  id: string;
  value: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  suffix?: string;
  prefix?: string;
}

interface StatisticsSectionProps {
  statistics?: Statistic[];
  className?: string;
}

const defaultStatistics: Statistic[] = [
  {
    id: '1',
    value: 500,
    label: 'Verified Contractors',
    description: 'Professional contractors across New Zealand',
    icon: Users,
    color: 'blue',
    suffix: '+',
  },
  {
    id: '2',
    value: 1000,
    label: 'Events Planned',
    description: 'Successful events delivered',
    icon: Calendar,
    color: 'green',
    suffix: '+',
  },
  {
    id: '3',
    value: 98,
    label: 'Success Rate',
    description: 'Client satisfaction rate',
    icon: Star,
    color: 'yellow',
    suffix: '%',
  },
  {
    id: '4',
    value: 50,
    label: 'Service Categories',
    description: 'Different types of services available',
    icon: Award,
    color: 'purple',
    suffix: '+',
  },
  {
    id: '5',
    value: 15,
    label: 'Cities Covered',
    description: 'Major cities across New Zealand',
    icon: Globe,
    color: 'indigo',
    suffix: '+',
  },
  {
    id: '6',
    value: 24,
    label: 'Support Hours',
    description: 'Round-the-clock customer support',
    icon: TrendingUp,
    color: 'red',
    suffix: '/7',
  },
];

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  red: 'bg-red-100 text-red-600',
};

export function StatisticsSection({
  statistics = defaultStatistics,
  className = '',
}: StatisticsSectionProps) {
  const [animatedStats, setAnimatedStats] = useState<Record<string, number>>(
    {}
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('statistics-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const animateValue = (stat: Statistic) => {
      const duration = 2000; // 2 seconds
      const start = 0;
      const end = stat.value;
      const increment = end / (duration / 16); // 60fps

      let current = start;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          current = end;
          clearInterval(timer);
        }
        setAnimatedStats(prev => ({
          ...prev,
          [stat.id]: Math.floor(current),
        }));
      }, 16);
    };

    statistics.forEach(stat => {
      animateValue(stat);
    });
  }, [isVisible, statistics]);

  return (
    <section id="statistics-section" className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Event Pros NZ for
            their event needs
          </p>
        </div>

        {/* Statistics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {statistics.map(stat => {
            const IconComponent = stat.icon;
            const colorClass =
              colorClasses[stat.color as keyof typeof colorClasses];
            const animatedValue = animatedStats[stat.id] || 0;

            return (
              <div
                key={stat.id}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center"
              >
                {/* Icon */}
                <div
                  className={`w-16 h-16 ${colorClass} rounded-xl flex items-center justify-center mx-auto mb-4`}
                >
                  <IconComponent className="w-8 h-8" />
                </div>

                {/* Animated value */}
                <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                  {stat.prefix}
                  {animatedValue}
                  {stat.suffix}
                </div>

                {/* Label */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Additional stats section */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Platform Growth
            </h3>
            <p className="text-gray-600">
              We&apos;re growing fast and making a real impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">4.8</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                2.5k
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">15k</div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
          </div>
        </div>

        {/* Testimonial quote */}
        <div className="text-center mt-16">
          <blockquote className="text-xl text-gray-700 italic max-w-3xl mx-auto">
            &quot;Event Pros NZ has revolutionized how we plan events. The
            platform connects us with the best contractors in New Zealand, and
            the results speak for themselves.&quot;
          </blockquote>
          <div className="mt-4">
            <div className="font-semibold text-gray-900">Sarah Mitchell</div>
            <div className="text-gray-600">
              Event Manager, Wellington Events Co.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
            Join Our Growing Community
          </button>
        </div>
      </div>
    </section>
  );
}
