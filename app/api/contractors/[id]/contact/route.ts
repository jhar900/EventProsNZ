import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Get the current user (must be authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', contractorId)
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Prevent contractors from contacting themselves
    if (user.id === contractorId) {
      return NextResponse.json(
        { error: 'Cannot contact yourself' },
        { status: 400 }
      );
    }

    // Get user profile to verify they're an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'event_manager') {
      return NextResponse.json(
        { error: 'Only event managers can send inquiries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, message } = body;

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Check for recent inquiries to prevent spam
    const { data: recentInquiries } = await supabase
      .from('inquiries')
      .select('id')
      .eq('event_manager_id', user.id)
      .eq('contractor_id', contractorId)
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(1);

    if (recentInquiries && recentInquiries.length > 0) {
      return NextResponse.json(
        {
          error: 'You can only send one inquiry per day to the same contractor',
        },
        { status: 429 }
      );
    }

    // Create the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        contractor_id: contractorId,
        event_manager_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('Inquiry creation error:', inquiryError);
      return NextResponse.json(
        { error: 'Failed to send inquiry' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to contractor
    // This would integrate with the email service

    return NextResponse.json({
      inquiry,
      message: 'Inquiry sent successfully',
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
