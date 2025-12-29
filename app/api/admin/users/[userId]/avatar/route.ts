import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Verify user exists in profiles table
    const { data: profileData, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile verification error:', profileError);
      return NextResponse.json(
        { error: 'User verification failed', details: profileError.message },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-photos/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
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
    } = adminSupabase.storage.from('avatars').getPublicUrl(filePath);

    // Update user profile with new avatar URL
    if (profileData) {
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // If profile update fails, clean up the uploaded file
        await adminSupabase.storage.from('avatars').remove([filePath]);

        return NextResponse.json(
          {
            error: 'Failed to update profile with new photo',
            details: updateError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      url: publicUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Get current profile
    const { data: profile, error: profileError } = await adminSupabase
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
    const { error: deleteError } = await adminSupabase.storage
      .from('avatars')
      .remove([filePath]);

    if (deleteError) {
      console.warn('Failed to delete file from storage:', deleteError);
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
