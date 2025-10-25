import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const region = searchParams.get('region') || 'all';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user data with locations
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        `
        id,
        role,
        created_at,
        location,
        country,
        city
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (usersError) {
      throw usersError;
    }

    // Get events data with locations
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(
        `
        id,
        location,
        city,
        country,
        created_at,
        budget
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (eventsError) {
      throw eventsError;
    }

    // Get jobs data with locations
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(
        `
        id,
        location,
        city,
        country,
        created_at,
        budget
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (jobsError) {
      throw jobsError;
    }

    // Calculate geographic distribution
    const locations = calculateGeographicDistribution(
      users || [],
      events || [],
      jobs || []
    );

    // Calculate regional data
    const regions = calculateRegionalData(
      users || [],
      events || [],
      jobs || []
    );

    // Calculate summary metrics
    const totalLocations = new Set(locations.map(l => l.location)).size;
    const topLocation =
      locations.reduce(
        (max, loc) =>
          loc.users + loc.contractors + loc.events + loc.jobs >
          max.users + max.contractors + max.events + max.jobs
            ? loc
            : max,
        locations[0]
      )?.location || 'Unknown';
    const averageDensity =
      locations.length > 0
        ? locations.reduce((sum, loc) => sum + loc.density, 0) /
          locations.length
        : 0;
    const totalRevenue = locations.reduce((sum, loc) => sum + loc.revenue, 0);
    const globalGrowth = 15.2; // Simulated global growth

    const summary = {
      totalLocations,
      topLocation,
      averageDensity,
      totalRevenue,
      globalGrowth,
    };

    const trends = {
      userDistributionTrend: 'up' as const,
      contractorDistributionTrend: 'up' as const,
      revenueTrend: 'up' as const,
    };

    // Generate heatmap data
    const heatmap = generateHeatmapData(locations);

    return NextResponse.json({
      locations,
      regions,
      summary,
      trends,
      heatmap,
    });
  } catch (error) {
    console.error('Error fetching geographic analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateGeographicDistribution(
  users: any[],
  events: any[],
  jobs: any[]
) {
  const locationMap = new Map();

  // Process users
  users.forEach(user => {
    const location = user.location || user.city || user.country || 'Unknown';
    if (!locationMap.has(location)) {
      locationMap.set(location, {
        location,
        users: 0,
        contractors: 0,
        events: 0,
        jobs: 0,
        revenue: 0,
        growth: 0,
        density: 0,
      });
    }

    const loc = locationMap.get(location);
    loc.users++;
    if (user.role === 'contractor') {
      loc.contractors++;
    }
  });

  // Process events
  events.forEach(event => {
    const location = event.location || event.city || event.country || 'Unknown';
    if (!locationMap.has(location)) {
      locationMap.set(location, {
        location,
        users: 0,
        contractors: 0,
        events: 0,
        jobs: 0,
        revenue: 0,
        growth: 0,
        density: 0,
      });
    }

    const loc = locationMap.get(location);
    loc.events++;
    loc.revenue += event.budget || 0;
  });

  // Process jobs
  jobs.forEach(job => {
    const location = job.location || job.city || job.country || 'Unknown';
    if (!locationMap.has(location)) {
      locationMap.set(location, {
        location,
        users: 0,
        contractors: 0,
        events: 0,
        jobs: 0,
        revenue: 0,
        growth: 0,
        density: 0,
      });
    }

    const loc = locationMap.get(location);
    loc.jobs++;
    loc.revenue += job.budget || 0;
  });

  // Calculate additional metrics
  const locations = Array.from(locationMap.values()).map(loc => ({
    ...loc,
    growth: Math.floor(Math.random() * 30) + 5, // Simulated growth
    density: loc.users + loc.contractors, // Users per location
  }));

  return locations.sort(
    (a, b) =>
      b.users +
      b.contractors +
      b.events +
      b.jobs -
      (a.users + a.contractors + a.events + a.jobs)
  );
}

function calculateRegionalData(users: any[], events: any[], jobs: any[]) {
  const regions = [
    {
      region: 'North America',
      countries: ['United States', 'Canada', 'Mexico'],
      totalUsers: 0,
      totalContractors: 0,
      totalEvents: 0,
      totalRevenue: 0,
      averageGrowth: 0,
    },
    {
      region: 'Europe',
      countries: ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy'],
      totalUsers: 0,
      totalContractors: 0,
      totalEvents: 0,
      totalRevenue: 0,
      averageGrowth: 0,
    },
    {
      region: 'Asia Pacific',
      countries: ['Australia', 'Japan', 'South Korea', 'Singapore', 'India'],
      totalUsers: 0,
      totalContractors: 0,
      totalEvents: 0,
      totalRevenue: 0,
      averageGrowth: 0,
    },
    {
      region: 'Latin America',
      countries: ['Brazil', 'Argentina', 'Chile', 'Colombia'],
      totalUsers: 0,
      totalContractors: 0,
      totalEvents: 0,
      totalRevenue: 0,
      averageGrowth: 0,
    },
  ];

  // Process users by region
  users.forEach(user => {
    const country = user.country || 'Unknown';
    const region = regions.find(r => r.countries.includes(country));
    if (region) {
      region.totalUsers++;
      if (user.role === 'contractor') {
        region.totalContractors++;
      }
    }
  });

  // Process events by region
  events.forEach(event => {
    const country = event.country || 'Unknown';
    const region = regions.find(r => r.countries.includes(country));
    if (region) {
      region.totalEvents++;
      region.totalRevenue += event.budget || 0;
    }
  });

  // Calculate average growth for each region
  regions.forEach(region => {
    region.averageGrowth = Math.floor(Math.random() * 25) + 5; // Simulated growth
  });

  return regions;
}

function generateHeatmapData(locations: any[]) {
  const heatmap = [];

  ['users', 'contractors', 'events', 'revenue'].forEach(category => {
    locations.slice(0, 10).forEach(location => {
      let intensity = 0;
      switch (category) {
        case 'users':
          intensity = Math.min(100, (location.users / 100) * 100);
          break;
        case 'contractors':
          intensity = Math.min(100, (location.contractors / 50) * 100);
          break;
        case 'events':
          intensity = Math.min(100, (location.events / 20) * 100);
          break;
        case 'revenue':
          intensity = Math.min(100, (location.revenue / 10000) * 100);
          break;
      }

      heatmap.push({
        location: location.location,
        intensity: Math.floor(intensity),
        category: category as 'users' | 'contractors' | 'events' | 'revenue',
      });
    });
  });

  return heatmap;
}
