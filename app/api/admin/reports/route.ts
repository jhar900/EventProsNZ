import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'users';
    const format = searchParams.get('format') || 'json';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (format === 'csv') {
      return await generateCSVReport(supabase, reportType, dateFrom, dateTo);
    } else if (format === 'excel') {
      return await generateExcelReport(supabase, reportType, dateFrom, dateTo);
    } else {
      return await generateJSONReport(supabase, reportType, dateFrom, dateTo);
    }
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateJSONReport(
  supabase: any,
  reportType: string,
  dateFrom?: string,
  dateTo?: string
) {
  const startDate = dateFrom
    ? new Date(dateFrom)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateTo ? new Date(dateTo) : new Date();

  let reportData;

  switch (reportType) {
    case 'users':
      reportData = await generateUsersReport(supabase, startDate, endDate);
      break;
    case 'contractors':
      reportData = await generateContractorsReport(
        supabase,
        startDate,
        endDate
      );
      break;
    case 'verification':
      reportData = await generateVerificationReport(
        supabase,
        startDate,
        endDate
      );
      break;
    case 'activity':
      reportData = await generateActivityReport(supabase, startDate, endDate);
      break;
    default:
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
  }

  return NextResponse.json({
    report: {
      type: reportType,
      generatedAt: new Date().toISOString(),
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      data: reportData,
    },
  });
}

async function generateCSVReport(
  supabase: any,
  reportType: string,
  dateFrom?: string,
  dateTo?: string
) {
  const startDate = dateFrom
    ? new Date(dateFrom)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = dateTo ? new Date(dateTo) : new Date();

  let csvData;

  switch (reportType) {
    case 'users':
      csvData = await generateUsersCSV(supabase, startDate, endDate);
      break;
    case 'contractors':
      csvData = await generateContractorsCSV(supabase, startDate, endDate);
      break;
    default:
      return NextResponse.json(
        { error: 'CSV export not available for this report type' },
        { status: 400 }
      );
  }

  return new NextResponse(csvData, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

async function generateExcelReport(
  supabase: any,
  reportType: string,
  dateFrom?: string,
  dateTo?: string
) {
  // For now, return a placeholder response
  // In a real implementation, you would use a library like xlsx to generate Excel files
  return NextResponse.json(
    { error: 'Excel export not yet implemented' },
    { status: 501 }
  );
}

async function generateUsersReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  const { data: users } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      role,
      is_verified,
      status,
      last_login,
      created_at,
      profiles (
        first_name,
        last_name,
        phone,
        address
      ),
      business_profiles (
        company_name,
        subscription_tier
      )
    `
    )
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  return {
    totalUsers: users?.length || 0,
    users: users || [],
    summary: {
      eventManagers: users?.filter(u => u.role === 'event_manager').length || 0,
      contractors: users?.filter(u => u.role === 'contractor').length || 0,
      verified: users?.filter(u => u.is_verified).length || 0,
      active:
        users?.filter(
          u =>
            u.last_login &&
            new Date(u.last_login) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
    },
  };
}

async function generateContractorsReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  const { data: contractors } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      is_verified,
      created_at,
      profiles (
        first_name,
        last_name,
        phone
      ),
      business_profiles (
        company_name,
        business_address,
        nzbn,
        description,
        service_areas,
        subscription_tier,
        verification_date
      )
    `
    )
    .eq('role', 'contractor')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  return {
    totalContractors: contractors?.length || 0,
    contractors: contractors || [],
    summary: {
      verified: contractors?.filter(c => c.is_verified).length || 0,
      pending: contractors?.filter(c => !c.is_verified).length || 0,
      premium:
        contractors?.filter(
          c => c.business_profiles?.subscription_tier === 'premium'
        ).length || 0,
    },
  };
}

async function generateVerificationReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  const { data: verifications } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      is_verified,
      created_at,
      profiles (
        first_name,
        last_name
      ),
      business_profiles (
        company_name,
        verification_date
      )
    `
    )
    .eq('role', 'contractor')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  return {
    totalVerifications: verifications?.length || 0,
    verifications: verifications || [],
    summary: {
      approved: verifications?.filter(v => v.is_verified).length || 0,
      pending: verifications?.filter(v => !v.is_verified).length || 0,
      approvalRate: verifications?.length
        ? Math.round(
            (verifications.filter(v => v.is_verified).length /
              verifications.length) *
              100
          )
        : 0,
    },
  };
}

async function generateActivityReport(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  const { data: activities } = await supabase
    .from('user_activity_logs')
    .select(
      `
      id,
      user_id,
      activity_type,
      created_at,
      users!inner(
        email,
        role
      )
    `
    )
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  const activitySummary =
    activities?.reduce((acc: any, activity: any) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {}) || {};

  return {
    totalActivities: activities?.length || 0,
    activities: activities || [],
    summary: activitySummary,
  };
}

async function generateUsersCSV(supabase: any, startDate: Date, endDate: Date) {
  const { data: users } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      role,
      is_verified,
      status,
      last_login,
      created_at,
      profiles (
        first_name,
        last_name,
        phone
      ),
      business_profiles (
        company_name
      )
    `
    )
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  const headers = [
    'ID',
    'Email',
    'Role',
    'First Name',
    'Last Name',
    'Phone',
    'Company Name',
    'Verified',
    'Status',
    'Last Login',
    'Created At',
  ];

  const rows =
    users?.map(user => [
      user.id,
      user.email,
      user.role,
      user.profiles?.first_name || '',
      user.profiles?.last_name || '',
      user.profiles?.phone || '',
      user.business_profiles?.company_name || '',
      user.is_verified ? 'Yes' : 'No',
      user.status || 'active',
      user.last_login || '',
      user.created_at,
    ]) || [];

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

async function generateContractorsCSV(
  supabase: any,
  startDate: Date,
  endDate: Date
) {
  const { data: contractors } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      is_verified,
      created_at,
      profiles (
        first_name,
        last_name,
        phone
      ),
      business_profiles (
        company_name,
        business_address,
        nzbn,
        subscription_tier,
        verification_date
      )
    `
    )
    .eq('role', 'contractor')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  const headers = [
    'ID',
    'Email',
    'First Name',
    'Last Name',
    'Phone',
    'Company Name',
    'Business Address',
    'NZBN',
    'Verified',
    'Subscription Tier',
    'Verification Date',
    'Created At',
  ];

  const rows =
    contractors?.map(contractor => [
      contractor.id,
      contractor.email,
      contractor.profiles?.first_name || '',
      contractor.profiles?.last_name || '',
      contractor.profiles?.phone || '',
      contractor.business_profiles?.company_name || '',
      contractor.business_profiles?.business_address || '',
      contractor.business_profiles?.nzbn || '',
      contractor.is_verified ? 'Yes' : 'No',
      contractor.business_profiles?.subscription_tier || '',
      contractor.business_profiles?.verification_date || '',
      contractor.created_at,
    ]) || [];

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}
