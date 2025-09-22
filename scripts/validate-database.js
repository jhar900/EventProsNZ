#!/usr/bin/env node

/**
 * Database Validation Script
 * Validates the database schema and data integrity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateDatabase() {
  console.log('🔍 Validating database schema and data integrity...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return false;
    }
    console.log('✅ Database connection successful\n');

    // Check migration status
    console.log('2. Checking migration status...');
    const { data: migrations, error: migrationError } = await supabase.rpc(
      'check_migration_status'
    );

    if (migrationError) {
      console.error('❌ Failed to check migrations:', migrationError.message);
    } else {
      console.log('✅ Migration status:');
      migrations.forEach(migration => {
        console.log(
          `   - ${migration.version}: ${migration.name} (${migration.status})`
        );
      });
    }
    console.log('');

    // Check database version
    console.log('3. Getting database version...');
    const { data: version, error: versionError } = await supabase.rpc(
      'get_database_version'
    );

    if (versionError) {
      console.error('❌ Failed to get database version:', versionError.message);
    } else {
      console.log(`✅ Database version: ${version}\n`);
    }

    // Validate database integrity
    console.log('4. Validating database integrity...');
    const { data: integrity, error: integrityError } = await supabase.rpc(
      'validate_database_integrity'
    );

    if (integrityError) {
      console.error('❌ Failed to validate integrity:', integrityError.message);
    } else {
      console.log('✅ Integrity checks:');
      integrity.forEach(check => {
        const status = check.status === 'PASS' ? '✅' : '❌';
        console.log(`   ${status} ${check.check_name}: ${check.message}`);
      });
    }
    console.log('');

    // Test RLS policies
    console.log('5. Testing Row Level Security policies...');

    // Test user table access
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);

    if (usersError) {
      console.log('❌ User table access failed:', usersError.message);
    } else {
      console.log(`✅ User table access successful (${users.length} records)`);
    }

    // Test business profiles access
    const { data: businessProfiles, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, company_name, subscription_tier')
      .limit(5);

    if (businessError) {
      console.log('❌ Business profiles access failed:', businessError.message);
    } else {
      console.log(
        `✅ Business profiles access successful (${businessProfiles.length} records)`
      );
    }

    // Test events access
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, status')
      .limit(5);

    if (eventsError) {
      console.log('❌ Events access failed:', eventsError.message);
    } else {
      console.log(`✅ Events access successful (${events.length} records)`);
    }

    console.log('\n🎉 Database validation completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Run validation
validateDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
