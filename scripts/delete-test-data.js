#!/usr/bin/env node

/**
 * Delete Test Contractor Data Script
 *
 * This script deletes all test contractors from the database.
 * Only deletes contractors with @test.eventpros.local email domain.
 *
 * Usage:
 *   node scripts/delete-test-data.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Check if we're in development
if (
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production'
) {
  console.error(
    '❌ This script should only be run in development environments!'
  );
  process.exit(1);
}

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error(
    'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteTestData() {
  console.log('🗑️  Starting test contractor data deletion...\n');

  try {
    // Find all test contractors
    const { data: testUsers, error: findError } = await supabase
      .from('users')
      .select('id, email, company_name:business_profiles(company_name)')
      .like('email', '%@test.eventpros.local');

    if (findError) {
      throw findError;
    }

    if (!testUsers || testUsers.length === 0) {
      console.log('ℹ️  No test contractors found to delete.');
      return;
    }

    console.log(`Found ${testUsers.length} test contractor(s) to delete:`);
    testUsers.forEach(user => {
      const companyName = user.business_profiles?.[0]?.company_name || 'N/A';
      console.log(`   - ${user.email} (${companyName})`);
    });

    // Delete auth users first (this will also trigger CASCADE deletion of public.users)
    console.log('\nDeleting auth users...');
    for (const user of testUsers) {
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
          user.id
        );
        if (authDeleteError) {
          console.warn(
            `⚠️  Could not delete auth user ${user.email}:`,
            authDeleteError.message
          );
        } else {
          console.log(`   ✅ Deleted auth user: ${user.email}`);
        }
      } catch (error) {
        console.warn(
          `⚠️  Error deleting auth user ${user.email}:`,
          error.message
        );
      }
    }

    // Also delete from public.users (in case auth deletion didn't cascade)
    console.log('\nCleaning up public.users records...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .like('email', '%@test.eventpros.local');

    if (deleteError) {
      console.warn(
        '⚠️  Error deleting from public.users:',
        deleteError.message
      );
    }

    console.log(
      `\n✅ Successfully deleted ${testUsers.length} test contractor(s) and all related data!`
    );
    console.log(
      '   (auth users, profiles, business_profiles, services, portfolio, testimonials, etc.)'
    );
  } catch (error) {
    console.error('❌ Error deleting test data:', error.message);
    console.error(
      '\n💡 Alternative: Run the SQL file directly in your Supabase SQL editor:'
    );
    console.error('   supabase/delete-test-contractors.sql');
    process.exit(1);
  }
}

// Run the delete function
deleteTestData();
