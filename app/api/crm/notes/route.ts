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
const createNoteSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  note_content: z
    .string()
    .min(1, 'Note content is required')
    .max(2000, 'Note content too long'),
  note_type: z
    .enum(['general', 'meeting', 'call', 'email', 'follow_up', 'important'])
    .optional(),
  tags: z.array(z.string()).optional(),
  is_important: z.boolean().optional(),
});

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

const getNotesSchema = z.object({
  contact_id: z.string().uuid().optional(),
  note_type: z
    .enum(['general', 'meeting', 'call', 'email', 'follow_up', 'important'])
    .optional(),
  tags: z.string().optional(),
  is_important: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/crm/notes - Get notes
export async function GET(request: NextRequest) {
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

        // Parse and validate query parameters
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const validationResult = getNotesSchema.safeParse(queryParams);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid query parameters',
              errors:
                validationResult.error.errors?.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                })) || [],
            },
            { status: 400 }
          );
        }

        const { contact_id, note_type, tags, is_important, page, limit } =
          validationResult.data;
        const offset = (page - 1) * limit;

        // Build query step by step to avoid method chaining issues
        let query = supabase
          .from('contact_notes')
          .select('*')
          .eq('user_id', user.id);

        if (contact_id) {
          query = query.eq('contact_id', contact_id);
        }

        if (note_type) {
          query = query.eq('note_type', note_type);
        }

        if (is_important !== undefined) {
          query = query.eq('is_important', is_important);
        }

        if (tags) {
          query = query.contains('tags', [tags]);
        }

        // Get total count separately
        const { count } = await supabase
          .from('contact_notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Apply ordering and pagination
        query = query.order('created_at', { ascending: false });
        query = query.range(offset, offset + limit - 1);

        // Execute the final query
        const { data: notes, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch notes: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          notes: notes || [],
          total: count || 0,
          page,
          limit,
        });
      } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch notes' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// POST /api/crm/notes - Create a new note
export async function POST(request: NextRequest) {
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

        // Parse and validate request body
        const body = await request.json();

        // Sanitize input data
        const sanitizedBody = textSanitizer.sanitizeObject(body);
        const validationResult = createNoteSchema.safeParse(sanitizedBody);

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

        const { contact_id, note_content, note_type, tags, is_important } =
          validationResult.data;

        // Verify the contact exists and belongs to user
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, user_id')
          .eq('id', contact_id)
          .single();

        // Check if contact belongs to user
        if (contact && contact.user_id !== user.id) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        if (contactError || !contact) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        // Create note
        const { data: note, error } = await supabase
          .from('contact_notes')
          .insert({
            contact_id,
            user_id: user.id,
            note_content,
            note_type: note_type || 'general',
            tags: tags || [],
            is_important: is_important || false,
          })
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to create note: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          note,
        });
      } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to create note' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
