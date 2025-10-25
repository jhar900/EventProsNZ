-- Create pricing FAQ table
-- This migration adds the pricing FAQ system for the pricing page

-- Create pricing FAQ table
CREATE TABLE pricing_faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('pricing', 'billing', 'trial', 'security')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pricing_faq_category ON pricing_faq(category);
CREATE INDEX idx_pricing_faq_display_order ON pricing_faq(display_order);
CREATE INDEX idx_pricing_faq_active ON pricing_faq(is_active);

-- Enable RLS
ALTER TABLE pricing_faq ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active pricing FAQ" ON pricing_faq
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage pricing FAQ" ON pricing_faq
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_pricing_faq_updated_at BEFORE UPDATE ON pricing_faq
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default FAQ data
INSERT INTO pricing_faq (question, answer, category, display_order) VALUES
('Can I change my subscription plan anytime?', 'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle.', 'pricing', 1),
('What payment methods do you accept?', 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual subscriptions. All payments are processed securely through Stripe.', 'billing', 2),
('Is there a free trial available?', 'Yes! We offer a 14-day free trial for both Showcase and Spotlight plans. No credit card required, and you can cancel anytime during the trial period.', 'trial', 3),
('How does the 30-day money-back guarantee work?', 'If you''re not satisfied with your subscription within 30 days, we''ll provide a full refund. Simply contact our support team to request a refund.', 'billing', 4),
('Can I cancel my subscription anytime?', 'Yes, you can cancel your subscription at any time from your account dashboard. Your access will continue until the end of your current billing period.', 'billing', 5),
('What happens to my data if I downgrade?', 'Your data is always preserved. When you downgrade, you''ll keep access to your current features until the end of your billing cycle, then some features may be limited based on your new plan.', 'pricing', 6),
('Do you offer discounts for annual billing?', 'Yes! Annual billing saves you up to 20% compared to monthly billing. The longer the commitment, the bigger the savings.', 'pricing', 7),
('Is my payment information secure?', 'Absolutely. We use industry-standard encryption and are PCI DSS compliant. Your payment information is processed securely through Stripe, and we never store your card details.', 'security', 8),
('What support is included with each plan?', 'Essential includes email support, Showcase includes priority email support, and Spotlight includes priority support plus a dedicated account manager.', 'pricing', 9),
('Can I get a refund if I''m not satisfied?', 'Yes, we offer a 30-day money-back guarantee. If you''re not satisfied with your subscription, contact our support team for a full refund.', 'billing', 10),
('How do I upgrade my plan?', 'You can upgrade your plan anytime from your account dashboard. Upgrades take effect immediately, and you''ll only pay the prorated difference for the remaining billing period.', 'pricing', 11),
('What features are included in the free trial?', 'The free trial includes all features of the plan you choose (Showcase or Spotlight). You get full access to premium features for 14 days with no limitations.', 'trial', 12);
