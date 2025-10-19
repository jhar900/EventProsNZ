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
const updateContactSchema = z.object({
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  last_interaction: z.string().datetime().optional(),
});

// PUT /api/crm/contacts/[id] - Update a contact
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

        const contactId = params.id;

        // Parse and validate request body
        const body = await request.json();

        // Sanitize input data
        const sanitizedBody = textSanitizer.sanitizeObject(body);
        const validationResult = updateContactSchema.safeParse(sanitizedBody);

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

        // Check if contact exists and belongs to user
        const { data: existingContact, error: fetchError } = await supabase
          .from('contacts')
          .select('id, user_id')
          .eq('id', contactId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !existingContact) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        // Update contact
        const { data: contact, error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId)
          .eq('user_id', user.id)
          .select(
            `
        *,
        contact_user:users!contacts_contact_user_id_fkey(
          id,
          email,
          role,
          is_verified,
          last_login,
          created_at
        ),
        contact_profile:profiles!contacts_contact_user_id_fkey(
          first_name,
          last_name,
          phone,
          avatar_url,
          bio
        )
      `
          )
          .single();

        if (error) {
          throw new Error(`Failed to update contact: ${error.message}`);
        }

        // Invalidate cache for this user
        await crmDataCache.invalidateUser(user.id);

        return NextResponse.json({
          success: true,
          contact,
        });
      } catch (error) {
        console.error('Error updating contact:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to update contact' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// DELETE /api/crm/contacts/[id] - Delete a contact
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

        const contactId = params.id;

        // Check if contact exists and belongs to user
        const { data: existingContact, error: fetchError } = await supabase
          .from('contacts')
          .select('id, user_id')
          .eq('id', contactId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !existingContact) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        // Delete contact (this will cascade delete related records due to foreign key constraints)
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(`Failed to delete contact: ${error.message}`);
        }

        // Invalidate cache for this user
        await crmDataCache.invalidateUser(user.id);

        return NextResponse.json({
          success: true,
          message: 'Contact deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting contact:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to delete contact' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
