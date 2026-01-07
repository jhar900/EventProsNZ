import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create a client that can read cookies from the request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // Not needed for reading
          },
          remove() {
            // Not needed for reading
          },
        },
      }
    );

    // Try multiple methods to get the user
    let user: any;

    // Method 1: Try session from cookies
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      // Method 2: Try getUser (reads from cookies)
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // Method 3: Try to get user_id from header (fallback)
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        // Verify the user exists - use admin client to bypass RLS
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { data: userData, error: userError } = await supabaseAdmin
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
        }
      }
    }

    if (!user) {
      console.error('No user found in attachment route', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        cookies: request.cookies.getAll().map(c => c.name),
        userIdFromHeader: request.headers.get('x-user-id'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get feature request to check permissions and get attachment URL
    const { data: featureRequest, error } = await supabase
      .from('feature_requests')
      .select('attachment_url, user_id, is_public')
      .eq('id', params.id)
      .single();

    if (error || !featureRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Check if user can view this request
    if (!featureRequest.is_public && featureRequest.user_id !== user.id) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (!featureRequest.attachment_url) {
      return NextResponse.json(
        { error: 'No attachment found' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const url = new URL(featureRequest.attachment_url);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(
      part => part === 'feature-request-attachments'
    );
    if (bucketIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid attachment URL' },
        { status: 400 }
      );
    }
    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    // Generate signed URL (valid for 1 hour)
    // Use admin client for signed URL generation to ensure it works
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from('feature-request-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrlData.signedUrl });
  } catch (error) {
    console.error('Error in GET /api/feature-requests/[id]/attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
