-- Test data seeding script for Event Pros NZ
-- This script creates sample data for development and testing

-- Insert sample users (these would normally be created through Supabase Auth)
-- Note: In a real scenario, these would be created via the auth system
INSERT INTO public.users (id, email, role, is_verified, last_login) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@eventpros.co.nz', 'admin', true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'john.doe@example.com', 'event_manager', true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'jane.smith@example.com', 'event_manager', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'catering@premiumcatering.co.nz', 'contractor', true, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'photography@snapshots.co.nz', 'contractor', true, NOW()),
  ('66666666-6666-6666-6666-666666666666', 'music@djservices.co.nz', 'contractor', true, NOW()),
  ('77777777-7777-7777-7777-777777777777', 'venue@grandhall.co.nz', 'contractor', true, NOW()),
  ('88888888-8888-8888-8888-888888888888', 'decor@elegantdesigns.co.nz', 'contractor', true, NOW());

-- Insert sample profiles
INSERT INTO public.profiles (user_id, first_name, last_name, phone, address, bio, location, timezone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'User', '+64 21 123 4567', '123 Admin St, Auckland', 'System Administrator', 'Auckland', 'Pacific/Auckland'),
  ('22222222-2222-2222-2222-222222222222', 'John', 'Doe', '+64 21 234 5678', '456 Event St, Wellington', 'Professional Event Manager with 10+ years experience', 'Wellington', 'Pacific/Auckland'),
  ('33333333-3333-3333-3333-333333333333', 'Jane', 'Smith', '+64 21 345 6789', '789 Planning Ave, Christchurch', 'Corporate Events Specialist', 'Christchurch', 'Pacific/Auckland'),
  ('44444444-4444-4444-4444-444444444444', 'Sarah', 'Johnson', '+64 21 456 7890', '321 Catering Lane, Auckland', 'Head Chef and Catering Manager', 'Auckland', 'Pacific/Auckland'),
  ('55555555-5555-5555-5555-555555555555', 'Mike', 'Wilson', '+64 21 567 8901', '654 Photo St, Wellington', 'Professional Event Photographer', 'Wellington', 'Pacific/Auckland'),
  ('66666666-6666-6666-6666-666666666666', 'Lisa', 'Brown', '+64 21 678 9012', '987 Music Ave, Auckland', 'DJ and Music Coordinator', 'Auckland', 'Pacific/Auckland'),
  ('77777777-7777-7777-7777-777777777777', 'David', 'Lee', '+64 21 789 0123', '147 Venue Blvd, Christchurch', 'Venue Manager', 'Christchurch', 'Pacific/Auckland'),
  ('88888888-8888-8888-8888-888888888888', 'Emma', 'Taylor', '+64 21 890 1234', '258 Decor Rd, Wellington', 'Event Decorator and Designer', 'Wellington', 'Pacific/Auckland');

-- Insert sample business profiles
INSERT INTO public.business_profiles (user_id, company_name, description, website, location, service_categories, average_rating, review_count, is_verified, subscription_tier) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Premium Catering Co', 'High-end catering services for corporate and private events', 'https://premiumcatering.co.nz', 'Auckland', ARRAY['Catering', 'Food & Beverage', 'Corporate Events'], 4.8, 45, true, 'professional'),
  ('55555555-5555-5555-5555-555555555555', 'Snapshots Photography', 'Professional event photography and videography services', 'https://snapshots.co.nz', 'Wellington', ARRAY['Photography', 'Videography', 'Event Coverage'], 4.9, 32, true, 'professional'),
  ('66666666-6666-6666-6666-666666666666', 'DJ Services NZ', 'Professional DJ and music services for all occasions', 'https://djservices.co.nz', 'Auckland', ARRAY['Music', 'Entertainment', 'DJ Services'], 4.7, 28, true, 'essential'),
  ('77777777-7777-7777-7777-777777777777', 'Grand Hall Venues', 'Premium event venues in prime locations', 'https://grandhall.co.nz', 'Christchurch', ARRAY['Venues', 'Event Spaces', 'Corporate Events'], 4.6, 52, true, 'enterprise'),
  ('88888888-8888-8888-8888-888888888888', 'Elegant Designs', 'Custom event decoration and design services', 'https://elegantdesigns.co.nz', 'Wellington', ARRAY['Decoration', 'Design', 'Event Styling'], 4.5, 19, false, 'essential');

