import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Build the query
    let query = supabase
      .from('legal_documents')
      .select('*')
      .order('effective_date', { ascending: false });

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data: documents, error } = await query;

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to fetch document versions' },
        { status: 500 }
      );
    }

    // Group documents by type
    const groupedDocuments =
      documents?.reduce(
        (acc, doc) => {
          if (!acc[doc.type]) {
            acc[doc.type] = [];
          }
          acc[doc.type].push({
            id: doc.id,
            title: doc.title,
            version: doc.version,
            effective_date: doc.effective_date,
            status: doc.status,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          });
          return acc;
        },
        {} as Record<string, any[]>
      ) || {};

    return NextResponse.json({
      success: true,
      data: groupedDocuments,
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
