import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ContractorMatch } from '@/types/events';

export const dynamic = 'force-dynamic';

interface ServiceRequirement {
  category: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedBudget?: number;
}

interface MatchContractorsRequest {
  serviceRequirements: ServiceRequirement[];
  location?: string;
  eventDate?: string;
}

// POST /api/events/match-contractors - Match contractors based on service requirements
export async function POST(request: NextRequest) {
  try {
    const body: MatchContractorsRequest = await request.json();
    const { serviceRequirements, location, eventDate } = body;

    if (!serviceRequirements || serviceRequirements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Service requirements are required' },
        { status: 400 }
      );
    }

    // Extract unique service categories to match
    const categoriesToMatch = [
      ...new Set(serviceRequirements.map(req => req.category.toLowerCase())),
    ];

    console.log(
      '[POST /api/events/match-contractors] Matching categories:',
      categoriesToMatch
    );

    // Fetch contractors that match the service categories
    // Only get published contractors with valid user accounts
    const { data: contractors, error: contractorsError } = await supabaseAdmin
      .from('business_profiles')
      .select(
        `
        id,
        user_id,
        company_name,
        description,
        service_categories,
        average_rating,
        review_count,
        is_verified,
        subscription_tier,
        location,
        users!inner(
          id,
          role,
          status
        )
      `
      )
      .eq('is_published', true)
      .eq('users.role', 'contractor')
      .neq('users.status', 'suspended')
      .not('service_categories', 'is', null);

    if (contractorsError) {
      console.error(
        '[POST /api/events/match-contractors] Error fetching contractors:',
        contractorsError
      );
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    if (!contractors || contractors.length === 0) {
      return NextResponse.json({
        success: true,
        matches: [],
      });
    }

    // Filter contractors that have at least one matching service category
    const matchingContractors = contractors.filter(contractor => {
      if (
        !contractor.service_categories ||
        contractor.service_categories.length === 0
      ) {
        return false;
      }
      const contractorCategories = contractor.service_categories.map(
        (cat: string) => cat.toLowerCase()
      );
      return categoriesToMatch.some(category =>
        contractorCategories.includes(category)
      );
    });

    // Fetch all services for matching contractors in one query
    const contractorUserIds = matchingContractors.map(c => c.user_id);
    const { data: allServices } = await supabaseAdmin
      .from('services')
      .select('user_id, service_type, price_range_min, price_range_max')
      .in('user_id', contractorUserIds);

    // Create a map of user_id -> services for quick lookup
    const servicesByUserId = new Map<string, any[]>();
    if (allServices) {
      allServices.forEach((service: any) => {
        if (!servicesByUserId.has(service.user_id)) {
          servicesByUserId.set(service.user_id, []);
        }
        servicesByUserId.get(service.user_id)!.push(service);
      });
    }

    // Calculate match scores and create matches
    const matches: ContractorMatch[] = matchingContractors.map(contractor => {
      // Find matching categories
      const contractorCategories = (contractor.service_categories || []).map(
        (cat: string) => cat.toLowerCase()
      );
      const matchingCategories = categoriesToMatch.filter(category =>
        contractorCategories.includes(category)
      );

      // Calculate match score based on various factors
      let matchScore = 0.5; // Base score

      // Category match (40% weight)
      const categoryMatchRatio =
        matchingCategories.length / categoriesToMatch.length;
      matchScore += categoryMatchRatio * 0.4;

      // Rating (20% weight)
      const ratingScore = (contractor.average_rating || 0) / 5;
      matchScore += ratingScore * 0.2;

      // Review count (10% weight) - more reviews = higher score (capped at 100 reviews)
      const reviewScore = Math.min((contractor.review_count || 0) / 100, 1);
      matchScore += reviewScore * 0.1;

      // Verification status (10% weight)
      if (contractor.is_verified) {
        matchScore += 0.1;
      }

      // Subscription tier (20% weight)
      const tierScores: Record<string, number> = {
        enterprise: 1.0,
        professional: 0.7,
        essential: 0.4,
      };
      const tierScore = tierScores[contractor.subscription_tier] || 0.4;
      matchScore += tierScore * 0.2;

      // Cap at 1.0
      matchScore = Math.min(matchScore, 1.0);

      // Calculate estimated price from services
      let estimatedPrice = { min: 0, max: 0 };
      const contractorServices = servicesByUserId.get(contractor.user_id) || [];

      if (contractorServices.length > 0) {
        const relevantServices = contractorServices.filter((service: any) =>
          matchingCategories.some(cat =>
            service.service_type?.toLowerCase().includes(cat)
          )
        );

        if (relevantServices.length > 0) {
          const prices = relevantServices
            .filter((s: any) => s.price_range_min && s.price_range_max)
            .map((service: any) => ({
              min: service.price_range_min || 0,
              max: service.price_range_max || 0,
            }));

          if (prices.length > 0) {
            estimatedPrice = {
              min: Math.min(...prices.map(p => p.min)),
              max: Math.max(...prices.map(p => p.max)),
            };
          }
        }
      }

      // If no price from services, use a default based on category
      if (estimatedPrice.min === 0 && estimatedPrice.max === 0) {
        // Default price ranges by category (in NZD)
        const defaultPrices: Record<string, { min: number; max: number }> = {
          catering: { min: 2000, max: 5000 },
          photography: { min: 1000, max: 3000 },
          music: { min: 500, max: 2000 },
          decoration: { min: 500, max: 2000 },
          venue: { min: 1000, max: 5000 },
          entertainment: { min: 500, max: 2500 },
        };

        const category = matchingCategories[0] || '';
        estimatedPrice = defaultPrices[category] || { min: 500, max: 2000 };
      }

      return {
        contractorId: contractor.user_id,
        contractorName: contractor.company_name,
        serviceCategory: matchingCategories[0] || categoriesToMatch[0],
        matchScore: Math.round(matchScore * 100) / 100,
        estimatedPrice,
        availability: true, // TODO: Implement availability checking based on eventDate
        rating: contractor.average_rating || 0,
        reviewCount: contractor.review_count || 0,
      };
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches (limit to 10)
    const topMatches = matches.slice(0, 10);

    console.log(
      `[POST /api/events/match-contractors] Found ${topMatches.length} matches`
    );

    return NextResponse.json({
      success: true,
      matches: topMatches,
    });
  } catch (error) {
    console.error('[POST /api/events/match-contractors] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to match contractors',
      },
      { status: 500 }
    );
  }
}
