import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateLegalDocumentSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    'terms_of_service',
    'privacy_policy',
    'cookie_policy',
    'other',
  ]),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  version: z.string().min(1, 'Version is required'),
  effective_date: z.string().datetime('Invalid date format'),
  status: z.enum(['draft', 'active', 'archived']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = updateLegalDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { id, type, title, content, version, effective_date, status } =
      validationResult.data;
    const supabase = createClient();

    // Check if user is admin (this would be implemented based on your auth system)
    // For now, we'll assume the user is authenticated and has admin privileges

    let documentId = id;

    if (id) {
      // Update existing document
      const { data: existingDoc, error: fetchError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingDoc) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Create a new version entry
      const { error: versionError } = await supabase
        .from('legal_versions')
        .insert({
          document_id: id,
          version: existingDoc.version,
          changes: `Updated from v${existingDoc.version} to v${version}`,
          created_by: 'current-user-id', // This would come from auth
        });

      if (versionError) {
        // Log error for debugging (in production, use proper logging service)('Error creating version entry:', versionError);
      }

      // Update the document
      const { data: updatedDoc, error: updateError } = await supabase
        .from('legal_documents')
        .update({
          title,
          content,
          version,
          effective_date,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        // Log error for debugging (in production, use proper logging service)('Error updating document:', updateError);
        return NextResponse.json(
          { error: 'Failed to update document' },
          { status: 500 }
        );
      }

      documentId = updatedDoc.id;
    } else {
      // Create new document
      const { data: newDoc, error: createError } = await supabase
        .from('legal_documents')
        .insert({
          type,
          title,
          content,
          version,
          effective_date,
          status,
          created_by: 'current-user-id', // This would come from auth
        })
        .select()
        .single();

      if (createError) {
        // Log error for debugging (in production, use proper logging service)('Error creating document:', createError);
        return NextResponse.json(
          { error: 'Failed to create document' },
          { status: 500 }
        );
      }

      documentId = newDoc.id;
    }

    return NextResponse.json({
      success: true,
      message: id
        ? 'Document updated successfully'
        : 'Document created successfully',
      data: {
        id: documentId,
        type,
        title,
        version,
        status,
        effective_date,
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
