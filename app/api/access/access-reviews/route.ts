import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('access_reviews')
      .select(
        `
        *,
        users:user_id(email),
        reviewers:reviewer_id(email)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching access reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch access reviews' },
        { status: 500 }
      );
    }

    // Get user roles and permissions for each review
    const reviewsWithAccess = await Promise.all(
      (reviews || []).map(async review => {
        // Get user roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select(
            `
            roles(name, permissions)
          `
          )
          .eq('user_id', review.user_id)
          .eq('is_active', true);

        // Get user permissions
        const { data: userPermissions } = await supabase
          .from('user_permissions')
          .select(
            `
            permissions(name, resource, action)
          `
          )
          .eq('user_id', review.user_id)
          .eq('is_active', true);

        return {
          ...review,
          user_email: review.users?.email,
          reviewer_email: review.reviewers?.email,
          user_roles: userRoles?.map(ur => ur.roles).filter(Boolean) || [],
          user_permissions:
            userPermissions?.map(up => up.permissions).filter(Boolean) || [],
        };
      })
    );

    return NextResponse.json({
      reviews: reviewsWithAccess,
      count: reviewsWithAccess.length,
    });
  } catch (error) {
    console.error('Error in access reviews GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();
    const { user_id, expires_at } = body;

    // Validate required fields
    if (!user_id || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, expires_at' },
        { status: 400 }
      );
    }

    // Validate expiration date
    if (new Date(expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Expiration date must be in the future' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if there's already a pending review for this user
    const { data: existingReview } = await supabase
      .from('access_reviews')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'A pending review already exists for this user' },
        { status: 409 }
      );
    }

    // Create the access review
    const { data: review, error } = await supabase
      .from('access_reviews')
      .insert({
        reviewer_id: authResult.userId,
        user_id,
        expires_at,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating access review:', error);
      return NextResponse.json(
        { error: 'Failed to create access review' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_actions').insert({
      admin_id: authResult.userId,
      action_type: 'create_access_review',
      resource: 'access_reviews',
      resource_id: review.id,
      details: {
        user_id,
        expires_at,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      review,
      message: 'Access review created successfully',
    });
  } catch (error) {
    console.error('Error in access reviews POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
