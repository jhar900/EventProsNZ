import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
      const { supabase } = createClient(request);

      // Get current user - use getSession() first to avoid refresh token errors
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      // If no session, try getUser (but handle refresh token errors)
      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        // Handle refresh token errors gracefully
        if (authError) {
          if (
            authError.message?.includes('refresh_token_not_found') ||
            authError.message?.includes('Invalid Refresh Token') ||
            authError.message?.includes('Refresh Token Not Found')
          ) {
            return NextResponse.json(
              {
                error: 'Session expired. Please log in again.',
                code: 'SESSION_EXPIRED',
              },
              { status: 401 }
            );
          }
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        user = getUserUser;
      }

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFilename = `portfolio/${userId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Create Supabase client with service role for storage operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('portfolio-photos')
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('portfolio-photos')
      .getPublicUrl(uniqueFilename);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: uniqueFilename,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
