-- Additional Test Contractor Data (Services, Portfolio, Testimonials)
-- This script adds services, portfolio items, and testimonials to existing test contractors
-- Run this AFTER running the Node.js seed script (scripts/seed-test-data.js)
-- All test contractors use @test.eventpros.local email domain

-- Insert services (using business_profile_id from business_profiles table based on user email)
-- Note: Services table uses business_profile_id, name, service_name (required), category, and is_available columns

-- Auckland Elite Catering services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Event Catering',
  'Corporate Event Catering',
  'Complete catering solution for corporate events including menu planning, setup, and service staff',
  'Catering',
  60.00,
  120.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'catering@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding Reception Menu',
  'Wedding Reception Menu',
  'Elegant multi-course wedding menu with canapés, main course, and dessert options',
  'Catering',
  85.00,
  160.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'catering@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Cocktail Party Service',
  'Cocktail Party Service',
  'Hors d''oeuvres and beverage service for cocktail parties and networking events',
  'Catering',
  35.00,
  70.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'catering@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Capital Photography Co services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Event Photography Coverage',
  'Event Photography Coverage',
  'Professional event photography with high-resolution images and online gallery',
  'Photography',
  250.00,
  600.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'photography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding Photography Package',
  'Wedding Photography Package',
  'Complete wedding photography package including engagement shoot, full day coverage, and edited album',
  'Photography',
  1200.00,
  2800.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'photography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Headshots',
  'Corporate Headshots',
  'Professional headshot photography for corporate teams and executives',
  'Photography',
  120.00,
  250.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'photography@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Canterbury Sound Systems services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding DJ Service',
  'Wedding DJ Service',
  'Complete DJ service for weddings including MC services, music selection, and professional sound system',
  'Music',
  350.00,
  700.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'music@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Event Music',
  'Corporate Event Music',
  'Background music and sound system for corporate events and conferences',
  'Music',
  200.00,
  450.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'music@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Party DJ Package',
  'Party DJ Package',
  'High-energy DJ service for parties and celebrations with lighting effects',
  'Music',
  280.00,
  550.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'music@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Waikato Event Venues services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Conference Room Rental',
  'Conference Room Rental',
  'Professional conference room with AV equipment, seating for up to 100 people',
  'Venues',
  250.00,
  600.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'venue@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding Venue Package',
  'Wedding Venue Package',
  'Complete wedding venue package with catering options and event coordination',
  'Venues',
  1200.00,
  3500.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'venue@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Gala Dinner Hall',
  'Gala Dinner Hall',
  'Elegant hall for formal dinners and award ceremonies, capacity 200+',
  'Venues',
  600.00,
  1500.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'venue@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Bay of Plenty Decor services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding Decoration Service',
  'Wedding Decoration Service',
  'Complete wedding decoration service including centerpieces, table settings, and venue styling',
  'Decoration',
  600.00,
  1800.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'decoration@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Event Styling',
  'Corporate Event Styling',
  'Professional event styling and decoration for corporate events and product launches',
  'Decoration',
  350.00,
  900.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'decoration@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Themed Party Decoration',
  'Themed Party Decoration',
  'Custom themed decoration for birthday parties and celebrations',
  'Decoration',
  200.00,
  600.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'decoration@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Southern Blooms services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding Bouquet Design',
  'Wedding Bouquet Design',
  'Custom wedding bouquets and bridal party flowers',
  'Floral Design',
  150.00,
  400.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'florist@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Event Centerpieces',
  'Event Centerpieces',
  'Floral centerpieces and table arrangements for events',
  'Floral Design',
  80.00,
  200.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'florist@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Floral Arrangements',
  'Corporate Floral Arrangements',
  'Professional floral arrangements for corporate offices and events',
  'Floral Design',
  100.00,
  300.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'florist@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Hawkes Bay Video Productions services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Event Videography',
  'Event Videography',
  'Professional event videography with multiple camera angles and edited highlights',
  'Videography',
  400.00,
  900.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'videography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Wedding Video Package',
  'Wedding Video Package',
  'Complete wedding video package including ceremony, reception, and highlight reel',
  'Videography',
  1500.00,
  3500.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'videography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Video Production',
  'Corporate Video Production',
  'Corporate video production including interviews, b-roll, and professional editing',
  'Videography',
  800.00,
  2000.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'videography@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Manawatu Lighting Solutions services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Stage Lighting Setup',
  'Stage Lighting Setup',
  'Professional stage lighting setup for events and performances',
  'Lighting',
  300.00,
  700.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'lighting@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Ambient Event Lighting',
  'Ambient Event Lighting',
  'Ambient lighting and mood lighting for events and venues',
  'Lighting',
  200.00,
  500.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'lighting@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Special Effects Lighting',
  'Special Effects Lighting',
  'Special effects lighting including color washes, moving lights, and effects',
  'Lighting',
  400.00,
  900.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'lighting@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Nelson Budget Catering services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Casual Event Catering',
  'Casual Event Catering',
  'Affordable catering for casual events, BBQs, and informal gatherings',
  'Catering',
  25.00,
  50.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'catering2@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Corporate Lunch Service',
  'Corporate Lunch Service',
  'Corporate lunch catering with sandwich platters and salads',
  'Catering',
  15.00,
  35.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'catering2@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Morning Tea Service',
  'Morning Tea Service',
  'Morning tea catering with pastries, sandwiches, and beverages',
  'Catering',
  12.00,
  30.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'catering2@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Rotorua Entertainment Group services
INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Live Band Performance',
  'Live Band Performance',
  'Live band performance for events including sound system and stage setup',
  'Entertainment',
  800.00,
  2000.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'entertainment@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Solo Performer',
  'Solo Performer',
  'Solo musician or performer for intimate events and background entertainment',
  'Entertainment',
  200.00,
  500.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'entertainment@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.services (business_profile_id, name, service_name, description, category, price_range_min, price_range_max, is_available, created_at, updated_at)
SELECT 
  bp.id,
  'Interactive Entertainment',
  'Interactive Entertainment',
  'Interactive entertainment including magicians, comedians, and interactive performers',
  'Entertainment',
  300.00,
  800.00,
  true,
  NOW(),
  NOW()
FROM public.users u
INNER JOIN public.business_profiles bp ON bp.user_id = u.id
WHERE u.email = 'entertainment@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Insert portfolio items
INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Corporate Gala Setup', 'Elegant table setup for 200-guest corporate gala event', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3', NULL, '2024-01-15', NOW(), NOW()
FROM public.users u WHERE u.email = 'catering@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Wedding Reception', 'Beautiful wedding reception with custom menu and presentation', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', NULL, '2024-02-20', NOW(), NOW()
FROM public.users u WHERE u.email = 'catering@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Wedding Photography', 'Stunning wedding photography portfolio showcasing various styles', 'https://images.unsplash.com/photo-1519741497674-611481863552', NULL, '2024-03-10', NOW(), NOW()
FROM public.users u WHERE u.email = 'photography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Corporate Event Coverage', 'Professional corporate event photography with candid and posed shots', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2', NULL, '2024-04-05', NOW(), NOW()
FROM public.users u WHERE u.email = 'photography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Wedding DJ Setup', 'Professional DJ setup for wedding reception with lighting', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3', NULL, '2024-05-18', NOW(), NOW()
FROM public.users u WHERE u.email = 'music@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Conference Room', 'Professional conference room setup with AV equipment', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', NULL, '2024-06-12', NOW(), NOW()
FROM public.users u WHERE u.email = 'venue@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Wedding Decoration', 'Elegant wedding decoration and styling transformation', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3', NULL, '2024-07-22', NOW(), NOW()
FROM public.users u WHERE u.email = 'decoration@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Floral Arrangements', 'Beautiful floral arrangements for wedding ceremony', 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa', NULL, '2024-08-08', NOW(), NOW()
FROM public.users u WHERE u.email = 'florist@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Event Videography', 'Professional event videography with cinematic highlights', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', NULL, '2024-09-14', NOW(), NOW()
FROM public.users u WHERE u.email = 'videography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Lighting Design', 'Professional stage lighting design for corporate event', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678', NULL, '2024-10-03', NOW(), NOW()
FROM public.users u WHERE u.email = 'lighting@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio (user_id, title, description, image_url, video_url, event_date, created_at, updated_at)
SELECT u.id, 'Live Band Performance', 'Live band performance at corporate event', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f', NULL, '2024-11-19', NOW(), NOW()
FROM public.users u WHERE u.email = 'entertainment@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Insert testimonials
INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'John Smith', 'john.smith@example.com', 5, 'Excellent catering service! The food was outstanding and the service was professional. Highly recommended for corporate events.', 'Annual Company Gala', '2024-01-15', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'catering@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'Sarah Johnson', 'sarah.j@example.com', 5, 'Amazing photography! They captured every important moment perfectly. The quality was exceptional.', 'Wedding Celebration', '2024-03-10', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'photography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'Mike Brown', 'mike.brown@example.com', 4, 'Great DJ service! The music selection was perfect and kept everyone dancing all night.', 'Wedding Reception', '2024-05-18', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'music@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'Emma Davis', 'emma.davis@example.com', 5, 'Perfect venue for our conference. Professional setup and excellent facilities.', 'Annual Conference', '2024-06-12', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'venue@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'David Wilson', 'david.w@example.com', 4, 'Beautiful decoration work. They transformed our venue into exactly what we envisioned.', 'Wedding Celebration', '2024-07-22', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'decoration@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'Lisa Anderson', 'lisa.a@example.com', 5, 'Outstanding videography! The final video exceeded our expectations and captured the essence of our event perfectly.', 'Corporate Product Launch', '2024-09-14', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'videography@test.eventpros.local'
ON CONFLICT DO NOTHING;

INSERT INTO public.contractor_testimonials (contractor_id, client_name, client_email, rating, comment, event_title, event_date, is_verified, created_at, updated_at)
SELECT u.id, 'Robert Taylor', 'robert.t@example.com', 4, 'Fantastic live entertainment! The band was professional and kept the energy high throughout the event.', 'Corporate Gala', '2024-11-19', true, NOW(), NOW()
FROM public.users u WHERE u.email = 'entertainment@test.eventpros.local'
ON CONFLICT DO NOTHING;

-- Success message
-- Services, portfolio items, and testimonials have been added to test contractors!
