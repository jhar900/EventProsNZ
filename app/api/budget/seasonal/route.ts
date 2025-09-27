import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const SeasonalQuerySchema = z.object({
  service_type: z.string().min(1),
  event_date: z.string().datetime(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');
    const eventDate = searchParams.get('event_date');
    const locationParam = searchParams.get('location');

    if (!serviceType || !eventDate) {
      return NextResponse.json(
        {
          error: 'Service type and event date are required',
        },
        { status: 400 }
      );
    }

    // Parse location if provided
    let location = null;
    if (locationParam) {
      try {
        location = JSON.parse(locationParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }

    // Validate input
    const validation = SeasonalQuerySchema.safeParse({
      service_type: serviceType,
      event_date: eventDate,
      location,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { service_type, event_date, location: loc } = validation.data;

    // Get base pricing data
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_data')
      .select('*')
      .eq('service_type', service_type)
      .order('created_at', { ascending: false })
      .limit(1);

    if (pricingError) {
      return NextResponse.json(
        { error: 'Failed to fetch pricing data' },
        { status: 500 }
      );
    }

    if (!pricingData || pricingData.length === 0) {
      return NextResponse.json(
        {
          error: 'No pricing data found for service type',
        },
        { status: 404 }
      );
    }

    const basePricing = pricingData[0];

    // Calculate seasonal adjustments
    const eventDateObj = new Date(event_date);
    const month = eventDateObj.getMonth();
    const day = eventDateObj.getDate();

    // Define seasonal patterns
    const seasonalPatterns = {
      // Peak seasons (higher prices)
      peak: {
        months: [5, 6, 7, 11, 12], // Summer and holiday months
        multiplier: basePricing.seasonal_multiplier || 1.2,
      },
      // Off-peak seasons (lower prices)
      off_peak: {
        months: [0, 1, 2, 8, 9], // Winter and early fall
        multiplier: 1 / (basePricing.seasonal_multiplier || 1.2),
      },
      // Shoulder seasons (normal prices)
      shoulder: {
        months: [3, 4, 10], // Spring and late fall
        multiplier: 1.0,
      },
    };

    // Determine season type
    let seasonType = 'shoulder';
    let seasonalMultiplier = 1.0;

    if (seasonalPatterns.peak.months.includes(month)) {
      seasonType = 'peak';
      seasonalMultiplier = seasonalPatterns.peak.multiplier;
    } else if (seasonalPatterns.off_peak.months.includes(month)) {
      seasonType = 'off_peak';
      seasonalMultiplier = seasonalPatterns.off_peak.multiplier;
    }

    // Check for special dates (holidays, events)
    const specialDates = getSpecialDateMultipliers(eventDateObj);
    const specialMultiplier = specialDates.multiplier;
    const specialReason = specialDates.reason;

    // Calculate final seasonal multiplier
    const finalSeasonalMultiplier = seasonalMultiplier * specialMultiplier;

    // Apply seasonal adjustments to pricing
    const adjustedPricing = {
      service_type: service_type,
      base_pricing: basePricing,
      seasonal_adjustment: {
        season_type: seasonType,
        seasonal_multiplier: Math.round(seasonalMultiplier * 100) / 100,
        special_date_multiplier: Math.round(specialMultiplier * 100) / 100,
        special_date_reason: specialReason,
        final_multiplier: Math.round(finalSeasonalMultiplier * 100) / 100,
      },
      adjusted_prices: {
        price_min:
          Math.round(basePricing.price_min * finalSeasonalMultiplier * 100) /
          100,
        price_max:
          Math.round(basePricing.price_max * finalSeasonalMultiplier * 100) /
          100,
        price_average:
          Math.round(
            basePricing.price_average * finalSeasonalMultiplier * 100
          ) / 100,
      },
      savings_opportunity: {
        is_peak_season: seasonType === 'peak',
        is_off_peak_season: seasonType === 'off_peak',
        potential_savings:
          seasonType === 'off_peak'
            ? Math.round(
                basePricing.price_average * (1 - seasonalMultiplier) * 100
              ) / 100
            : 0,
        recommendation:
          seasonType === 'peak'
            ? 'Consider booking during off-peak season for better rates'
            : seasonType === 'off_peak'
              ? "Great time to book - you're in the off-peak season"
              : 'Standard seasonal pricing applies',
      },
    };

    return NextResponse.json({
      pricing: adjustedPricing,
      metadata: {
        service_type: service_type,
        event_date: event_date,
        location: loc,
        month: month,
        season_type: seasonType,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSpecialDateMultipliers(eventDate: Date): {
  multiplier: number;
  reason: string;
} {
  const month = eventDate.getMonth();
  const day = eventDate.getDate();

  // Major holidays and events
  const specialDates = [
    // New Year's Eve/Day
    { month: 11, day: 31, multiplier: 1.5, reason: "New Year's Eve" },
    { month: 0, day: 1, multiplier: 1.3, reason: "New Year's Day" },

    // Valentine's Day
    { month: 1, day: 14, multiplier: 1.4, reason: "Valentine's Day" },

    // Easter (approximate - varies by year)
    { month: 3, day: 15, multiplier: 1.2, reason: 'Easter period' },

    // Mother's Day (second Sunday in May)
    { month: 4, day: 8, multiplier: 1.3, reason: "Mother's Day weekend" },

    // Father's Day (third Sunday in June)
    { month: 5, day: 15, multiplier: 1.2, reason: "Father's Day weekend" },

    // Independence Day (US)
    { month: 6, day: 4, multiplier: 1.4, reason: 'Independence Day' },

    // Halloween
    { month: 9, day: 31, multiplier: 1.3, reason: 'Halloween' },

    // Thanksgiving (fourth Thursday in November)
    { month: 10, day: 22, multiplier: 1.3, reason: 'Thanksgiving period' },

    // Christmas Eve/Day
    { month: 11, day: 24, multiplier: 1.6, reason: 'Christmas Eve' },
    { month: 11, day: 25, multiplier: 1.4, reason: 'Christmas Day' },

    // New Year's Eve
    { month: 11, day: 31, multiplier: 1.5, reason: "New Year's Eve" },
  ];

  // Check for exact matches
  for (const specialDate of specialDates) {
    if (specialDate.month === month && Math.abs(specialDate.day - day) <= 2) {
      return { multiplier: specialDate.multiplier, reason: specialDate.reason };
    }
  }

  // Check for weekend multipliers
  const dayOfWeek = eventDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    return { multiplier: 1.1, reason: 'Weekend premium' };
  }

  return { multiplier: 1.0, reason: 'Standard pricing' };
}
