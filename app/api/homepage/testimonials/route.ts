import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get approved testimonials for homepage display
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select(
        `
        id,
        name,
        role,
        company,
        rating,
        content,
        avatar,
        is_verified,
        user_type,
        created_at
      `
      )
      .eq('status', 'approved')
      .eq('is_public', true)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Log error for debugging
      console.error('Error fetching testimonials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedTestimonials =
      testimonials?.map(testimonial => ({
        id: testimonial.id,
        name: testimonial.name,
        role: testimonial.role,
        company: testimonial.company,
        rating: testimonial.rating || 5,
        content: testimonial.content,
        avatar: testimonial.avatar,
        verified: testimonial.is_verified || false,
        user_type: testimonial.user_type,
      })) || [];

    return NextResponse.json({
      testimonials: transformedTestimonials,
      total: transformedTestimonials.length,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Homepage testimonials API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
