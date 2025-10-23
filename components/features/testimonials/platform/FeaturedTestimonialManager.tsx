'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Star,
  Crown,
  Calendar as CalendarIcon,
  Clock,
  Eye,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
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

interface FeaturedTestimonial {
  id: string;
  testimonial_id: string;
  display_order: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  testimonial: Testimonial;
}

interface FeaturedTestimonialManagerProps {
  className?: string;
}

export function FeaturedTestimonialManager({
  className,
}: FeaturedTestimonialManagerProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredTestimonials, setFeaturedTestimonials] = useState<
    FeaturedTestimonial[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFeatured, setNewFeatured] = useState({
    testimonial_id: '',
    display_order: 1,
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available testimonials
      const testimonialsResponse = await fetch(
        '/api/testimonials/platform?status=approved'
      );
      const testimonialsData = await testimonialsResponse.json();

      if (testimonialsResponse.ok) {
        setTestimonials(testimonialsData.testimonials || []);
      }

      // Fetch featured testimonials
      const featuredResponse = await fetch(
        '/api/testimonials/platform/featured'
      );
      const featuredData = await featuredResponse.json();

      if (featuredResponse.ok) {
        setFeaturedTestimonials(featuredData.featuredTestimonials || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addFeaturedTestimonial = async () => {
    try {
      const response = await fetch('/api/testimonials/platform/featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFeatured),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add featured testimonial');
      }

      toast.success('Featured testimonial added successfully');
      setNewFeatured({
        testimonial_id: '',
        display_order: featuredTestimonials.length + 1,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true,
      });
      await fetchData();
    } catch (error) {
      console.error('Error adding featured testimonial:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add featured testimonial'
      );
    }
  };

  const updateFeaturedTestimonial = async (
    id: string,
    updates: Partial<FeaturedTestimonial>
  ) => {
    try {
      const response = await fetch(
        `/api/testimonials/platform/featured/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update featured testimonial');
      }

      toast.success('Featured testimonial updated successfully');
      setEditingId(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating featured testimonial:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update featured testimonial'
      );
    }
  };

  const deleteFeaturedTestimonial = async (id: string) => {
    try {
      const response = await fetch(
        `/api/testimonials/platform/featured/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete featured testimonial');
      }

      toast.success('Featured testimonial deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting featured testimonial:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete featured testimonial'
      );
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateFeaturedTestimonial(id, { is_active: isActive });
  };

  const getAvailableTestimonials = () => {
    const featuredIds = featuredTestimonials.map(ft => ft.testimonial_id);
    return testimonials.filter(t => !featuredIds.includes(t.id));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchData} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            <span>Featured Testimonials</span>
          </h2>
          <p className="text-gray-600">
            Manage featured testimonials for homepage display
          </p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          <Settings className="h-4 w-4 mr-2" />
          {isEditing ? 'Done Editing' : 'Edit Mode'}
        </Button>
      </div>

      {/* Add New Featured Testimonial */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Featured Testimonial</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testimonial">Select Testimonial</Label>
              <Select
                value={newFeatured.testimonial_id}
                onValueChange={value =>
                  setNewFeatured({ ...newFeatured, testimonial_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a testimonial..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTestimonials().map(testimonial => (
                    <SelectItem key={testimonial.id} value={testimonial.id}>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(testimonial.rating)}
                        </div>
                        <span className="truncate max-w-xs">
                          {testimonial.user.first_name}{' '}
                          {testimonial.user.last_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min="1"
                value={newFeatured.display_order}
                onChange={e =>
                  setNewFeatured({
                    ...newFeatured,
                    display_order: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newFeatured.start_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newFeatured.start_date}
                    onSelect={date =>
                      date &&
                      setNewFeatured({ ...newFeatured, start_date: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(newFeatured.end_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newFeatured.end_date}
                    onSelect={date =>
                      date && setNewFeatured({ ...newFeatured, end_date: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={newFeatured.is_active}
              onCheckedChange={checked =>
                setNewFeatured({ ...newFeatured, is_active: !!checked })
              }
            />
            <Label htmlFor="isActive">Active immediately</Label>
          </div>

          <Button
            onClick={addFeaturedTestimonial}
            disabled={!newFeatured.testimonial_id}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Featured Testimonial
          </Button>
        </CardContent>
      </Card>

      {/* Featured Testimonials List */}
      <div className="space-y-4">
        {featuredTestimonials
          .sort((a, b) => a.display_order - b.display_order)
          .map(featured => (
            <Card key={featured.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <Badge
                        variant="outline"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        #{featured.display_order}
                      </Badge>
                      <Badge
                        variant={featured.is_active ? 'default' : 'secondary'}
                      >
                        {featured.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex">
                        {renderStars(featured.testimonial.rating)}
                      </div>
                    </div>

                    <blockquote className="text-gray-700 italic mb-4">
                      &ldquo;{featured.testimonial.feedback}&rdquo;
                    </blockquote>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Start:{' '}
                          {format(
                            new Date(featured.start_date),
                            'MMM dd, yyyy'
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          End:{' '}
                          {format(new Date(featured.end_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>
                          {featured.testimonial.user.first_name}{' '}
                          {featured.testimonial.user.last_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(featured.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleActive(featured.id, !featured.is_active)
                        }
                      >
                        {featured.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteFeaturedTestimonial(featured.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {featuredTestimonials.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <Crown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No featured testimonials yet</p>
            <p className="text-sm">
              Add testimonials to feature them on the homepage
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
