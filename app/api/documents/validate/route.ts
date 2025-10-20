import { NextRequest, NextResponse } from 'next/server';
import { UploadService } from '@/lib/documents/upload-service';

const uploadService = new UploadService();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = await uploadService.validateFile(file);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('POST /api/documents/validate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    );
  }
}
