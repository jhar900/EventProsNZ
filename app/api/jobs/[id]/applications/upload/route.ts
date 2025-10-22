import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateFileUpload,
  sanitizeFilename,
} from '@/lib/security/sanitization';
import { uploadRateLimiter, applyRateLimit } from '@/lib/rate-limiting';

// POST /api/jobs/[id]/applications/upload - Upload file for job application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting for file uploads
    const rateLimitResult = await applyRateLimit(request, uploadRateLimiter);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

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
    const fileExtension = sanitizedFilename.split('.').pop();
    const timestamp = Date.now();
    const finalFilename = `${timestamp}_${sanitizedFilename}`;

    // Create file path
    const filePath = `job-applications/${id}/${user.id}/${finalFilename}`;

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('job-attachments')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
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
    console.error('POST /api/jobs/[id]/applications/upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}
