import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    console.log('Received user ID:', userId);

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

    // Try to get user from profiles table instead (more likely to exist)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !profileData) {
      console.error('Profile verification error:', profileError);
      // If profile doesn't exist, try to create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: 'User',
          last_name: 'Name',
          timezone: 'Pacific/Auckland',
        })
        .select()
        .single();

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError);
        return NextResponse.json(
          { error: 'User not found and could not create profile' },
          { status: 401 }
        );
      }
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
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    console.log('Uploading file to path:', filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // Update profile with new avatar URL
    console.log('Updating profile with avatar URL:', publicUrl);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('Profile updated successfully');

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      url: publicUrl, // Also include 'url' for compatibility
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

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

    // Try to get user from profiles table instead (more likely to exist)
    const { data: profileData, error: deleteProfileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (deleteProfileError || !profileData) {
      console.error('Profile verification error:', deleteProfileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 401 }
      );
    }

    // Get current avatar URL
    const { data: profile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();

    if (currentProfileError || !profile?.avatar_url) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const url = new URL(profile.avatar_url);
    const filePath = url.pathname.split('/').slice(-2).join('/');

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (deleteError) {
      // Continue with profile update even if file deletion fails
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
