import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createFeatureRequestSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  category_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
});

const getFeatureRequestsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  category_id: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'most_voted', 'least_voted']).optional(),
  user_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = getFeatureRequestsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      category_id: searchParams.get('category_id'),
      search: searchParams.get('search'),
      sort: searchParams.get('sort'),
      user_id: searchParams.get('user_id'),
    });

    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '20'), 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('feature_requests')
      .select(
        `
        *,
        feature_request_categories(name, color),
        feature_request_tag_assignments(
          feature_request_tags(name)
        ),
        profiles(first_name, last_name, avatar_url)
      `
      )
      .eq('is_public', true);

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }

    if (params.user_id) {
      query = query.eq('user_id', params.user_id);
    }

    if (params.search) {
      query = query.or(
        `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
      );
    }

    // Apply sorting
    switch (params.sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_voted':
        query = query.order('vote_count', { ascending: false });
        break;
      case 'least_voted':
        query = query.order('vote_count', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: featureRequests, error, count } = await query;

    if (error) {
      console.error('Error fetching feature requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feature requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      featureRequests,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/feature-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFeatureRequestSchema.parse(body);

    // Check for duplicate requests
    const { data: existingRequest } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', validatedData.title)
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A feature request with this title already exists' },
        { status: 400 }
      );
    }

    // Create the feature request
    const { data: featureRequest, error: insertError } = await supabase
      .from('feature_requests')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        category_id: validatedData.category_id,
        priority: validatedData.priority || 'medium',
        is_public: validatedData.is_public ?? true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feature request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create feature request' },
        { status: 500 }
      );
    }

    // Add tags if provided
    if (validatedData.tags && validatedData.tags.length > 0) {
      // Get or create tags
      const tagInserts = validatedData.tags.map(tagName => ({
        name: tagName.toLowerCase().replace(/\s+/g, '-'),
      }));

      const { data: tags } = await supabase
        .from('feature_request_tags')
        .upsert(tagInserts, { onConflict: 'name' })
        .select('id, name');

      if (tags) {
        // Create tag assignments
        const tagAssignments = tags.map(tag => ({
          feature_request_id: featureRequest.id,
          tag_id: tag.id,
        }));

        await supabase
          .from('feature_request_tag_assignments')
          .insert(tagAssignments);
      }
    }

    // Create initial status history
    await supabase.from('feature_request_status_history').insert({
      feature_request_id: featureRequest.id,
      status: 'submitted',
      changed_by: user.id,
      comments: 'Feature request submitted',
    });

    return NextResponse.json(featureRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/feature-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
