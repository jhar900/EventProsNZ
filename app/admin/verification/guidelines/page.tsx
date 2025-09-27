import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VerificationGuidelines } from '@/components/features/admin/verification/VerificationGuidelines';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

async function getVerificationCriteria() {
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

    // Fetch verification criteria
    const { data: criteria, error: criteriaError } = await supabase
      .from('verification_criteria')
      .select('*')
      .order('user_type', { ascending: true })
      .order('is_required', { ascending: false });

    if (criteriaError) {
      return [];
    }

    return criteria || [];
  } catch (error) {
    return [];
  }
}

export default async function VerificationGuidelinesPage() {
  const criteria = await getVerificationCriteria();

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSpinner />}>
        <VerificationGuidelines criteria={criteria} />
      </Suspense>
    </div>
  );
}
