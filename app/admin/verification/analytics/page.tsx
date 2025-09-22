import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VerificationAnalytics } from '@/components/features/admin/verification/VerificationAnalytics';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

async function checkAdminAccess() {
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

    return true;
  } catch (error) {
    console.error('Error in checkAdminAccess:', error);
    redirect('/dashboard');
  }
}

export default async function VerificationAnalyticsPage() {
  await checkAdminAccess();

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <VerificationAnalytics />
      </Suspense>
    </div>
  );
}
