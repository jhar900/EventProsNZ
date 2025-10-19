import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';
import { crmDataCache } from '@/lib/cache/crm-cache';
import { queryOptimizer } from '@/lib/database/query-optimization';
import { CRMPagination } from '@/lib/database/pagination';

// Validation schemas
const updateNoteSchema = z.object({
  note_content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content too long')
    .optional(),
  note_type: z
    .enum(['general', 'meeting', 'call', 'email', 'follow_up', 'important'])
    .optional(),
  tags: z.array(z.string()).optional(),
  is_important: z.boolean().optional(),
});

// PUT /api/crm/notes/[id] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withSecurity(
    request,
    async () => {
      try {
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

        const noteId = params.id;

        // Parse and validate request body
        const body = await request.json();

        // Sanitize input data
        const sanitizedBody = textSanitizer.sanitizeObject(body);
        const validationResult = updateNoteSchema.safeParse(sanitizedBody);

        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: 'Validation failed',
              errors:
                validationResult.error.errors?.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                })) || [],
            },
            { status: 400 }
          );
        }

        const updateData = validationResult.data;

        // Check if note exists and belongs to user
        const { data: existingNote, error: fetchError } = await supabase
          .from('contact_notes')
          .select('id, user_id')
          .eq('id', noteId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !existingNote) {
          return NextResponse.json(
            { success: false, message: 'Note not found' },
            { status: 404 }
          );
        }

        // Update note
        const { data: note, error } = await supabase
          .from('contact_notes')
          .update(updateData)
          .eq('id', noteId)
          .eq('user_id', user.id)
          .select(
            `
        *,
        contact:contacts!contact_notes_contact_id_fkey(
          id,
          contact_type,
          relationship_status,
          contact_user:users!contacts_contact_user_id_fkey(
            id,
            email,
            role
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        )
      `
          )
          .single();

        if (error) {
          throw new Error(`Failed to update note: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          note,
        });
      } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update note' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// DELETE /api/crm/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withSecurity(
    request,
    async () => {
      try {
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

        const noteId = params.id;

        // Check if note exists and belongs to user
        const { data: existingNote, error: fetchError } = await supabase
          .from('contact_notes')
          .select('id, user_id')
          .eq('id', noteId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !existingNote) {
          return NextResponse.json(
            { success: false, message: 'Note not found' },
            { status: 404 }
          );
        }

        // Delete note
        const { error } = await supabase
          .from('contact_notes')
          .delete()
          .eq('id', noteId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(`Failed to delete note: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          message: 'Note deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to delete note' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
