import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  SendInquiryRequest,
  BulkSendInquiryRequest,
  InquiryResponse,
  INQUIRY_TYPES,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

// Validation schemas
const sendInquirySchema = z.object({
  contractor_id: z.string().uuid('Invalid contractor ID'),
  event_id: z.string().uuid('Invalid event ID').optional(),
  inquiry_type: z.enum(Object.values(INQUIRY_TYPES) as [string, ...string[]]),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long'),
  event_details: z
    .object({
      event_type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      event_date: z.string().datetime(),
      duration_hours: z.number().min(0).max(168).optional(),
      attendee_count: z.number().min(1).max(10000).optional(),
      location: z.object({
        address: z.string(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
        placeId: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
      }),
      budget_total: z.number().min(0).optional(),
      special_requirements: z.string().optional(),
      service_requirements: z
        .array(
          z.object({
            category: z.string(),
            type: z.string(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high']),
            estimated_budget: z.number().min(0).optional(),
            is_required: z.boolean(),
          })
        )
        .optional(),
    })
    .optional(),
  priority: z
    .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
    .optional()
    .default('medium'),
});

const bulkSendInquirySchema = z.object({
  contractor_ids: z
    .array(z.string().uuid('Invalid contractor ID'))
    .min(1, 'At least one contractor required'),
  inquiry_data: z.object({
    event_id: z.string().uuid('Invalid event ID').optional(),
    inquiry_type: z.enum(Object.values(INQUIRY_TYPES) as [string, ...string[]]),
    subject: z
      .string()
      .min(1, 'Subject is required')
      .max(200, 'Subject too long'),
    message: z
      .string()
      .min(1, 'Message is required')
      .max(2000, 'Message too long'),
    event_details: z
      .object({
        event_type: z.string(),
        title: z.string(),
        description: z.string().optional(),
        event_date: z.string().datetime(),
        duration_hours: z.number().min(0).max(168).optional(),
        attendee_count: z.number().min(1).max(10000).optional(),
        location: z.object({
          address: z.string(),
          coordinates: z
            .object({
              lat: z.number(),
              lng: z.number(),
            })
            .optional(),
          placeId: z.string().optional(),
          city: z.string().optional(),
          region: z.string().optional(),
          country: z.string().optional(),
        }),
        budget_total: z.number().min(0).optional(),
        special_requirements: z.string().optional(),
        service_requirements: z
          .array(
            z.object({
              category: z.string(),
              type: z.string(),
              description: z.string().optional(),
              priority: z.enum(['low', 'medium', 'high']),
              estimated_budget: z.number().min(0).optional(),
              is_required: z.boolean(),
            })
          )
          .optional(),
      })
      .optional(),
    priority: z
      .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
      .optional()
      .default('medium'),
  }),
});

// POST /api/inquiries/send - Send a single inquiry
export async function POST(request: NextRequest) {
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
    const validationResult = sendInquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors:
            validationResult.error?.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const inquiryData = validationResult.data;

    // Check if user is an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'event_manager') {
      return NextResponse.json(
        { success: false, message: 'Only event managers can send inquiries' },
        { status: 403 }
      );
    }

    // Verify contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', inquiryData.contractor_id)
      .eq('role', 'contractor')
      .single();

    if (contractorError || !contractor || !contractor.is_verified) {
      return NextResponse.json(
        { success: false, message: 'Contractor not found or not verified' },
        { status: 404 }
      );
    }

    // Verify event exists if provided
    if (inquiryData.event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, event_manager_id')
        .eq('id', inquiryData.event_id)
        .eq('event_manager_id', user.id)
        .single();

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, message: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        event_manager_id: user.id,
        contractor_id: inquiryData.contractor_id,
        event_id: inquiryData.event_id,
        inquiry_type: inquiryData.inquiry_type,
        subject: inquiryData.subject,
        message: inquiryData.message,
        event_details: inquiryData.event_details,
        priority: inquiryData.priority,
        status: 'sent',
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('Inquiry creation error:', inquiryError);
      return NextResponse.json(
        { success: false, message: 'Failed to create inquiry' },
        { status: 500 }
      );
    }

    // TODO: Send email notification to contractor
    // This would integrate with the notification system

    const response: InquiryResponse = {
      inquiry,
      success: true,
      message: 'Inquiry sent successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Inquiry send error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/inquiries/bulk-send - Send inquiries to multiple contractors
export async function PUT(request: NextRequest) {
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
    const validationResult = bulkSendInquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors:
            validationResult.error?.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const { contractor_ids, inquiry_data } = validationResult.data;

    // Check if user is an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'event_manager') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only event managers can send bulk inquiries',
        },
        { status: 403 }
      );
    }

    // Verify all contractors exist and are verified
    const { data: contractors, error: contractorsError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .in('id', contractor_ids)
      .eq('role', 'contractor');

    if (
      contractorsError ||
      !contractors ||
      contractors.length !== contractor_ids.length
    ) {
      return NextResponse.json(
        { success: false, message: 'One or more contractors not found' },
        { status: 404 }
      );
    }

    const unverifiedContractors = contractors.filter(c => !c.is_verified);
    if (unverifiedContractors.length > 0) {
      return NextResponse.json(
        { success: false, message: 'One or more contractors are not verified' },
        { status: 400 }
      );
    }

    // Verify event exists if provided
    if (inquiry_data.event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, event_manager_id')
        .eq('id', inquiry_data.event_id)
        .eq('event_manager_id', user.id)
        .single();

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, message: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create inquiries for all contractors
    const inquiriesToCreate = contractor_ids.map(contractor_id => ({
      event_manager_id: user.id,
      contractor_id,
      event_id: inquiry_data.event_id,
      inquiry_type: inquiry_data.inquiry_type,
      subject: inquiry_data.subject,
      message: inquiry_data.message,
      event_details: inquiry_data.event_details,
      priority: inquiry_data.priority,
      status: 'sent',
    }));

    const { data: inquiries, error: inquiriesError } = await supabase
      .from('inquiries')
      .insert(inquiriesToCreate)
      .select();

    if (inquiriesError) {
      console.error('Bulk inquiry creation error:', inquiriesError);
      return NextResponse.json(
        { success: false, message: 'Failed to create inquiries' },
        { status: 500 }
      );
    }

    // TODO: Send email notifications to all contractors
    // This would integrate with the notification system

    return NextResponse.json({
      inquiries: inquiries || [],
      success: true,
      message: `Inquiries sent to ${contractor_ids.length} contractors`,
    });
  } catch (error) {
    console.error('Bulk inquiry send error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
