import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  validateFileUpload,
  sanitizeFilename,
} from '@/lib/security/sanitization';
import { uploadRateLimiter, applyRateLimit } from '@/lib/rate-limiting';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for file uploads
    const rateLimitResult = await applyRateLimit(request, uploadRateLimiter);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Get user ID and job ID from request headers
    const userId = request.headers.get('x-user-id');
    const jobId = request.headers.get('x-job-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID required' },
        { status: 400 }
      );
    }

    console.log('Received job application upload:', { userId, jobId });

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file upload
    const validationResult = validateFileUpload(file);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const finalFilename = `${timestamp}_${sanitizedFilename}`;

    // Create file path
    const filePath = `job-applications/${jobId}/${userId}/${finalFilename}`;

    console.log('Uploading file to path:', filePath);
    console.log('File size:', file.size, 'bytes');

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('job-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          error: uploadError.message || 'Failed to upload file',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('job-attachments')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      file: {
        filename: finalFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath,
      },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('POST /api/upload/job-application error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}