-- Insert sample events
INSERT INTO public.events (user_id, title, event_type, event_date, end_date, is_multi_day, location, attendee_count, duration_hours, budget, status, description, requirements) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Annual Company Gala', 'Corporate', '2024-12-15 18:00:00+12', '2024-12-15 23:00:00+12', false, 'Auckland Convention Centre', 200, 5.0, 25000.00, 'confirmed', 'Annual company celebration with awards ceremony', 'Professional catering, photography, and entertainment required'),
  ('22222222-2222-2222-2222-222222222222', 'Product Launch Event', 'Corporate', '2024-11-20 14:00:00+12', '2024-11-20 18:00:00+12', false, 'Wellington Town Hall', 150, 4.0, 15000.00, 'planning', 'New product launch with media coverage', 'High-end venue, catering for 150, professional photography'),
  ('33333333-3333-3333-3333-333333333333', 'Wedding Reception', 'Private', '2024-10-05 16:00:00+12', '2024-10-05 22:00:00+12', false, 'Christchurch Gardens', 80, 6.0, 12000.00, 'confirmed', 'Elegant wedding reception', 'Outdoor catering, photography, music, and decoration'),
  ('33333333-3333-3333-3333-333333333333', 'Charity Fundraiser', 'Non-Profit', '2024-09-30 19:00:00+12', '2024-09-30 23:30:00+12', false, 'Auckland Museum', 300, 4.5, 20000.00, 'planning', 'Annual charity fundraising dinner', 'Formal venue, premium catering, entertainment, and auction setup');

-- Insert sample services
INSERT INTO public.services (business_profile_id, name, description, category, price_range_min, price_range_max, is_available) VALUES
  -- Premium Catering Co services
  (1, 'Corporate Catering Package', 'Complete catering solution for corporate events', 'Catering', 50.00, 100.00, true),
  (1, 'Wedding Reception Menu', 'Elegant wedding catering with multiple course options', 'Catering', 80.00, 150.00, true),
  (1, 'Cocktail Party Service', 'Hors d''oeuvres and beverage service', 'Catering', 30.00, 60.00, true),
  
  -- Snapshots Photography services
  (2, 'Event Photography', 'Professional event photography coverage', 'Photography', 200.00, 500.00, true),
  (2, 'Wedding Photography', 'Complete wedding photography package', 'Photography', 800.00, 2000.00, true),
  (2, 'Corporate Headshots', 'Professional headshot photography', 'Photography', 100.00, 200.00, true),
  
  -- DJ Services NZ services
  (3, 'Wedding DJ Service', 'Complete DJ service for weddings', 'Music', 300.00, 600.00, true),
  (3, 'Corporate Event Music', 'Background music for corporate events', 'Music', 200.00, 400.00, true),
  (3, 'Party DJ Package', 'High-energy DJ service for parties', 'Music', 250.00, 500.00, true),
  
  -- Grand Hall Venues services
  (4, 'Conference Room Rental', 'Professional conference room with AV equipment', 'Venues', 200.00, 500.00, true),
  (4, 'Wedding Venue Package', 'Complete wedding venue with catering options', 'Venues', 1000.00, 3000.00, true),
  (4, 'Gala Dinner Hall', 'Elegant hall for formal dinners', 'Venues', 500.00, 1200.00, true),
  
  -- Elegant Designs services
  (5, 'Wedding Decoration', 'Complete wedding decoration service', 'Decoration', 500.00, 1500.00, true),
  (5, 'Corporate Event Styling', 'Professional event styling and decoration', 'Decoration', 300.00, 800.00, true),
  (5, 'Floral Arrangements', 'Custom floral arrangements for events', 'Decoration', 100.00, 300.00, true);

