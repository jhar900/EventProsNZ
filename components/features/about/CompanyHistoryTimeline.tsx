'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Award, MapPin, TrendingUp } from 'lucide-react';

interface TimelineEvent {
  year: string;
  month: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  location?: string;
  milestone?: string;
}

const timelineEvents: TimelineEvent[] = [
  {
    year: '2024',
    month: 'January',
    title: 'Company Founded',
    description:
      'Event Pros NZ was founded in Auckland with a vision to revolutionize event planning in New Zealand.',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    location: 'Auckland',
    milestone: 'Foundation',
  },
  {
    year: '2024',
    month: 'March',
    title: 'First 100 Contractors',
    description:
      'We reached our first milestone of 100 verified contractors across New Zealand.',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    milestone: 'Growth',
  },
  {
    year: '2024',
    month: 'June',
    title: 'Platform Launch',
    description:
      'Official launch of the Event Pros NZ platform with full functionality.',
    icon: Award,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    milestone: 'Launch',
  },
  {
    year: '2024',
    month: 'September',
    title: 'Nationwide Expansion',
    description:
      'Expanded coverage to all major cities and regions across New Zealand.',
    icon: MapPin,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    location: 'Nationwide',
    milestone: 'Expansion',
  },
  {
    year: '2024',
    month: 'December',
    title: '1000+ Events Planned',
    description:
      'Celebrated helping plan over 1000 successful events across New Zealand.',
    icon: TrendingUp,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    milestone: 'Achievement',
  },
];

export default function CompanyHistoryTimeline() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From a small startup to New Zealand&apos;s leading event planning
            platform - here&apos;s our story.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary to-blue-300 rounded-full"></div>

          <div className="space-y-12">
            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={index}
                  className={`relative flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <div
                      className={`w-12 h-12 ${event.bgColor} rounded-full flex items-center justify-center shadow-lg`}
                    >
                      <IconComponent className={`w-6 h-6 ${event.color}`} />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`w-5/12 ${isEven ? 'pr-8' : 'pl-8'}`}>
                    <Card className="shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-sm">
                            {event.month} {event.year}
                          </Badge>
                          {event.milestone && (
                            <Badge variant="secondary" className="text-xs">
                              {event.milestone}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        {event.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{event.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Future vision */}
        <div className="mt-16 text-center">
          <Card className="inline-block shadow-lg">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Looking Forward</h3>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl">
                We&apos;re just getting started. Our vision is to become the
                go-to platform for event planning across New Zealand and beyond,
                while maintaining our commitment to quality and community.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    2025
                  </div>
                  <div className="text-sm text-gray-600">
                    AI-Powered Matching
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    2026
                  </div>
                  <div className="text-sm text-gray-600">
                    International Expansion
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    2027
                  </div>
                  <div className="text-sm text-gray-600">Market Leadership</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
