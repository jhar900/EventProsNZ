import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required', details: 'x-user-id header missing' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File too large. Maximum size is 5MB.',
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `event-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `event-logos/${fileName}`;

    // Upload file to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('event-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload file',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('event-logos').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      message: 'Event logo uploaded successfully',
    });
  } catch (error) {
    console.error('Event logo upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
