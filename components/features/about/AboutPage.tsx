'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Heart, Award, Clock, Star } from 'lucide-react';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';
import TeamSection from './TeamSection';
import CompanyValuesSection from './CompanyValuesSection';
import CompanyHistoryTimeline from './CompanyHistoryTimeline';
import { AboutContent } from '@/types/about';

interface AboutPageProps {
  className?: string;
}

export default function AboutPage({ className }: AboutPageProps) {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/about/content');
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        }
      } catch (error) {
        // console.error('Failed to fetch about content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"
          role="status"
          aria-label="Loading about page content"
        ></div>
      </div>
    );
  }

  return (
    <HomepageLayout
      className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}
    >
      {/* Content with top padding to account for fixed navigation */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                About <span className="text-orange-600">Event Pros NZ</span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                New Zealand&apos;s{' '}
                <span className="text-orange-600 font-semibold">
                  premier platform
                </span>{' '}
                connecting event managers with{' '}
                <span className="text-orange-600 font-semibold">
                  trusted contractors
                </span>
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  Proudly New Zealand
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  500+ Verified Contractors
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Award className="w-4 h-4 mr-2" />
                  Trusted by 1000+ Events
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Company Story Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center mb-6">
                  Our Story
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">
                      Building New Zealand&apos;s Event Community
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Founded in 2024, Event Pros NZ was born from a simple
                      belief: that every event in New Zealand deserves access to
                      the best contractors and services. We saw the challenges
                      event managers faced in finding reliable, verified
                      contractors across our beautiful country.
                    </p>
                    <p className="text-gray-600 mb-4">
                      From the bustling streets of Auckland to the scenic
                      landscapes of Queenstown, we&apos;re building a platform
                      that celebrates New Zealand&apos;s unique event culture
                      while connecting professionals nationwide.
                    </p>
                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="font-semibold">Passionate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold">Quality-Focused</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold">Reliable</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-8">
                    <h4 className="text-xl font-semibold mb-4">Our Mission</h4>
                    <p className="text-gray-700 mb-4">
                      To revolutionize event planning in New Zealand by creating
                      a trusted, efficient platform that connects event managers
                      with verified contractors, fostering a thriving event
                      community.
                    </p>
                    <h4 className="text-xl font-semibold mb-4">Our Vision</h4>
                    <p className="text-gray-700">
                      To be New Zealand&apos;s leading event planning platform,
                      known for quality, reliability, and innovation in
                      connecting event professionals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Company Values Section */}
        <CompanyValuesSection />

        {/* Team Section */}
        <TeamSection />

        {/* Company History Timeline */}
        <CompanyHistoryTimeline />

        {/* New Zealand Focus Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center mb-6">
                  Proudly New Zealand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Nationwide Coverage
                    </h3>
                    <p className="text-gray-600">
                      From Northland to Southland, we connect event
                      professionals across all of New Zealand.
                    </p>
                  </div>
                  <div>
                    <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Local Expertise
                    </h3>
                    <p className="text-gray-600">
                      Our contractors understand New Zealand&apos;s unique event
                      culture and requirements.
                    </p>
                  </div>
                  <div>
                    <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Quality Standards
                    </h3>
                    <p className="text-gray-600">
                      We maintain high standards that reflect New Zealand&apos;s
                      reputation for excellence.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Plan Your Next Event?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of event managers who trust Event Pros NZ for their
              event planning needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-3">
                Get Started Today
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </div>
    </HomepageLayout>
  );
}
