import { NextRequest, NextResponse } from 'next/server';
import { PreviewService } from '@/lib/documents/preview-service';

const previewService = new PreviewService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const preview = await previewService.generatePreview(id);

    return NextResponse.json({
      preview_url: preview.preview_url,
      preview_type: preview.preview_type,
      success: true,
    });
  } catch (error) {
    console.error('GET /api/documents/[id]/preview error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate preview',
      },
      { status: 500 }
    );
  }
}
