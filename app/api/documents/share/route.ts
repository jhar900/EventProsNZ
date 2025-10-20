import { NextRequest, NextResponse } from 'next/server';
import { ShareService } from '@/lib/documents/share-service';
import { ShareData } from '@/types/documents';

const shareService = new ShareService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, shared_with, permission_level, expires_at } = body;

    if (!document_id || !shared_with || !permission_level) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: document_id, shared_with, permission_level',
        },
        { status: 400 }
      );
    }

    const shareData: ShareData = {
      shared_with,
      permission_level,
      expires_at,
    };

    const documentShare = await shareService.shareDocument(
      document_id,
      shareData
    );

    return NextResponse.json(
      {
        document_share: documentShare,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/documents/share error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Share failed' },
      { status: 500 }
    );
  }
}