-- Insert sample jobs
INSERT INTO public.jobs (event_id, title, description, requirements, budget_min, budget_max, status, application_deadline) VALUES
  (1, 'Catering for Annual Gala', 'Provide catering services for 200 guests at annual company gala', 'Must have experience with corporate events, health and safety certification required', 8000.00, 12000.00, 'open', '2024-11-30 23:59:59+12'),
  (1, 'Event Photography', 'Professional photography coverage for annual company gala', 'Portfolio required, experience with corporate events, high-quality equipment', 1000.00, 2000.00, 'open', '2024-11-30 23:59:59+12'),
  (2, 'Venue for Product Launch', 'Provide venue for product launch event in Wellington', 'Capacity for 150 guests, AV equipment, professional appearance', 3000.00, 5000.00, 'open', '2024-10-31 23:59:59+12'),
  (3, 'Wedding Photography', 'Complete wedding photography package', 'Portfolio required, experience with outdoor weddings, editing included', 1200.00, 2500.00, 'open', '2024-09-15 23:59:59+12'),
  (4, 'Charity Event Catering', 'Catering for 300 guests at charity fundraiser', 'Formal dining experience, dietary requirements accommodation', 6000.00, 10000.00, 'open', '2024-09-15 23:59:59+12');

-- Insert sample enquiries
INSERT INTO public.enquiries (event_id, contractor_id, status, subject, message) VALUES
  (1, 1, 'pending', 'Catering Inquiry for Annual Gala', 'We are interested in your corporate catering services for our annual gala. Could you provide a quote for 200 guests?'),
  (1, 2, 'accepted', 'Photography Services for Gala', 'We would like to discuss photography services for our annual company gala. Please let us know your availability.'),
  (2, 4, 'pending', 'Venue Inquiry for Product Launch', 'We are looking for a professional venue for our product launch event. Could you provide information about your facilities?'),
  (3, 2, 'accepted', 'Wedding Photography Inquiry', 'We are planning our wedding and would like to discuss photography packages. Could you send us your portfolio?'),
  (4, 1, 'pending', 'Charity Event Catering', 'We are organizing a charity fundraiser and need catering for 300 guests. Could you provide a quote?');

-- Insert sample testimonials
INSERT INTO public.testimonials (event_id, contractor_id, rating, review, is_verified) VALUES
  (1, 1, 5, 'Excellent catering service! The food was outstanding and the service was professional. Highly recommended for corporate events.', true),
  (1, 2, 5, 'Amazing photography! They captured every important moment perfectly. The quality was exceptional.', true),
  (3, 2, 4, 'Great wedding photography service. Professional and friendly team. Very happy with the results.', true),
  (3, 5, 4, 'Beautiful decoration work. They transformed our venue into exactly what we envisioned.', true);

