import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  type: z.enum(['legal', 'privacy', 'general']).optional().default('general'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message, type } = validationResult.data;
    const supabase = createClient();

    // Insert the legal inquiry
    const { data: inquiry, error } = await supabase
      .from('legal_inquiries')
      .insert({
        name,
        email,
        subject,
        message,
        type,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // Log error for debugging (in production, use proper logging service)
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to legal team
    // This would integrate with the email system

    return NextResponse.json({
      success: true,
      message: 'Legal inquiry submitted successfully',
      data: {
        id: inquiry.id,
        status: inquiry.status,
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
