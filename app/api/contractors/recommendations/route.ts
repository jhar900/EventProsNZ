import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ContractorRecommendation {
  contractor: any;
  matchScore: number;
  reasoning: string[];
  estimatedCost: number;
  estimatedTimeline: string;
  availability: boolean;
  priority: 'high' | 'medium' | 'low';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const serviceName = searchParams.get('service_name');
    const eventType = searchParams.get('event_type');
    const location = searchParams.get('location');
    const budget = searchParams.get('budget');
    const guestCount = searchParams.get('guest_count');
    const eventDate = searchParams.get('event_date');

    // Filter parameters
    const filterLocation = searchParams.get('filter_location');
    const filterPriceRange = searchParams.get('filter_price_range');
    const filterRating = searchParams.get('filter_rating');
    const filterAvailability = searchParams.get('filter_availability');
    const filterVerified = searchParams.get('filter_verified');

    if (!serviceId || !serviceName || !eventType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build the base query for contractors
    let query = supabase
      .from('users')
      .select(
        `
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        ),
        business_profiles:user_id (
          company_name,
          description,
          website,
          location,
          service_categories,
          average_rating,
          review_count,
          is_verified,
          subscription_tier
        ),
        services:user_id (
          service_type,
          description,
          price_range_min,
          price_range_max,
          availability
        ),
        contractor_testimonials:user_id (
          rating,
          comment,
          event_title,
          event_date,
          is_verified
        )
      `
      )
      .eq('role', 'contractor')
      .eq('is_verified', true);

    // Apply filters
    if (filterVerified === 'true') {
      query = query.eq('is_verified', true);
    }

    if (filterLocation) {
      query = query.ilike('business_profiles.location', `%${filterLocation}%`);
    }

    if (filterRating) {
      const minRating = parseFloat(filterRating);
      query = query.gte('business_profiles.average_rating', minRating);
    }

    if (filterAvailability) {
      // For now, we'll use a simple availability check based on services
      // In a real implementation, you might have an availability table
      if (filterAvailability === 'available') {
        query = query.eq('services.availability', 'available');
      } else if (filterAvailability === 'busy') {
        query = query.eq('services.availability', 'busy');
      }
    }

    // Execute the query
    const { data: contractors, error } = await query;

    if (error) {
      console.error('Error fetching contractors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    if (!contractors || contractors.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Calculate AI recommendations for each contractor
    const recommendations: ContractorRecommendation[] = contractors.map(
      contractor => {
        const matchScore = calculateMatchScore(contractor, {
          serviceId,
          serviceName,
          eventType,
          location,
          budget: budget ? parseInt(budget) : undefined,
          guestCount: guestCount ? parseInt(guestCount) : undefined,
          eventDate,
        });

        const reasoning = generateReasoning(contractor, {
          serviceName,
          eventType,
          location,
          budget: budget ? parseInt(budget) : undefined,
          guestCount: guestCount ? parseInt(guestCount) : undefined,
        });

        const estimatedCost = estimateCost(contractor, {
          serviceName,
          eventType,
          guestCount: guestCount ? parseInt(guestCount) : undefined,
          budget: budget ? parseInt(budget) : undefined,
        });

        const estimatedTimeline = estimateTimeline(contractor, {
          serviceName,
          eventType,
          eventDate,
        });

        const priority = determinePriority(matchScore, contractor);

        return {
          contractor: {
            id: contractor.id,
            name: `${contractor.profiles?.[0]?.first_name || ''} ${contractor.profiles?.[0]?.last_name || ''}`.trim(),
            businessName: contractor.business_profiles?.[0]?.company_name || '',
            email: contractor.profiles?.[0]?.email,
            phone: contractor.profiles?.[0]?.phone,
            website: contractor.business_profiles?.[0]?.website,
            location: {
              address: contractor.business_profiles?.[0]?.location || '',
              city: contractor.business_profiles?.[0]?.location || '',
              region: contractor.business_profiles?.[0]?.location || '',
              coordinates: {
                lat: 0, // Would need geocoding in real implementation
                lng: 0,
              },
            },
            services:
              contractor.services?.map((s: any) => s.service_type) || [],
            specializations:
              contractor.business_profiles?.[0]?.service_categories || [],
            rating: contractor.business_profiles?.[0]?.average_rating || 0,
            reviewCount: contractor.business_profiles?.[0]?.review_count || 0,
            priceRange: {
              min: contractor.services?.[0]?.price_range_min || 0,
              max: contractor.services?.[0]?.price_range_max || 0,
              currency: 'NZD',
            },
            availability: {
              isAvailable:
                contractor.services?.[0]?.availability === 'available',
              nextAvailableDate: undefined, // Would need availability table
            },
            portfolio: {
              images: [], // Would need portfolio table
              videos: [],
              description: contractor.business_profiles?.[0]?.description || '',
            },
            certifications: [], // Would need certifications table
            experience: 0, // Would need experience field
            isVerified: contractor.business_profiles?.[0]?.is_verified || false,
            isPremium:
              contractor.business_profiles?.[0]?.subscription_tier ===
              'spotlight',
            responseTime: '24h', // Would need response time field
            completionRate: 95, // Would need completion rate calculation
            lastActive: contractor.updated_at,
          },
          matchScore,
          reasoning,
          estimatedCost,
          estimatedTimeline,
          availability: contractor.services?.[0]?.availability === 'available',
          priority,
        };
      }
    );

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Apply price range filter
    let filteredRecommendations = recommendations;
    if (filterPriceRange) {
      filteredRecommendations = recommendations.filter(rec => {
        const cost = rec.estimatedCost;
        switch (filterPriceRange) {
          case 'under-1000':
            return cost < 1000;
          case '1000-5000':
            return cost >= 1000 && cost <= 5000;
          case '5000-10000':
            return cost >= 5000 && cost <= 10000;
          case 'over-10000':
            return cost > 10000;
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      recommendations: filteredRecommendations,
      total: filteredRecommendations.length,
      filters: {
        location: filterLocation,
        priceRange: filterPriceRange,
        rating: filterRating,
        availability: filterAvailability,
        verified: filterVerified === 'true',
      },
    });
  } catch (error) {
    console.error('Error in contractor recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateMatchScore(contractor: any, context: any): number {
  let score = 0;
  let factors = 0;

  // Service match (40% weight)
  const serviceMatch = contractor.services?.some((service: any) =>
    service.service_type
      .toLowerCase()
      .includes(context.serviceName.toLowerCase())
  );

  if (serviceMatch) {
    score += 40;
  }
  factors++;

  // Rating (20% weight)
  const rating = contractor.business_profiles?.[0]?.average_rating || 0;
  if (rating >= 4.5) {
    score += 20;
  } else if (rating >= 4.0) {
    score += 15;
  } else if (rating >= 3.5) {
    score += 10;
  } else if (rating >= 3.0) {
    score += 5;
  }
  factors++;

  // Experience (15% weight) - using review count as proxy
  const reviewCount = contractor.business_profiles?.[0]?.review_count || 0;
  if (reviewCount >= 50) {
    score += 15;
  } else if (reviewCount >= 20) {
    score += 12;
  } else if (reviewCount >= 5) {
    score += 8;
  } else {
    score += 3;
  }
  factors++;

  // Availability (10% weight)
  const isAvailable = contractor.services?.[0]?.availability === 'available';
  if (isAvailable) {
    score += 10;
  } else {
    score += 5; // Partial points for busy contractors
  }
  factors++;

  // Location match (10% weight)
  if (context.location && contractor.business_profiles?.[0]?.location) {
    const contractorLocation =
      contractor.business_profiles[0].location.toLowerCase();
    const eventLocation = context.location.toLowerCase();

    if (
      contractorLocation.includes(eventLocation) ||
      eventLocation.includes(contractorLocation)
    ) {
      score += 10;
    } else {
      score += 5; // Partial points for different locations
    }
  } else {
    score += 5; // Default points if no location specified
  }
  factors++;

  // Budget match (5% weight)
  if (context.budget && contractor.services?.[0]) {
    const service = contractor.services[0];
    const minPrice = service.price_range_min || 0;
    const maxPrice = service.price_range_max || 0;

    if (context.budget >= minPrice && context.budget <= maxPrice) {
      score += 5;
    } else if (
      context.budget >= minPrice * 0.8 &&
      context.budget <= maxPrice * 1.2
    ) {
      score += 3;
    }
  } else {
    score += 2.5; // Default points if no budget specified
  }
  factors++;

  return Math.round(score);
}

function generateReasoning(contractor: any, context: any): string[] {
  const reasoning: string[] = [];

  // Service match
  const serviceMatch = contractor.services?.some((service: any) =>
    service.service_type
      .toLowerCase()
      .includes(context.serviceName.toLowerCase())
  );

  if (serviceMatch) {
    reasoning.push(`Specializes in ${context.serviceName} services`);
  }

  // Rating
  const rating = contractor.business_profiles?.[0]?.average_rating || 0;
  if (rating >= 4.5) {
    reasoning.push(`Excellent rating of ${rating} stars`);
  } else if (rating >= 4.0) {
    reasoning.push(`High rating of ${rating} stars`);
  }

  // Experience (using review count as proxy)
  const reviewCount = contractor.business_profiles?.[0]?.review_count || 0;
  if (reviewCount >= 50) {
    reasoning.push(`Experienced with ${reviewCount} reviews`);
  } else if (reviewCount >= 20) {
    reasoning.push(`Experienced with ${reviewCount} reviews`);
  }

  // Availability
  const isAvailable = contractor.services?.[0]?.availability === 'available';
  if (isAvailable) {
    reasoning.push('Currently available for new projects');
  }

  // Location
  if (context.location && contractor.business_profiles?.[0]?.location) {
    const contractorLocation = contractor.business_profiles[0].location;
    reasoning.push(`Located in ${contractorLocation}`);
  }

  // Verification
  if (contractor.business_profiles?.[0]?.is_verified) {
    reasoning.push('Verified contractor with background checks');
  }

  // Premium status
  if (contractor.business_profiles?.[0]?.subscription_tier === 'spotlight') {
    reasoning.push('Premium contractor with enhanced services');
  }

  // Review count
  const reviews = contractor.business_profiles?.[0]?.review_count || 0;
  if (reviews >= 20) {
    reasoning.push(`${reviews} customer reviews`);
  }

  return reasoning;
}

function estimateCost(contractor: any, context: any): number {
  const service = contractor.services?.[0];
  if (!service) return 0;

  let baseCost = (service.price_range_min + service.price_range_max) / 2;

  // Adjust for guest count
  if (context.guestCount) {
    if (context.guestCount > 100) {
      baseCost *= 1.2;
    } else if (context.guestCount > 50) {
      baseCost *= 1.1;
    }
  }

  // Adjust for event type
  if (context.eventType === 'wedding') {
    baseCost *= 1.3;
  } else if (context.eventType === 'corporate') {
    baseCost *= 1.1;
  }

  return Math.round(baseCost);
}

function estimateTimeline(contractor: any, context: any): string {
  const reviewCount = contractor.business_profiles?.[0]?.review_count || 0;

  // Base timeline based on service type
  let baseDays = 7;
  if (context.serviceName.toLowerCase().includes('photography')) {
    baseDays = 14;
  } else if (context.serviceName.toLowerCase().includes('catering')) {
    baseDays = 21;
  } else if (context.serviceName.toLowerCase().includes('venue')) {
    baseDays = 30;
  }

  // Adjust for experience (using review count as proxy)
  if (reviewCount >= 50) {
    baseDays = Math.round(baseDays * 0.8);
  } else if (reviewCount < 5) {
    baseDays = Math.round(baseDays * 1.3);
  }

  // Adjust for event type
  if (context.eventType === 'wedding') {
    baseDays = Math.round(baseDays * 1.2);
  }

  if (baseDays < 7) {
    return `${baseDays} days`;
  } else if (baseDays < 30) {
    const weeks = Math.round(baseDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.round(baseDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
}

function determinePriority(
  matchScore: number,
  contractor: any
): 'high' | 'medium' | 'low' {
  if (matchScore >= 85) {
    return 'high';
  } else if (matchScore >= 65) {
    return 'medium';
  } else {
    return 'low';
  }
}
