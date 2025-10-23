'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestimonialModeration } from '@/components/features/testimonials/platform/TestimonialModeration';
import { TestimonialAnalytics } from '@/components/features/testimonials/platform/TestimonialAnalytics';
import { Shield, BarChart3, Users } from 'lucide-react';

interface Testimonial {
  id: string;
  rating: number;
  feedback: string;
  category: 'event_manager' | 'contractor';
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  approved_at?: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('moderation');

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(
          '/api/testimonials/platform?status=pending'
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch testimonials');
        }

        setTestimonials(data.testimonials || []);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch testimonials'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const handleTestimonialUpdate = () => {
    // Refresh testimonials after moderation
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials/platform');
        const data = await response.json();

        if (response.ok) {
          setTestimonials(data.testimonials || []);
        }
      } catch (err) {
        console.error('Error refreshing testimonials:', err);
      }
    };

    fetchTestimonials();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Shield className="h-8 w-8" />
          <span>Testimonial Management</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Moderate and analyze platform testimonials
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="moderation"
            className="flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Moderation</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testimonial Moderation</CardTitle>
              <CardDescription>
                Review and approve platform testimonials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestimonialModeration
                testimonials={testimonials}
                onTestimonialUpdate={handleTestimonialUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TestimonialAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
