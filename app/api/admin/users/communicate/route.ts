import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_ids,
      type,
      subject,
      content,
      template_id,
      scheduled_at,
      admin_notes,
    } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: user_ids are required' },
        { status: 400 }
      );
    }

    if (!type || !subject || !content) {
      return NextResponse.json(
        { error: 'Invalid request: type, subject, and content are required' },
        { status: 400 }
      );
    }

    const validTypes = ['email', 'sms', 'push', 'in_app'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid communication type' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const userId of user_ids) {
      try {
        // Get user details
        const { data: targetUser, error: userError } = await supabase
          .from('users')
          .select('email, profiles(first_name, last_name)')
          .eq('id', userId)
          .single();

        if (userError || !targetUser) {
          errors.push({ userId, error: 'User not found' });
          continue;
        }

        const communicationData = {
          user_id: userId,
          user_email: targetUser.email,
          user_name: targetUser.profiles
            ? `${targetUser.profiles.first_name} ${targetUser.profiles.last_name}`
            : targetUser.email,
          type,
          subject,
          content,
          status: scheduled_at ? 'scheduled' : 'draft',
          scheduled_at: scheduled_at || null,
          template_id: template_id || null,
          admin_notes: admin_notes || null,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Insert communication record
        const { data: communication, error: commError } = await supabase
          .from('user_communications')
          .insert(communicationData)
          .select()
          .single();

        if (commError) {
          errors.push({ userId, error: commError.message });
          continue;
        }

        // If not scheduled, send immediately
        if (!scheduled_at) {
          // Here you would integrate with your email/SMS service
          // For now, we'll just mark it as sent
          await supabase
            .from('user_communications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', communication.id);
        }

        // Log admin action
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'admin_send_communication',
          details: {
            target_user_id: userId,
            communication_id: communication.id,
            type,
            subject,
            scheduled_at,
            admin_user_id: user.id,
          },
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
        });

        results.push({
          userId,
          success: true,
          communication_id: communication.id,
        });
      } catch (error) {
        errors.push({ userId, error: 'Internal error' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: user_ids.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
