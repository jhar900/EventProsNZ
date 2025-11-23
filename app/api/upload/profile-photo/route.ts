import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');

    // Log all headers for debugging
    console.log(
      'All request headers:',
      Object.fromEntries(request.headers.entries())
    );
    console.log('x-user-id header value:', userId);

    if (!userId) {
      console.error('Missing x-user-id header');
      return NextResponse.json(
        { error: 'User ID required', details: 'x-user-id header missing' },
        { status: 401 }
      );
    }

    console.log('Received user ID for profile photo upload:', userId);

    // Use supabaseAdmin which bypasses RLS and has full access
    // Verify user exists in profiles table (optional check - profile might not exist yet during onboarding)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is OK during onboarding
      console.error('Profile verification error:', profileError);
      return NextResponse.json(
        { error: 'User verification failed', details: profileError.message },
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
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;

    // Upload file to Supabase Storage using admin client (bypasses RLS)
    console.log('Uploading file to path:', filePath);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
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

    console.log('Upload successful:', uploadData);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);

    // Update user profile with new avatar URL (if profile exists)
    // If profile doesn't exist yet, it will be created in step 1 of onboarding
    if (profileData) {
      console.log('Updating profile with avatar URL:', publicUrl);
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // If profile update fails, clean up the uploaded file
        await supabaseAdmin.storage.from('avatars').remove([filePath]);

        return NextResponse.json(
          {
            error: 'Failed to update profile with new photo',
            details: updateError.message,
          },
          { status: 500 }
        );
      }
    } else {
      console.log(
        'Profile does not exist yet - photo will be saved when profile is created'
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      message: 'Profile photo uploaded successfully',
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required', details: 'x-user-id header missing' },
        { status: 401 }
      );
    }

    // Use supabaseAdmin which bypasses RLS and has full access
    // Get current profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile?.avatar_url) {
      return NextResponse.json(
        { error: 'No profile photo found' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const urlParts = profile.avatar_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `profile-photos/${fileName}`;

    // Delete file from storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('avatars')
      .remove([filePath]);

    if (deleteError) {
      return NextResponse.json(
        {
          error: 'Failed to delete file from storage',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Failed to update profile',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile photo deleted successfully',
    });
  } catch (error) {
    console.error('Profile photo delete error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
