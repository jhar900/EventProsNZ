import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';
import { crmDataCache } from '@/lib/cache/crm-cache';
import { queryOptimizer } from '@/lib/database/query-optimization';

// Validation schemas
const searchContactsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  relationship_status: z
    .enum(['active', 'inactive', 'blocked', 'archived'])
    .optional(),
  tags: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const getSuggestionsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
});

// GET /api/crm/search - Search contacts
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

        const validationResult = searchContactsSchema.safeParse(queryParams);
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

        const { query, contact_type, relationship_status, tags, page, limit } =
          validationResult.data;
        const offset = (page - 1) * limit;

        // Sanitize search query
        const sanitizedQuery = textSanitizer.sanitizeString(query);

        // Check cache first
        const cacheKey = {
          query: sanitizedQuery,
          contact_type,
          relationship_status,
          tags,
          page,
          limit,
        };
        const cachedResults = await crmDataCache.getContacts(user.id, cacheKey);

        if (cachedResults) {
          return NextResponse.json({
            success: true,
            contacts: cachedResults,
            total: cachedResults.length,
            page,
            limit,
            query: sanitizedQuery,
          });
        }

        // Use optimized search query
        const searchResults = await queryOptimizer.searchContactsOptimized(
          user.id,
          sanitizedQuery,
          {
            filters: { contact_type, relationship_status },
            limit,
            offset,
          }
        );

        // Cache the results
        await crmDataCache.setContacts(
          user.id,
          searchResults,
          cacheKey,
          2 * 60 * 1000 // 2 minutes TTL for search results
        );

        return NextResponse.json({
          success: true,
          contacts: searchResults || [],
          total: searchResults?.length || 0,
          page,
          limit,
          query: sanitizedQuery,
        });
      } catch (error) {
        console.error('Error searching contacts:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to search contacts' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
