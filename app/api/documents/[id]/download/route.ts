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

    const download = await previewService.generateDownloadUrl(id);

    return NextResponse.json({
      download_url: download.download_url,
      expires_at: download.expires_at,
      success: true,
    });
  } catch (error) {
    console.error('GET /api/documents/[id]/download error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate download URL',
      },
      { status: 500 }
    );
  }
}
