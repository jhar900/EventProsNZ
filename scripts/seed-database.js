#!/usr/bin/env node

/**
 * Database Seeding Script
 * Seeds the database with test data for development
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...\n');

  try {
    // Read and execute seed SQL
    const seedSqlPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

    console.log('1. Executing seed SQL...');
    const { error: seedError } = await supabase.rpc('exec_sql', {
      sql: seedSql,
    });

    if (seedError) {
      console.error('❌ Seed SQL execution failed:', seedError.message);
      return false;
    }
    console.log('✅ Seed SQL executed successfully\n');

    // Verify seeded data
    console.log('2. Verifying seeded data...');

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.log('❌ Failed to verify users:', usersError.message);
    } else {
      console.log('✅ Users seeded successfully');
    }

    // Check business profiles
    const { data: businessProfiles, error: businessError } = await supabase
      .from('business_profiles')
      .select('count')
      .limit(1);

    if (businessError) {
      console.log(
        '❌ Failed to verify business profiles:',
        businessError.message
      );
    } else {
      console.log('✅ Business profiles seeded successfully');
    }

    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (eventsError) {
      console.log('❌ Failed to verify events:', eventsError.message);
    } else {
      console.log('✅ Events seeded successfully');
    }

    // Check services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('count')
      .limit(1);

    if (servicesError) {
      console.log('❌ Failed to verify services:', servicesError.message);
    } else {
      console.log('✅ Services seeded successfully');
    }

    console.log('\n🎉 Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    return false;
  }
}

// Run seeding
seedDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
