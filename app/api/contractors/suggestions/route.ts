import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = new Set<string>();

    // Get company name suggestions
    const { data: companySuggestions, error: companyError } = await supabase
      .from('business_profiles')
      .select('company_name')
      .ilike('company_name', `%${q}%`)
      .limit(limit);

    if (!companyError && companySuggestions) {
      companySuggestions.forEach(profile => {
        suggestions.add(profile.company_name);
      });
    }

    // Get service category suggestions
    const { data: serviceSuggestions, error: serviceError } = await supabase
      .from('business_profiles')
      .select('service_categories')
      .not('service_categories', 'is', null);

    if (!serviceError && serviceSuggestions) {
      serviceSuggestions.forEach(profile => {
        if (profile.service_categories) {
          profile.service_categories.forEach((category: string) => {
            if (category.toLowerCase().includes(q.toLowerCase())) {
              suggestions.add(category);
            }
          });
        }
      });
    }

    // Get location suggestions
    const { data: locationSuggestions, error: locationError } = await supabase
      .from('business_profiles')
      .select('location, service_areas')
      .or(`location.ilike.%${q}%,service_areas.cs.{${q}}`)
      .limit(limit);

    if (!locationError && locationSuggestions) {
      locationSuggestions.forEach(profile => {
        if (
          profile.location &&
          profile.location.toLowerCase().includes(q.toLowerCase())
        ) {
          suggestions.add(profile.location);
        }
        if (profile.service_areas) {
          profile.service_areas.forEach((area: string) => {
            if (area.toLowerCase().includes(q.toLowerCase())) {
              suggestions.add(area);
            }
          });
        }
      });
    }

    // Get popular search terms from search history
    const { data: popularSearches, error: historyError } = await supabase
      .from('search_history')
      .select('search_query')
      .ilike('search_query', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!historyError && popularSearches) {
      popularSearches.forEach(search => {
        if (search.search_query.toLowerCase().includes(q.toLowerCase())) {
          suggestions.add(search.search_query);
        }
      });
    }

    return NextResponse.json({
      suggestions: Array.from(suggestions).slice(0, limit),
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