-- Insert sample subscriptions
INSERT INTO public.subscriptions (user_id, tier, status, started_at, expires_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'professional', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('33333333-3333-3333-3333-333333333333', 'professional', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('44444444-4444-4444-4444-444444444444', 'professional', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('55555555-5555-5555-5555-555555555555', 'professional', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('66666666-6666-6666-6666-666666666666', 'essential', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('77777777-7777-7777-7777-777777777777', 'enterprise', 'active', NOW(), NOW() + INTERVAL '1 year'),
  ('88888888-8888-8888-8888-888888888888', 'essential', 'active', NOW(), NOW() + INTERVAL '1 year');

-- Insert sample portfolio items
INSERT INTO public.portfolio_items (business_profile_id, title, description, image_url, category) VALUES
  (1, 'Corporate Gala Setup', 'Elegant table setup for 200-guest corporate event', 'https://example.com/images/corporate-gala.jpg', 'Corporate'),
  (1, 'Wedding Reception', 'Beautiful wedding reception with custom menu', 'https://example.com/images/wedding-reception.jpg', 'Wedding'),
  (2, 'Wedding Photography', 'Stunning wedding photography portfolio', 'https://example.com/images/wedding-photos.jpg', 'Wedding'),
  (2, 'Corporate Event', 'Professional corporate event photography', 'https://example.com/images/corporate-photos.jpg', 'Corporate'),
  (3, 'Wedding DJ Setup', 'Professional DJ setup for wedding reception', 'https://example.com/images/dj-setup.jpg', 'Wedding'),
  (4, 'Conference Room', 'Professional conference room setup', 'https://example.com/images/conference-room.jpg', 'Corporate'),
  (5, 'Wedding Decoration', 'Elegant wedding decoration and styling', 'https://example.com/images/wedding-decoration.jpg', 'Wedding');

-- Insert pricing FAQ data
INSERT INTO public.pricing_faq (question, answer, category, display_order) VALUES
('Can I change my subscription plan anytime?', 'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle.', 'pricing', 1),
('What payment methods do you accept?', 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual subscriptions. All payments are processed securely through Stripe.', 'billing', 2),
('Is there a free trial available?', 'Yes! We offer a 14-day free trial for both Showcase and Spotlight plans. No credit card required, and you can cancel anytime during the trial period.', 'trial', 3),
('How does the annual discount work?', 'Annual subscriptions offer significant savings - up to 2 months free compared to monthly billing. The discount is automatically applied at checkout.', 'pricing', 4),
('Can I cancel my subscription anytime?', 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.', 'billing', 5),
('What happens if I exceed my plan limits?', 'We will notify you if you approach your plan limits. You can upgrade your plan or purchase additional capacity as needed.', 'pricing', 6),
('Is my data secure?', 'Absolutely. We use enterprise-grade security with SSL encryption, PCI DSS compliance, and regular security audits to protect your data.', 'security', 7),
('Do you offer refunds?', 'Yes, we offer a 30-day money-back guarantee for all paid plans. Contact our support team to process your refund.', 'billing', 8),
('Can I get a custom plan for my business?', 'Yes, we offer custom enterprise plans for large organizations. Contact our sales team to discuss your specific needs.', 'pricing', 9),
('What support is included?', 'All plans include email support. Showcase and Spotlight plans include priority support with faster response times.', 'billing', 10);

-- Insert pricing testimonials data
INSERT INTO public.platform_testimonials (user_id, rating, feedback, category, status, is_verified, is_public, approved_at) VALUES
('44444444-4444-4444-4444-444444444444', 5, 'The Showcase plan has transformed my business. I get 3x more inquiries and my profile stands out from the competition. The investment paid for itself in the first month!', 'contractor', 'approved', true, true, NOW()),
('55555555-5555-5555-5555-555555555555', 5, 'Spotlight tier gives me everything I need to showcase my work professionally. The unlimited portfolio and priority placement have been game-changers for my photography business.', 'contractor', 'approved', true, true, NOW()),
('66666666-6666-6666-6666-666666666666', 4, 'Even the Essential plan helped me get started. The free trial let me test the platform before committing, and I quickly saw the value in upgrading.', 'contractor', 'approved', true, true, NOW()),
('77777777-7777-7777-7777-777777777777', 5, 'The analytics on the Showcase plan help me understand my clients better. I can see exactly what services they are looking for and tailor my offerings accordingly.', 'contractor', 'approved', true, true, NOW()),
('88888888-8888-8888-8888-888888888888', 5, 'Spotlight tier is worth every penny. The custom branding and advanced matching features have helped me land high-end clients I never would have reached otherwise.', 'contractor', 'approved', true, true, NOW());