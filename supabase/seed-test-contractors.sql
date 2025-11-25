-- Test Contractor Data Seed Script
-- This script creates 10 test contractors for local development only
-- All test contractors use @test.eventpros.local email domain for easy identification
-- Run this script only in development environments
--
-- IMPORTANT: This SQL script requires auth users to be created first!
-- The users table has a foreign key constraint to auth.users(id)
-- 
-- RECOMMENDED: Use the Node.js script instead which handles auth user creation:
--   node scripts/seed-test-data.js
--
-- If you want to use this SQL file directly, you must first create auth users
-- via Supabase Admin API or Dashboard, then run this script.

-- Insert into public.users table
-- NOTE: These user IDs must exist in auth.users first!
INSERT INTO public.users (id, email, role, is_verified, last_login, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000001', 'catering@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'photography@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'music@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'venue@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'decoration@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', 'florist@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'videography@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', 'lighting@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000009', 'catering2@test.eventpros.local', 'contractor', false, NOW(), NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'entertainment@test.eventpros.local', 'contractor', true, NOW(), NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert profiles
INSERT INTO public.profiles (user_id, first_name, last_name, phone, address, bio, location, timezone, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Sarah', 'Mitchell', '+64 21 111 1111', '123 Queen Street, Auckland CBD, Auckland 1010', 'Award-winning chef with 15 years of experience in event catering. Specializing in corporate events and weddings.', 'Auckland', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'James', 'Anderson', '+64 21 222 2222', '456 Lambton Quay, Wellington Central, Wellington 6011', 'Professional event photographer capturing moments that matter. Specializing in corporate events and weddings.', 'Wellington', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'Michael', 'Chen', '+64 21 333 3333', '789 Colombo Street, Christchurch Central, Christchurch 8011', 'Professional DJ and music coordinator with over 10 years of experience. Creating unforgettable sound experiences.', 'Christchurch', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'Emma', 'Thompson', '+64 21 444 4444', '321 Victoria Street, Hamilton Central, Hamilton 3204', 'Venue manager with expertise in hosting corporate events, weddings, and conferences. Multiple premium venues available.', 'Hamilton', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'Olivia', 'Williams', '+64 21 555 5555', '654 Devonport Road, Tauranga Central, Tauranga 3110', 'Creative event decorator and designer. Transforming spaces into memorable experiences for weddings and corporate events.', 'Tauranga', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', 'Sophia', 'Brown', '+64 21 666 6666', '987 Princes Street, Dunedin Central, Dunedin 9016', 'Floral designer specializing in wedding bouquets, centerpieces, and event decorations. Fresh flowers sourced locally.', 'Dunedin', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'David', 'Martinez', '+64 21 777 7777', '147 George Street, Napier Central, Napier 4110', 'Professional videographer and editor. Creating cinematic event videos, corporate films, and wedding highlights.', 'Napier', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', 'Robert', 'Taylor', '+64 21 888 8888', '258 Main Street, Palmerston North Central, Palmerston North 4410', 'Lighting specialist for events. Professional stage lighting, ambient lighting, and special effects for all event types.', 'Palmerston North', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000009', 'Lisa', 'Johnson', '+64 21 999 9999', '369 High Street, Nelson Central, Nelson 7010', 'Catering professional specializing in casual events and corporate lunches. Budget-friendly options available.', 'Nelson', 'Pacific/Auckland', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'Chris', 'Wilson', '+64 21 000 0000', '741 Fenton Street, Rotorua Central, Rotorua 3010', 'Entertainment coordinator providing live bands, performers, and interactive entertainment for events of all sizes.', 'Rotorua', 'Pacific/Auckland', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    updated_at = NOW();

-- Insert business profiles
INSERT INTO public.business_profiles (user_id, company_name, description, website, location, service_categories, average_rating, review_count, is_verified, subscription_tier, business_address, service_areas, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Auckland Elite Catering', 'Premium catering services for corporate events, weddings, and private functions. Specializing in fine dining and custom menus.', 'https://auckland-elite-catering.test', 'Auckland', ARRAY['Catering', 'Food & Beverage', 'Corporate Events'], 4.8, 47, true, 'professional', '123 Queen Street, Auckland CBD, Auckland 1010', ARRAY['Auckland', 'North Shore', 'Waitakere'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Capital Photography Co', 'Professional event photography services. Specializing in corporate events, weddings, and product launches.', 'https://capital-photography.test', 'Wellington', ARRAY['Photography', 'Event Coverage', 'Corporate Events'], 4.9, 35, true, 'professional', '456 Lambton Quay, Wellington Central, Wellington 6011', ARRAY['Wellington', 'Lower Hutt', 'Porirua'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'Canterbury Sound Systems', 'Professional DJ and music services for weddings, corporate events, and parties. State-of-the-art sound equipment.', 'https://canterbury-sound.test', 'Christchurch', ARRAY['Music', 'DJ Services', 'Entertainment'], 4.7, 29, true, 'essential', '789 Colombo Street, Christchurch Central, Christchurch 8011', ARRAY['Christchurch', 'Canterbury'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'Waikato Event Venues', 'Premium event venues in Hamilton and surrounding areas. Multiple spaces available for conferences, weddings, and corporate events.', 'https://waikato-venues.test', 'Hamilton', ARRAY['Venues', 'Event Spaces', 'Corporate Events'], 4.6, 54, true, 'enterprise', '321 Victoria Street, Hamilton Central, Hamilton 3204', ARRAY['Hamilton', 'Waikato'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'Bay of Plenty Decor', 'Creative event decoration and styling services. Specializing in weddings, corporate events, and themed parties.', 'https://bay-decor.test', 'Tauranga', ARRAY['Decoration', 'Event Styling', 'Design'], 4.5, 22, true, 'essential', '654 Devonport Road, Tauranga Central, Tauranga 3110', ARRAY['Tauranga', 'Bay of Plenty'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', 'Southern Blooms', 'Floral design and arrangement services. Specializing in wedding flowers, event centerpieces, and corporate arrangements.', 'https://southern-blooms.test', 'Dunedin', ARRAY['Floral Design', 'Wedding Flowers', 'Event Decorations'], 4.4, 18, false, 'essential', '987 Princes Street, Dunedin Central, Dunedin 9016', ARRAY['Dunedin', 'Otago'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'Hawkes Bay Video Productions', 'Professional videography services for events, corporate films, and weddings. Full editing and post-production included.', 'https://hawkes-video.test', 'Napier', ARRAY['Videography', 'Event Coverage', 'Corporate Films'], 4.8, 31, true, 'professional', '147 George Street, Napier Central, Napier 4110', ARRAY['Napier', 'Hawkes Bay'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', 'Manawatu Lighting Solutions', 'Professional event lighting services. Stage lighting, ambient lighting, and special effects for all event types.', 'https://manawatu-lighting.test', 'Palmerston North', ARRAY['Lighting', 'Stage Production', 'Event Technology'], 4.6, 25, true, 'essential', '258 Main Street, Palmerston North Central, Palmerston North 4410', ARRAY['Palmerston North', 'Manawatu'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000009', 'Nelson Budget Catering', 'Affordable catering services for casual events, corporate lunches, and small gatherings. Great value for money.', 'https://nelson-budget-catering.test', 'Nelson', ARRAY['Catering', 'Food & Beverage', 'Casual Events'], 4.2, 15, false, 'essential', '369 High Street, Nelson Central, Nelson 7010', ARRAY['Nelson', 'Tasman'], NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'Rotorua Entertainment Group', 'Live entertainment services including bands, performers, and interactive entertainment. Perfect for corporate events and parties.', 'https://rotorua-entertainment.test', 'Rotorua', ARRAY['Entertainment', 'Live Music', 'Performers'], 4.7, 33, true, 'professional', '741 Fenton Street, Rotorua Central, Rotorua 3010', ARRAY['Rotorua', 'Bay of Plenty'], NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    location = EXCLUDED.location,
    service_categories = EXCLUDED.service_categories,
    business_address = EXCLUDED.business_address,
    service_areas = EXCLUDED.service_areas,
    updated_at = NOW();

-- Insert services (using user_id as per the contractor onboarding schema)
INSERT INTO public.services (user_id, service_type, service_name, description, price_range_min, price_range_max, availability, created_at, updated_at) VALUES
    -- Auckland Elite Catering services
    ('10000000-0000-0000-0000-000000000001', 'Catering', 'Corporate Event Catering', 'Complete catering solution for corporate events including menu planning, setup, and service staff', 60.00, 120.00, 'Available weekdays and weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000001', 'Catering', 'Wedding Reception Menu', 'Elegant multi-course wedding menu with canapés, main course, and dessert options', 85.00, 160.00, 'Available year-round', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000001', 'Catering', 'Cocktail Party Service', 'Hors d''oeuvres and beverage service for cocktail parties and networking events', 35.00, 70.00, 'Evenings and weekends', NOW(), NOW()),
    
    -- Capital Photography Co services
    ('10000000-0000-0000-0000-000000000002', 'Photography', 'Event Photography Coverage', 'Professional event photography with high-resolution images and online gallery', 250.00, 600.00, 'Available all days', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Photography', 'Wedding Photography Package', 'Complete wedding photography package including engagement shoot, full day coverage, and edited album', 1200.00, 2800.00, 'Weekends and holidays', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Photography', 'Corporate Headshots', 'Professional headshot photography for corporate teams and executives', 120.00, 250.00, 'Weekdays preferred', NOW(), NOW()),
    
    -- Canterbury Sound Systems services
    ('10000000-0000-0000-0000-000000000003', 'Music', 'Wedding DJ Service', 'Complete DJ service for weddings including MC services, music selection, and professional sound system', 350.00, 700.00, 'Weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'Music', 'Corporate Event Music', 'Background music and sound system for corporate events and conferences', 200.00, 450.00, 'Weekdays and weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'Music', 'Party DJ Package', 'High-energy DJ service for parties and celebrations with lighting effects', 280.00, 550.00, 'Evenings and weekends', NOW(), NOW()),
    
    -- Waikato Event Venues services
    ('10000000-0000-0000-0000-000000000004', 'Venues', 'Conference Room Rental', 'Professional conference room with AV equipment, seating for up to 100 people', 250.00, 600.00, 'Weekdays', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'Venues', 'Wedding Venue Package', 'Complete wedding venue package with catering options and event coordination', 1200.00, 3500.00, 'Weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'Venues', 'Gala Dinner Hall', 'Elegant hall for formal dinners and award ceremonies, capacity 200+', 600.00, 1500.00, 'All days', NOW(), NOW()),
    
    -- Bay of Plenty Decor services
    ('10000000-0000-0000-0000-000000000005', 'Decoration', 'Wedding Decoration Service', 'Complete wedding decoration service including centerpieces, table settings, and venue styling', 600.00, 1800.00, 'Weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'Decoration', 'Corporate Event Styling', 'Professional event styling and decoration for corporate events and product launches', 350.00, 900.00, 'Weekdays and weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'Decoration', 'Themed Party Decoration', 'Custom themed decoration for birthday parties and celebrations', 200.00, 600.00, 'All days', NOW(), NOW()),
    
    -- Southern Blooms services
    ('10000000-0000-0000-0000-000000000006', 'Floral Design', 'Wedding Bouquet Design', 'Custom wedding bouquets and bridal party flowers', 150.00, 400.00, 'Weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', 'Floral Design', 'Event Centerpieces', 'Floral centerpieces and table arrangements for events', 80.00, 200.00, 'All days', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', 'Floral Design', 'Corporate Floral Arrangements', 'Professional floral arrangements for corporate offices and events', 100.00, 300.00, 'Weekdays', NOW(), NOW()),
    
    -- Hawkes Bay Video Productions services
    ('10000000-0000-0000-0000-000000000007', 'Videography', 'Event Videography', 'Professional event videography with multiple camera angles and edited highlights', 400.00, 900.00, 'All days', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'Videography', 'Wedding Video Package', 'Complete wedding video package including ceremony, reception, and highlight reel', 1500.00, 3500.00, 'Weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'Videography', 'Corporate Video Production', 'Corporate video production including interviews, b-roll, and professional editing', 800.00, 2000.00, 'Weekdays', NOW(), NOW()),
    
    -- Manawatu Lighting Solutions services
    ('10000000-0000-0000-0000-000000000008', 'Lighting', 'Stage Lighting Setup', 'Professional stage lighting setup for events and performances', 300.00, 700.00, 'All days', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', 'Lighting', 'Ambient Event Lighting', 'Ambient lighting and mood lighting for events and venues', 200.00, 500.00, 'Evenings', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', 'Lighting', 'Special Effects Lighting', 'Special effects lighting including color washes, moving lights, and effects', 400.00, 900.00, 'Evenings and weekends', NOW(), NOW()),
    
    -- Nelson Budget Catering services
    ('10000000-0000-0000-0000-000000000009', 'Catering', 'Casual Event Catering', 'Affordable catering for casual events, BBQs, and informal gatherings', 25.00, 50.00, 'All days', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000009', 'Catering', 'Corporate Lunch Service', 'Corporate lunch catering with sandwich platters and salads', 15.00, 35.00, 'Weekdays', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000009', 'Catering', 'Morning Tea Service', 'Morning tea catering with pastries, sandwiches, and beverages', 12.00, 30.00, 'Weekdays', NOW(), NOW()),
    
    -- Rotorua Entertainment Group services
    ('10000000-0000-0000-0000-000000000010', 'Entertainment', 'Live Band Performance', 'Live band performance for events including sound system and stage setup', 800.00, 2000.00, 'Evenings and weekends', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'Entertainment', 'Solo Performer', 'Solo musician or performer for intimate events and background entertainment', 200.00, 500.00, 'All days', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'Entertainment', 'Interactive Entertainment', 'Interactive entertainment including magicians, comedians, and interactive performers', 300.00, 800.00, 'All days', NOW(), NOW())
  ON CONFLICT DO NOTHING;

-- Insert portfolio items
INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Corporate Gala Setup', 'Elegant table setup for 200-guest corporate gala event', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3', NULL, '2024-01-15', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000001', 'Wedding Reception', 'Beautiful wedding reception with custom menu and presentation', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', NULL, '2024-02-20', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Wedding Photography', 'Stunning wedding photography portfolio showcasing various styles', 'https://images.unsplash.com/photo-1519741497674-611481863552', NULL, '2024-03-10', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Corporate Event Coverage', 'Professional corporate event photography with candid and posed shots', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2', NULL, '2024-04-05', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'Wedding DJ Setup', 'Professional DJ setup for wedding reception with lighting', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3', NULL, '2024-05-18', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'Conference Room', 'Professional conference room setup with AV equipment', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', NULL, '2024-06-12', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'Wedding Decoration', 'Elegant wedding decoration and styling transformation', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3', NULL, '2024-07-22', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', 'Floral Arrangements', 'Beautiful floral arrangements for wedding ceremony', 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa', NULL, '2024-08-08', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'Event Videography', 'Professional event videography with cinematic highlights', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', NULL, '2024-09-14', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', 'Lighting Design', 'Professional stage lighting design for corporate event', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678', NULL, '2024-10-03', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'Live Band Performance', 'Live band performance at corporate event', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', NULL, '2024-11-19', NOW(), NOW())
  ON CONFLICT DO NOTHING;

-- Insert some testimonials
INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000001', 'John Smith', 'john.smith@example.com', 5, 'Excellent catering service! The food was outstanding and the service was professional. Highly recommended for corporate events.', 'Annual Company Gala', '2024-01-15', true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Sarah Johnson', 'sarah.j@example.com', 5, 'Amazing photography! They captured every important moment perfectly. The quality was exceptional.', 'Wedding Celebration', '2024-03-10', true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', 'Mike Brown', 'mike.brown@example.com', 4, 'Great DJ service! The music selection was perfect and kept everyone dancing all night.', 'Wedding Reception', '2024-05-18', true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', 'Emma Davis', 'emma.davis@example.com', 5, 'Perfect venue for our conference. Professional setup and excellent facilities.', 'Annual Conference', '2024-06-12', true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', 'David Wilson', 'david.w@example.com', 4, 'Beautiful decoration work. They transformed our venue into exactly what we envisioned.', 'Wedding Celebration', '2024-07-22', true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', 'Lisa Anderson', 'lisa.a@example.com', 5, 'Outstanding videography! The final video exceeded our expectations and captured the essence of our event perfectly.', 'Corporate Product Launch', '2024-09-14', true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000010', 'Robert Taylor', 'robert.t@example.com', 4, 'Fantastic live entertainment! The band was professional and kept the energy high throughout the event.', 'Corporate Gala', '2024-11-19', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

-- Success message (check your query results to confirm)
-- Test contractor data seeded successfully!
-- All test contractors use @test.eventpros.local email domain for easy identification.
-- To delete test data, run: DELETE FROM public.users WHERE email LIKE '%@test.eventpros.local';

