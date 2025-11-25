#!/usr/bin/env node

/**
 * Seed Test Contractor Data Script
 *
 * This script seeds 10 test contractors into the database for local development.
 * All test contractors use @test.eventpros.local email domain for easy identification.
 *
 * This script:
 * 1. Creates auth users via Supabase Admin API
 * 2. Inserts user records, profiles, business profiles, services, portfolio, and testimonials
 *
 * Usage:
 *   node scripts/seed-test-data.js
 *
 * To delete test data:
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

// Test contractor data
const testContractors = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'catering@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    phone: '+64 21 111 1111',
    address: '123 Queen Street, Auckland CBD, Auckland 1010',
    bio: 'Award-winning chef with 15 years of experience in event catering. Specializing in corporate events and weddings.',
    location: 'Auckland',
    companyName: 'Auckland Elite Catering',
    description:
      'Premium catering services for corporate events, weddings, and private functions. Specializing in fine dining and custom menus.',
    website: 'https://auckland-elite-catering.test',
    serviceCategories: ['Catering', 'Food & Beverage', 'Corporate Events'],
    averageRating: 4.8,
    reviewCount: 47,
    isVerified: true,
    subscriptionTier: 'professional',
    serviceAreas: ['Auckland', 'North Shore', 'Waitakere'],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'photography@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'James',
    lastName: 'Anderson',
    phone: '+64 21 222 2222',
    address: '456 Lambton Quay, Wellington Central, Wellington 6011',
    bio: 'Professional event photographer capturing moments that matter. Specializing in corporate events and weddings.',
    location: 'Wellington',
    companyName: 'Capital Photography Co',
    description:
      'Professional event photography services. Specializing in corporate events, weddings, and product launches.',
    website: 'https://capital-photography.test',
    serviceCategories: ['Photography', 'Event Coverage', 'Corporate Events'],
    averageRating: 4.9,
    reviewCount: 35,
    isVerified: true,
    subscriptionTier: 'professional',
    serviceAreas: ['Wellington', 'Lower Hutt', 'Porirua'],
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    email: 'music@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Michael',
    lastName: 'Chen',
    phone: '+64 21 333 3333',
    address: '789 Colombo Street, Christchurch Central, Christchurch 8011',
    bio: 'Professional DJ and music coordinator with over 10 years of experience. Creating unforgettable sound experiences.',
    location: 'Christchurch',
    companyName: 'Canterbury Sound Systems',
    description:
      'Professional DJ and music services for weddings, corporate events, and parties. State-of-the-art sound equipment.',
    website: 'https://canterbury-sound.test',
    serviceCategories: ['Music', 'DJ Services', 'Entertainment'],
    averageRating: 4.7,
    reviewCount: 29,
    isVerified: true,
    subscriptionTier: 'essential',
    serviceAreas: ['Christchurch', 'Canterbury'],
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    email: 'venue@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Emma',
    lastName: 'Thompson',
    phone: '+64 21 444 4444',
    address: '321 Victoria Street, Hamilton Central, Hamilton 3204',
    bio: 'Venue manager with expertise in hosting corporate events, weddings, and conferences. Multiple premium venues available.',
    location: 'Hamilton',
    companyName: 'Waikato Event Venues',
    description:
      'Premium event venues in Hamilton and surrounding areas. Multiple spaces available for conferences, weddings, and corporate events.',
    website: 'https://waikato-venues.test',
    serviceCategories: ['Venues', 'Event Spaces', 'Corporate Events'],
    averageRating: 4.6,
    reviewCount: 54,
    isVerified: true,
    subscriptionTier: 'enterprise',
    serviceAreas: ['Hamilton', 'Waikato'],
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    email: 'decoration@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Olivia',
    lastName: 'Williams',
    phone: '+64 21 555 5555',
    address: '654 Devonport Road, Tauranga Central, Tauranga 3110',
    bio: 'Creative event decorator and designer. Transforming spaces into memorable experiences for weddings and corporate events.',
    location: 'Tauranga',
    companyName: 'Bay of Plenty Decor',
    description:
      'Creative event decoration and styling services. Specializing in weddings, corporate events, and themed parties.',
    website: 'https://bay-decor.test',
    serviceCategories: ['Decoration', 'Event Styling', 'Design'],
    averageRating: 4.5,
    reviewCount: 22,
    isVerified: true,
    subscriptionTier: 'essential',
    serviceAreas: ['Tauranga', 'Bay of Plenty'],
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    email: 'florist@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Sophia',
    lastName: 'Brown',
    phone: '+64 21 666 6666',
    address: '987 Princes Street, Dunedin Central, Dunedin 9016',
    bio: 'Floral designer specializing in wedding bouquets, centerpieces, and event decorations. Fresh flowers sourced locally.',
    location: 'Dunedin',
    companyName: 'Southern Blooms',
    description:
      'Floral design and arrangement services. Specializing in wedding flowers, event centerpieces, and corporate arrangements.',
    website: 'https://southern-blooms.test',
    serviceCategories: [
      'Floral Design',
      'Wedding Flowers',
      'Event Decorations',
    ],
    averageRating: 4.4,
    reviewCount: 18,
    isVerified: false,
    subscriptionTier: 'essential',
    serviceAreas: ['Dunedin', 'Otago'],
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    email: 'videography@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'David',
    lastName: 'Martinez',
    phone: '+64 21 777 7777',
    address: '147 George Street, Napier Central, Napier 4110',
    bio: 'Professional videographer and editor. Creating cinematic event videos, corporate films, and wedding highlights.',
    location: 'Napier',
    companyName: 'Hawkes Bay Video Productions',
    description:
      'Professional videography services for events, corporate films, and weddings. Full editing and post-production included.',
    website: 'https://hawkes-video.test',
    serviceCategories: ['Videography', 'Event Coverage', 'Corporate Films'],
    averageRating: 4.8,
    reviewCount: 31,
    isVerified: true,
    subscriptionTier: 'professional',
    serviceAreas: ['Napier', 'Hawkes Bay'],
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    email: 'lighting@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Robert',
    lastName: 'Taylor',
    phone: '+64 21 888 8888',
    address: '258 Main Street, Palmerston North Central, Palmerston North 4410',
    bio: 'Lighting specialist for events. Professional stage lighting, ambient lighting, and special effects for all event types.',
    location: 'Palmerston North',
    companyName: 'Manawatu Lighting Solutions',
    description:
      'Professional event lighting services. Stage lighting, ambient lighting, and special effects for all event types.',
    website: 'https://manawatu-lighting.test',
    serviceCategories: ['Lighting', 'Stage Production', 'Event Technology'],
    averageRating: 4.6,
    reviewCount: 25,
    isVerified: true,
    subscriptionTier: 'essential',
    serviceAreas: ['Palmerston North', 'Manawatu'],
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    email: 'catering2@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Lisa',
    lastName: 'Johnson',
    phone: '+64 21 999 9999',
    address: '369 High Street, Nelson Central, Nelson 7010',
    bio: 'Catering professional specializing in casual events and corporate lunches. Budget-friendly options available.',
    location: 'Nelson',
    companyName: 'Nelson Budget Catering',
    description:
      'Affordable catering services for casual events, corporate lunches, and small gatherings. Great value for money.',
    website: 'https://nelson-budget-catering.test',
    serviceCategories: ['Catering', 'Food & Beverage', 'Casual Events'],
    averageRating: 4.2,
    reviewCount: 15,
    isVerified: false,
    subscriptionTier: 'essential',
    serviceAreas: ['Nelson', 'Tasman'],
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    email: 'entertainment@test.eventpros.local',
    password: 'TestPassword123!',
    firstName: 'Chris',
    lastName: 'Wilson',
    phone: '+64 21 000 0000',
    address: '741 Fenton Street, Rotorua Central, Rotorua 3010',
    bio: 'Entertainment coordinator providing live bands, performers, and interactive entertainment for events of all sizes.',
    location: 'Rotorua',
    companyName: 'Rotorua Entertainment Group',
    description:
      'Live entertainment services including bands, performers, and interactive entertainment. Perfect for corporate events and parties.',
    website: 'https://rotorua-entertainment.test',
    serviceCategories: ['Entertainment', 'Live Music', 'Performers'],
    averageRating: 4.7,
    reviewCount: 33,
    isVerified: true,
    subscriptionTier: 'professional',
    serviceAreas: ['Rotorua', 'Bay of Plenty'],
  },
];

async function seedTestData() {
  console.log('🌱 Starting test contractor data seeding...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const contractor of testContractors) {
    try {
      // Check if user already exists by email (more reliable than ID)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', contractor.email)
        .single();

      if (existingUser) {
        console.log(`⏭️  Skipping ${contractor.email} (already exists)`);
        skipped++;
        continue;
      }

      // Check if auth user already exists first
      let userId;
      let authData = { user: null };

      console.log(`Checking for auth user: ${contractor.email}...`);
      const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users?.find(
        u => u.email === contractor.email
      );

      if (existingAuthUser) {
        console.log(`✅ Found existing auth user for ${contractor.email}`);
        userId = existingAuthUser.id;
        authData.user = existingAuthUser;
      } else {
        // Create new auth user
        console.log(`Creating new auth user: ${contractor.email}...`);
        const { data: newAuthData, error: authError } =
          await supabase.auth.admin.createUser({
            email: contractor.email,
            password: contractor.password,
            email_confirm: true,
            user_metadata: {
              first_name: contractor.firstName,
              last_name: contractor.lastName,
            },
          });

        if (authError) {
          throw new Error(`Failed to create auth user: ${authError.message}`);
        }

        if (!newAuthData?.user) {
          throw new Error('Failed to create auth user');
        }

        userId = newAuthData.user.id;
        authData = newAuthData;
      }

      // Create user record
      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        email: contractor.email,
        role: 'contractor',
        is_verified: contractor.isVerified,
        last_login: new Date().toISOString(),
      });

      if (userError) {
        // If user already exists (duplicate key), update it or skip
        if (
          userError.code === '23505' ||
          userError.message.includes('duplicate')
        ) {
          console.log(
            `⚠️  User ${contractor.email} already exists in database, updating...`
          );
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: contractor.email,
              role: 'contractor',
              is_verified: contractor.isVerified,
            })
            .eq('email', contractor.email);

          if (updateError) {
            console.warn(
              `⚠️  Could not update user ${contractor.email}:`,
              updateError.message
            );
            skipped++;
            continue;
          }
        } else {
          throw userError;
        }
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userId,
        first_name: contractor.firstName,
        last_name: contractor.lastName,
        phone: contractor.phone,
        address: contractor.address,
        bio: contractor.bio,
        location: contractor.location,
        timezone: 'Pacific/Auckland',
      });

      if (profileError && profileError.code !== '23505') {
        console.warn(
          `⚠️  Profile error for ${contractor.email}:`,
          profileError.message
        );
      }

      // Create business profile
      const { error: businessError } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: userId,
          company_name: contractor.companyName,
          description: contractor.description,
          website: contractor.website,
          location: contractor.location,
          service_categories: contractor.serviceCategories,
          average_rating: contractor.averageRating,
          review_count: contractor.reviewCount,
          is_verified: contractor.isVerified,
          subscription_tier: contractor.subscriptionTier,
          business_address: contractor.address,
          service_areas: contractor.serviceAreas,
        });

      if (businessError && businessError.code !== '23505') {
        console.warn(
          `⚠️  Business profile error for ${contractor.email}:`,
          businessError.message
        );
      }

      console.log(`✅ Created ${contractor.email}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating ${contractor.email}:`, error.message);
      errors++;
    }
  }

  console.log('\n📋 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(
    '\n💡 Note: Services, portfolio, and testimonials can be added manually or via SQL.'
  );
  console.log('💡 To delete test data, run: node scripts/delete-test-data.js');
}

// Run the seed function
seedTestData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
