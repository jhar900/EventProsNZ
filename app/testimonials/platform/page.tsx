'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlatformTestimonialForm } from '@/components/features/testimonials/platform/PlatformTestimonialForm';
import { TestimonialCard } from '@/components/features/testimonials/platform/TestimonialCard';
import { UserVerification } from '@/components/features/testimonials/platform/UserVerification';
import { Plus, Star, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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

interface UserData {
  role: 'event_manager' | 'contractor';
  first_name: string;
  last_name: string;
}

export default function PlatformTestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-testimonials');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/profile');
        const userData = await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(userData.error || 'Failed to fetch user data');
        }

        setUserData(userData.user);

        // Fetch testimonials
        const testimonialsResponse = await fetch('/api/testimonials/platform');
        const testimonialsData = await testimonialsResponse.json();

        if (!testimonialsResponse.ok) {
          throw new Error(
            testimonialsData.error || 'Failed to fetch testimonials'
          );
        }

        setTestimonials(testimonialsData.testimonials || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTestimonialSubmit = () => {
    // Refresh testimonials after submission
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials/platform');
        const data = await response.json();

        if (response.ok) {
          setTestimonials(data.testimonials || []);
          setActiveTab('my-testimonials');
        }
      } catch (err) {
        console.error('Error refreshing testimonials:', err);
      }
    };

    fetchTestimonials();
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    // Navigate to edit page or open edit modal
    router.push(`/testimonials/platform/${testimonial.id}/edit`);
  };

  const handleDeleteTestimonial = async (testimonial: Testimonial) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/testimonials/platform/${testimonial.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete testimonial');
      }

      toast.success('Testimonial deleted successfully');

      // Refresh testimonials
      setTestimonials(prev => prev.filter(t => t.id !== testimonial.id));
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete testimonial'
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myTestimonials = testimonials.filter(t => t.user.id === userData?.id);
  const publicTestimonials = testimonials.filter(
    t => t.is_public && t.status === 'approved'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Platform Testimonials</h1>
        <p className="text-gray-600 mt-2">
          Share your experience with Event Pros NZ and read what others have to
          say
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-testimonials">My Testimonials</TabsTrigger>
          <TabsTrigger value="submit-testimonial">
            Submit Testimonial
          </TabsTrigger>
          <TabsTrigger value="public-testimonials">
            Public Testimonials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-testimonials" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Testimonials</h2>
            <Button onClick={() => setActiveTab('submit-testimonial')}>
              <Plus className="h-4 w-4 mr-2" />
              Submit New Testimonial
            </Button>
          </div>

          {myTestimonials.length > 0 ? (
            <div className="space-y-4">
              {myTestimonials.map(testimonial => (
                <div key={testimonial.id} className="relative">
                  <TestimonialCard
                    testimonial={testimonial}
                    showStatus={true}
                    showActions={true}
                    onEdit={handleEditTestimonial}
                    onDelete={handleDeleteTestimonial}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No testimonials yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Share your experience with Event Pros NZ
                </p>
                <Button onClick={() => setActiveTab('submit-testimonial')}>
                  Submit Your First Testimonial
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submit-testimonial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PlatformTestimonialForm
                userCategory={userData?.role || 'event_manager'}
                onSuccess={handleTestimonialSubmit}
              />
            </div>
            <div>
              <UserVerification />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="public-testimonials" className="space-y-6">
          <h2 className="text-xl font-semibold">Public Testimonials</h2>

          {publicTestimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTestimonials.map(testimonial => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  showStatus={false}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No public testimonials yet
                </h3>
                <p className="text-gray-600">
                  Be the first to share your experience
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
