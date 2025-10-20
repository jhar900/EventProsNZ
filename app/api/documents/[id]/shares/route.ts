import { NextRequest, NextResponse } from 'next/server';
import { ShareService } from '@/lib/documents/share-service';

const shareService = new ShareService();

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

    const shares = await shareService.getDocumentShares(id);

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('GET /api/documents/[id]/shares error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch shares',
      },
      { status: 500 }
    );
  }
}
