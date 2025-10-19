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
const createContactSchema = z.object({
  contact_user_id: z.string().uuid('Invalid contact user ID'),
  contact_type: z.enum([
    'contractor',
    'event_manager',
    'client',
    'vendor',
    'other',
  ]),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
});

const updateContactSchema = z.object({
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  last_interaction: z.string().datetime().optional(),
});

const getContactsSchema = z.object({
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/crm/contacts - Get user's contacts
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

        const validationResult = getContactsSchema.safeParse(queryParams);
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

        const { contact_type, relationship_status, page, limit } =
          validationResult.data;

        // Check cache first
        const cacheKey = { contact_type, relationship_status, page, limit };
        const cachedContacts = await crmDataCache.getContacts(
          user.id,
          cacheKey
        );

        if (cachedContacts) {
          return NextResponse.json({
            success: true,
            contacts: cachedContacts,
            total: cachedContacts.length,
            page,
            limit,
          });
        }

        // Build query step by step to avoid method chaining issues
        let query = supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id);

        if (contact_type) {
          query = query.eq('contact_type', contact_type);
        }

        if (relationship_status) {
          query = query.eq('relationship_status', relationship_status);
        }

        // Get total count separately
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const offset = (page - 1) * limit;

        // Apply ordering and pagination
        query = query.order('last_interaction', {
          ascending: false,
          nullsLast: true,
        });
        query = query.range(offset, offset + limit - 1);

        // Execute the final query
        const { data: contacts, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch contacts: ${error.message}`);
        }

        // Cache the results
        await crmDataCache.setContacts(
          user.id,
          contacts || [],
          cacheKey,
          5 * 60 * 1000 // 5 minutes TTL
        );

        return NextResponse.json({
          success: true,
          contacts: contacts || [],
          total: count || 0,
          page,
          limit,
        });
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch contacts' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// POST /api/crm/contacts - Create a new contact
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

        const validationResult = createContactSchema.safeParse(sanitizedBody);

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

        const { contact_user_id, contact_type, relationship_status } =
          validationResult.data;

        // Check if contact already exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('contact_user_id', contact_user_id)
          .single();

        if (existingContact) {
          return NextResponse.json(
            { success: false, message: 'Contact already exists' },
            { status: 409 }
          );
        }

        // Verify the contact user exists
        const { data: contactUser, error: userError } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', contact_user_id)
          .single();

        if (userError || !contactUser) {
          return NextResponse.json(
            { success: false, message: 'Contact user not found' },
            { status: 404 }
          );
        }

        // Create contact
        const { data: contact, error } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            contact_user_id,
            contact_type,
            relationship_status: relationship_status || 'active',
          })
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to create contact: ${error.message}`);
        }

        // Invalidate cache for this user
        await crmDataCache.invalidateUser(user.id);

        // Invalidate cache for this user
        await crmDataCache.invalidateUser(user.id);

        return NextResponse.json({
          success: true,
          contact,
        });
      } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to create contact' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// PUT /api/crm/contacts - Update a contact
export async function PUT(request: NextRequest) {
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

        const { contact_type, relationship_status, last_interaction } =
          validationResult.data;

        // Get contact ID from URL
        const url = new URL(request.url);
        const contactId = url.pathname.split('/').pop();

        if (!contactId) {
          return NextResponse.json(
            { success: false, message: 'Contact ID is required' },
            { status: 400 }
          );
        }

        // Update contact
        const updateData: any = {};
        if (contact_type) updateData.contact_type = contact_type;
        if (relationship_status)
          updateData.relationship_status = relationship_status;
        if (last_interaction) updateData.last_interaction = last_interaction;

        const { data: contact, error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId)
          .eq('user_id', user.id)
          .select('*')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return NextResponse.json(
              { success: false, message: 'Contact not found' },
              { status: 404 }
            );
          }
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

// DELETE /api/crm/contacts - Delete a contact
export async function DELETE(request: NextRequest) {
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

        // Get contact ID from URL
        const url = new URL(request.url);
        const contactId = url.pathname.split('/').pop();

        if (!contactId) {
          return NextResponse.json(
            { success: false, message: 'Contact ID is required' },
            { status: 400 }
          );
        }

        // Delete contact
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
