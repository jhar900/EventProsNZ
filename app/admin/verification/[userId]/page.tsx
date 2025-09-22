import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { UserVerificationDetails } from '@/components/features/admin/verification/UserVerificationDetails';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

async function getUserVerificationData(userId: string) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect('/login');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      redirect('/dashboard');
    }

    // Get user details with all related information
    const { data: userDetails, error: userDetailsError } = await supabase
      .from('users')
      .select(
        `
        *,
        profiles (*),
        business_profiles (*),
        services (*),
        portfolio (*),
        contractor_testimonials (*),
        contractor_onboarding_status (*)
      `
      )
      .eq('id', userId)
      .single();

    if (userDetailsError) {
      console.error('Error fetching user details:', userDetailsError);
      return notFound();
    }

    // Get verification log for this user
    const { data: verificationLog, error: logError } = await supabase
      .from('verification_log')
      .select(
        `
        *,
        admin_user:users!verification_log_admin_id_fkey (
          id,
          email
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (logError) {
      console.error('Error fetching verification log:', logError);
      return { user: userDetails, verification_log: [], queue_status: null };
    }

    // Get verification queue status
    const { data: queueStatus, error: queueError } = await supabase
      .from('verification_queue')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (queueError && queueError.code !== 'PGRST116') {
      console.error('Error fetching queue status:', queueError);
    }

    return {
      user: userDetails,
      verification_log: verificationLog || [],
      queue_status: queueStatus,
    };
  } catch (error) {
    console.error('Error in getUserVerificationData:', error);
    return notFound();
  }
}

export default async function UserVerificationPage({
  params,
}: {
  params: { userId: string };
}) {
  const data = await getUserVerificationData(params.userId);

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <UserVerificationDetails data={data} />
      </Suspense>
    </div>
  );
}
