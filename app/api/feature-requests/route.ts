import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { checkSuspensionAndBlock } from '@/lib/middleware/suspension-middleware';
import { z } from 'zod';

// Helper function to escape HTML entities
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validation schemas
const createFeatureRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  category_id: z.union([z.string().uuid(), z.literal('')]).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  user_id: z.string().uuid().optional(), // Allow user_id in body for fallback auth
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
    const { supabase } = createClient(request);

    // Try to get user from session (optional - public requests can be viewed by anyone)
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('GET /api/feature-requests - Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
    });

    if (session?.user) {
      user = session.user;
    } else {
      // Try getUser as fallback
      const {
        data: { user: getUserUser },
        error: getUserError,
      } = await supabase.auth.getUser();

      console.log('GET /api/feature-requests - getUser check:', {
        hasUser: !!getUserUser,
        userId: getUserUser?.id,
        getUserError: getUserError?.message,
      });

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // Fallback: Try to get user_id from header (if cookies aren't working)
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        // Verify the user exists - use admin client to bypass RLS
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (!userError && userData) {
          // Create a minimal user object
          user = {
            id: userData.id,
            email: userData.email || '',
          } as any;
          console.log(
            'GET /api/feature-requests - User authenticated from header:',
            user.id
          );
        }
      }
    }

    // Note: Authentication is optional for GET - public requests can be viewed by anyone

    const { searchParams } = new URL(request.url);
    // Convert null to undefined for optional params (searchParams.get returns null, not undefined)
    const params = getFeatureRequestsSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      user_id: searchParams.get('user_id') || undefined,
    });

    const page = parseInt(params.page || '1');
    const limit = Math.min(parseInt(params.limit || '20'), 100);
    const offset = (page - 1) * limit;

    // Check if user is admin - use admin client to bypass RLS
    let isAdmin = false;
    if (user) {
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      isAdmin = userData?.role === 'admin';
      console.log('User role check:', {
        userId: user.id,
        role: userData?.role,
        isAdmin,
        error: userError?.message,
      });
    }

    // If admin, fetch ALL requests (public and private)
    // Otherwise, show public requests and user's own requests
    let allRequestsQuery: any = null;
    let publicQuery: any = null;
    let userOwnQuery: any = null;

    if (isAdmin) {
      // Admin can see all requests - use admin client to bypass RLS
      // IMPORTANT: Do NOT filter by is_public - admins should see everything
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      allRequestsQuery = supabaseAdmin.from('feature_requests').select(
        `
          *,
          feature_request_categories(name, color),
          feature_request_tag_assignments(
            feature_request_tags(name)
          )
        `
      );
      console.log(
        'Admin user detected - fetching ALL requests (public and private)',
        {
          userId: user?.id,
          isAdmin,
        }
      );
    } else {
      // Non-admin: show public requests, or user's own requests if authenticated
      // We'll fetch both separately and combine to avoid RLS conflicts with OR queries
      publicQuery = supabase
        .from('feature_requests')
        .select(
          `
          *,
          feature_request_categories(name, color),
          feature_request_tag_assignments(
            feature_request_tags(name)
          )
        `
        )
        .eq('is_public', true);

      if (user) {
        console.log(
          'User authenticated, will fetch public requests AND user own requests. User ID:',
          user.id
        );

        // Check if user was authenticated via header (fallback method)
        // If so, we need to use server client to bypass RLS since auth context isn't set
        const userIdFromHeader =
          request.headers.get('x-user-id') ||
          request.headers.get('X-User-Id') ||
          request.headers.get('X-USER-ID');

        if (userIdFromHeader === user.id) {
          // User authenticated via header, use server client to bypass RLS
          const { createClient: createServerClient } = await import(
            '@/lib/supabase/server'
          );
          const serverSupabase = createServerClient();
          userOwnQuery = serverSupabase
            .from('feature_requests')
            .select(
              `
              *,
              feature_request_categories(name, color),
              feature_request_tag_assignments(
                feature_request_tags(name)
              )
            `
            )
            .eq('user_id', user.id);
          console.log(
            'Using server client for user own requests (header auth - bypasses RLS)'
          );
        } else {
          // User authenticated via cookies - use server client to ensure we get ALL user's requests (including private)
          // This bypasses RLS to ensure users can see their own private requests
          const { createClient: createServerClient } = await import(
            '@/lib/supabase/server'
          );
          const serverSupabase = createServerClient();
          userOwnQuery = serverSupabase
            .from('feature_requests')
            .select(
              `
              *,
              feature_request_categories(name, color),
              feature_request_tag_assignments(
                feature_request_tags(name)
              )
            `
            )
            .eq('user_id', user.id);
          console.log(
            'Using server client for user own requests (cookie auth - bypasses RLS to include private requests)'
          );
        }
      } else {
        console.log('No user authenticated, showing only public requests');
      }
    }

    // Apply filters to queries
    const applyFilters = (q: any, excludeRejectedForNonAdmin = false) => {
      // Exclude rejected requests for non-admin users (always, regardless of status filter)
      if (excludeRejectedForNonAdmin) {
        q = q.neq('status', 'rejected');
      }
      if (params.status) {
        q = q.eq('status', params.status);
      }
      if (params.category_id) {
        q = q.eq('category_id', params.category_id);
      }
      if (params.user_id) {
        q = q.eq('user_id', params.user_id);
      }
      if (params.search) {
        q = q.or(
          `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
        );
      }
      return q;
    };

    // Apply sorting helper
    const applySorting = (q: any) => {
      switch (params.sort) {
        case 'oldest':
          return q.order('created_at', { ascending: true });
        case 'most_voted':
          return q.order('vote_count', { ascending: false });
        case 'least_voted':
          return q.order('vote_count', { ascending: true });
        default:
          return q.order('created_at', { ascending: false });
      }
    };

    // Fetch requests based on user role
    let featureRequests: any[] = [];
    let publicRequests: any[] = [];
    let userOwnRequests: any[] = [];
    let error: any = null;

    if (allRequestsQuery) {
      // Admin: fetch all requests (public and private) - admins can see rejected
      allRequestsQuery = applyFilters(allRequestsQuery, false);
      allRequestsQuery = applySorting(allRequestsQuery);
      const { data: allRequests, error: allError } = await allRequestsQuery;

      console.log('All requests fetched (admin):', {
        count: allRequests?.length || 0,
        error: allError?.message,
        publicCount: allRequests?.filter((fr: any) => fr.is_public).length || 0,
        privateCount:
          allRequests?.filter((fr: any) => !fr.is_public).length || 0,
        sampleIds: allRequests?.slice(0, 5).map((fr: any) => ({
          id: fr.id,
          title: fr.title?.substring(0, 30),
          is_public: fr.is_public,
        })),
      });

      if (!allError && allRequests) {
        featureRequests = allRequests;
      } else {
        error = allError;
        console.error('Error fetching all requests for admin:', allError);
      }
    } else {
      // Non-admin: fetch public requests (exclude rejected unless explicitly filtering by rejected)
      publicQuery = applyFilters(publicQuery, true);
      publicQuery = applySorting(publicQuery);
      const { data: publicReqs, error: publicError } = await publicQuery;

      console.log('Public requests fetched:', {
        count: publicReqs?.length || 0,
        error: publicError?.message,
      });

      if (publicReqs) {
        publicRequests = publicReqs;
      }
      error = publicError;

      // Fetch user's own requests if authenticated (exclude rejected unless explicitly filtering by rejected)
      if (userOwnQuery) {
        userOwnQuery = applyFilters(userOwnQuery, true);
        userOwnQuery = applySorting(userOwnQuery);
        const { data: ownRequests, error: ownError } = await userOwnQuery;

        console.log('User own requests fetched:', {
          count: ownRequests?.length || 0,
          error: ownError?.message,
          privateCount:
            ownRequests?.filter((fr: any) => !fr.is_public).length || 0,
        });

        if (!ownError && ownRequests) {
          userOwnRequests = ownRequests;
        }
      }

      // Combine and deduplicate (user's own requests might also be public)
      const allRequestsMap = new Map();
      if (publicRequests) {
        publicRequests.forEach((fr: any) => {
          allRequestsMap.set(fr.id, fr);
        });
      }
      if (userOwnRequests) {
        userOwnRequests.forEach((fr: any) => {
          allRequestsMap.set(fr.id, fr);
        });
      }

      // Convert back to array
      featureRequests = Array.from(allRequestsMap.values());
    }

    // Re-apply sorting to combined results
    switch (params.sort) {
      case 'oldest':
        featureRequests.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'most_voted':
        featureRequests.sort(
          (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
        );
        break;
      case 'least_voted':
        featureRequests.sort(
          (a, b) => (a.vote_count || 0) - (b.vote_count || 0)
        );
        break;
      default:
        featureRequests.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    // Apply pagination to combined results
    const total = featureRequests.length;
    featureRequests = featureRequests.slice(offset, offset + limit);

    const count = total;

    if (error) {
      console.error('Error fetching feature requests:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch feature requests', details: error.message },
        { status: 500 }
      );
    }

    console.log('Feature requests fetched (combined):', {
      count: featureRequests?.length || 0,
      total: count,
      user: user?.id || 'anonymous',
      isAdmin,
      publicCount:
        featureRequests?.filter((fr: any) => fr.is_public).length || 0,
      privateCount:
        featureRequests?.filter((fr: any) => !fr.is_public).length || 0,
      publicRequestsCount: publicRequests?.length || 0,
      userOwnRequestsCount: userOwnRequests?.length || 0,
    });

    // Fetch profiles and user roles separately if needed
    const userIds =
      featureRequests?.map((fr: any) => fr.user_id).filter(Boolean) || [];
    let profilesMap: Record<string, any> = {};
    let usersMap: Record<string, any> = {};

    if (userIds.length > 0) {
      // Fetch profiles (available to all users)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        profilesMap = profiles.reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }

      // Fetch user roles (use admin client to bypass RLS)
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .in('id', userIds);

      if (users) {
        usersMap = users.reduce((acc: any, u: any) => {
          acc[u.id] = { role: u.role };
          return acc;
        }, {});
      }
    }

    // Fetch comment counts for all feature requests
    const featureRequestIds = featureRequests?.map((fr: any) => fr.id) || [];
    let commentCountsMap: Record<string, number> = {};

    if (featureRequestIds.length > 0) {
      const { data: commentCounts } = await supabase
        .from('feature_request_comments')
        .select('feature_request_id')
        .in('feature_request_id', featureRequestIds);

      if (commentCounts) {
        commentCountsMap = commentCounts.reduce((acc: any, comment: any) => {
          acc[comment.feature_request_id] =
            (acc[comment.feature_request_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    // Attach profiles, user roles, and comment counts to feature requests
    const featureRequestsWithProfiles =
      featureRequests?.map((fr: any) => ({
        ...fr,
        profiles: profilesMap[fr.user_id] || null,
        users: usersMap[fr.user_id] || null,
        comments_count: commentCountsMap[fr.id] || 0,
      })) || [];

    return NextResponse.json({
      featureRequests: featureRequestsWithProfiles,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/feature-requests:', error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Try to get user from session first (better cookie handling)
    let user: any;

    // Try multiple methods to get the user

    // Method 1: Try Authorization header token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Create a temporary client with the token
      const { createClient: createSupabaseClient } = await import(
        '@supabase/supabase-js'
      );
      const tokenClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      const {
        data: { user: tokenUser },
        error: tokenError,
      } = await tokenClient.auth.getUser();

      if (tokenUser && !tokenError) {
        user = tokenUser;
      }
    }

    // Method 2: Try session from cookies (if no token user)
    if (!user) {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log('Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        sessionError: sessionError?.message,
      });

      if (session?.user) {
        user = session.user;
        console.log('User authenticated from session:', user.id);
      }
    }

    // Method 3: Fallback to getUser (reads from cookies)
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log('getUser check:', {
        hasUser: !!getUserUser,
        userId: getUserUser?.id,
        authError: authError?.message,
      });

      if (getUserUser) {
        user = getUserUser;
        console.log('User authenticated from getUser:', user.id);
      }
    }

    // Method 4: Try to get user_id from header or body (fallback)
    let useServerClient = false; // Flag to use server client for inserts (bypasses RLS)
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        // Verify the user exists - use admin client to bypass RLS
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (!userError && userData) {
          // Create a minimal user object
          user = {
            id: userData.id,
            email: userData.email || '',
          } as any;
          useServerClient = true; // Use server client since auth context isn't set for RLS
          console.log(
            'User authenticated from header, will use server client for insert:',
            user.id
          );
        }
      }
    }

    if (!user) {
      console.error(
        'No user found - Auth header:',
        !!authHeader,
        'Cookies:',
        request.cookies.getAll().map(c => c.name),
        'Session error:',
        'getSession and getUser both failed'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check suspension status
    const serverSupabase = createServerClient();
    const suspensionResponse = await checkSuspensionAndBlock(
      request,
      user.id,
      serverSupabase
    );
    if (suspensionResponse) {
      return suspensionResponse;
    }

    // Check if request is FormData (file upload) or JSON
    // Note: When FormData is sent, the browser sets Content-Type with boundary
    // We need to check if the request has a file by trying to parse as FormData first
    let body: any;
    let attachmentUrl: string | null = null;
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    if (isFormData) {
      const formData = await request.formData();
      body = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        category_id: (formData.get('category_id') as string) || undefined,
        is_public: formData.get('is_public') === 'true',
      };

      // Handle file upload
      const attachment = formData.get('attachment') as File | null;
      if (attachment) {
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        if (!allowedTypes.includes(attachment.type)) {
          return NextResponse.json(
            {
              error:
                'Invalid file type. Allowed: PDF, JPG, PNG, GIF, DOC, DOCX, TXT',
            },
            { status: 400 }
          );
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (attachment.size > maxSize) {
          return NextResponse.json(
            {
              error: 'File too large. Maximum size is 10MB.',
            },
            { status: 400 }
          );
        }

        // Upload to Supabase Storage
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const fileExt = attachment.name.split('.').pop();
        const timestamp = Date.now();
        const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${sanitizedName}`;
        const filePath = `feature-requests/${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('feature-request-attachments')
            .upload(filePath, attachment, {
              contentType: attachment.type,
              upsert: false,
            });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          return NextResponse.json(
            {
              error: 'Failed to upload attachment',
              details: uploadError.message,
            },
            { status: 500 }
          );
        }

        // Get public URL (for private buckets, we'll use the path for signed URLs)
        // Store the full path so we can generate signed URLs later
        const { data: urlData } = supabaseAdmin.storage
          .from('feature-request-attachments')
          .getPublicUrl(filePath);

        // For private buckets, store the path, not the public URL
        // The path format: feature-request-attachments/feature-requests/{user_id}/{filename}
        attachmentUrl = urlData.publicUrl;

        console.log('File uploaded successfully:', {
          filePath,
          attachmentUrl,
          fileName: attachment.name,
          fileSize: attachment.size,
        });
      }
    } else {
      body = await request.json();
    }

    console.log('Request body received:', {
      ...body,
      description: body.description?.substring(0, 100),
      hasAttachment: !!attachmentUrl,
      attachmentUrl: attachmentUrl,
      contentType: request.headers.get('content-type'),
      isFormData: isFormData,
    });

    const validatedData = createFeatureRequestSchema.parse(body);
    console.log('Validated data:', {
      ...validatedData,
      description: validatedData.description?.substring(0, 100),
    });

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
    // Use server client if we authenticated via header (RLS won't work with header auth)
    const insertClient = useServerClient
      ? (await import('@/lib/supabase/server')).createClient()
      : supabase;

    const { data: featureRequest, error: insertError } = await insertClient
      .from('feature_requests')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        category_id:
          validatedData.category_id && validatedData.category_id !== ''
            ? validatedData.category_id
            : null,
        priority: validatedData.priority || 'medium',
        is_public: validatedData.is_public ?? true,
        attachment_url: attachmentUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feature request:', insertError);
      console.error(
        'Insert error details:',
        JSON.stringify(insertError, null, 2)
      );
      console.error('Attempted insert data:', {
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description?.substring(0, 100),
        category_id: validatedData.category_id,
        priority: validatedData.priority || 'medium',
        is_public: validatedData.is_public ?? true,
        attachment_url: attachmentUrl,
      });
      return NextResponse.json(
        {
          error: 'Failed to create feature request',
          details: insertError.message,
          code: insertError.code,
        },
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

    // Send email notification to admin
    try {
      // Fetch user profile and business profile for email
      const { createClient: createServerClient } = await import(
        '@/lib/supabase/server'
      );
      const serverSupabase = createServerClient();

      // Fetch user profile
      const { data: profile } = await serverSupabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      // Fetch business profile if exists
      const { data: businessProfile } = await serverSupabase
        .from('business_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .single();

      // Format date in NZ timezone
      const nzDate = new Date(featureRequest.created_at).toLocaleString(
        'en-NZ',
        {
          timeZone: 'Pacific/Auckland',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      );

      // Prepare email content
      const requesterName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
          user.email
        : user.email;
      const businessName = businessProfile?.company_name || 'N/A';

      // Escape user-provided content for HTML
      const escapedRequesterName = escapeHtml(requesterName);
      const escapedBusinessName = escapeHtml(businessName);
      const escapedTitle = escapeHtml(featureRequest.title);
      const escapedDescription = escapeHtml(featureRequest.description);

      const emailSubject = `New Feature Request: ${featureRequest.title}`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f18d30 0%, #f4a855 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #f18d30; }
            .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
            .description { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Feature Request Submitted</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Requested By:</div>
                <div class="value">${escapedRequesterName}</div>
              </div>
              <div class="field">
                <div class="label">Business Name:</div>
                <div class="value">${escapedBusinessName}</div>
              </div>
              <div class="field">
                <div class="label">Submitted At (NZ Time):</div>
                <div class="value">${escapeHtml(nzDate)}</div>
              </div>
              <div class="field">
                <div class="label">Title:</div>
                <div class="value">${escapedTitle}</div>
              </div>
              <div class="field">
                <div class="label">Request Details:</div>
                <div class="value description">${escapedDescription}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `
New Feature Request Submitted

Requested By: ${requesterName}
Business Name: ${businessName}
Submitted At (NZ Time): ${nzDate}

Title: ${featureRequest.title}

Request Details:
${featureRequest.description}
      `.trim();

      // Send email notification (supports multiple free providers)
      try {
        const { SimpleEmailService } = await import(
          '@/lib/email/simple-email-service'
        );

        const result = await SimpleEmailService.sendEmail({
          to: 'jason@eventpros.co.nz',
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
          // Use no-reply@eventpros.co.nz for feature request notifications
          from: 'no-reply@eventpros.co.nz',
          fromName: 'EventProsNZ',
        });

        if (result.success) {
          console.log('Feature request notification email sent successfully', {
            messageId: result.messageId,
          });
        } else {
          console.error(
            'Failed to send feature request notification email:',
            result.error
          );
        }
      } catch (emailError: any) {
        // Log error but don't fail the request
        console.error(
          'Failed to send feature request notification email:',
          emailError?.message || emailError
        );
      }
    } catch (emailError) {
      // Log error but don't fail the request
      console.error(
        'Failed to prepare feature request notification email:',
        emailError
      );
    }

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
