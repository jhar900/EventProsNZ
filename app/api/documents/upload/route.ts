import { NextRequest, NextResponse } from 'next/server';
import { UploadService } from '@/lib/documents/upload-service';
import { DocumentMetadata } from '@/types/documents';
import {
  applyRateLimit,
  uploadRateLimiter,
  userUploadRateLimiter,
} from '@/lib/rate-limiting';

const uploadService = new UploadService();

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const uploadLimit = await applyRateLimit(request, uploadRateLimiter);
    if (!uploadLimit.allowed) {
      return uploadLimit.response!;
    }

    const userLimit = await applyRateLimit(request, userUploadRateLimiter);
    if (!userLimit.allowed) {
      return userLimit.response!;
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const document_name = formData.get('document_name') as string;
    const document_category = formData.get('document_category') as string;
    const is_public = formData.get('is_public') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!document_name) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { status: 400 }
      );
    }

    const metadata: DocumentMetadata = {
      document_name,
      document_category: document_category || undefined,
      is_public,
    };

    const document = await uploadService.uploadFile(file, metadata);

    return NextResponse.json({
      document,
      success: true,
    });
  } catch (error) {
    console.error('POST /api/documents/upload error:', error);

    // Check if it's a validation error
    if (
      error instanceof Error &&
      (error.message.includes('Invalid file type') ||
        error.message.includes('File too large') ||
        error.message.includes('File validation failed'))
    ) {
      return NextResponse.json(
        {
          error: error.message,
          success: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
