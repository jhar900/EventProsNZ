import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/documents/document-service';

const documentService = new DocumentService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const document_category =
      searchParams.get('document_category') || undefined;
    const is_public = searchParams.get('is_public')
      ? searchParams.get('is_public') === 'true'
      : undefined;
    const file_type = searchParams.get('file_type') || undefined;
    const start_date = searchParams.get('start_date') || undefined;
    const end_date = searchParams.get('end_date') || undefined;

    const filters = {
      document_category,
      is_public,
      file_type,
      date_range:
        start_date && end_date
          ? { start: start_date, end: end_date }
          : undefined,
    };

    const result = await documentService.getDocuments(filters, page, limit);

    return NextResponse.json({
      documents: result.documents || [],
      total: result.total || 0,
      page: result.page || page,
      limit: result.limit || limit,
    });
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch documents',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.document_name || !body.document_type || !body.file_size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const document = await documentService.createDocument(body);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create document',
      },
      { status: 500 }
    );
  }
}
