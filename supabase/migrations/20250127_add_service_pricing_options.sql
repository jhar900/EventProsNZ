-- Add pricing options to services table
-- This allows services to have flexible pricing display options:
-- - Hide price completely
-- - Contact for pricing
-- - Free service
-- - Exact price
-- - Price range (existing)

-- Add new pricing option columns
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS hide_price BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contact_for_pricing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS exact_price DECIMAL(10,2);

-- Add constraint to ensure only one pricing option is set at a time
-- (hide_price, contact_for_pricing, is_free are mutually exclusive with exact_price/price_range)
-- Note: We allow multiple flags but the UI logic will handle the display priority
-- Priority: is_free > contact_for_pricing > hide_price > exact_price > price_range

-- Add constraint to ensure exact_price is positive if set
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'services'
        AND constraint_name = 'valid_exact_price'
    ) THEN
        ALTER TABLE public.services
        ADD CONSTRAINT valid_exact_price 
          CHECK (exact_price IS NULL OR exact_price >= 0);
    END IF;
END $$;

-- Add hourly and daily rate columns
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2);

-- Add constraint to ensure rates are positive if set
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'services'
        AND constraint_name = 'valid_hourly_rate'
    ) THEN
        ALTER TABLE public.services
        ADD CONSTRAINT valid_hourly_rate 
          CHECK (hourly_rate IS NULL OR hourly_rate >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'services'
        AND constraint_name = 'valid_daily_rate'
    ) THEN
        ALTER TABLE public.services
        ADD CONSTRAINT valid_daily_rate 
          CHECK (daily_rate IS NULL OR daily_rate >= 0);
    END IF;
END $$;

-- Update existing services: if price_range_min and price_range_max are both NULL,
-- and no pricing flags are set, default to contact_for_pricing = true
UPDATE public.services
SET contact_for_pricing = TRUE
WHERE hide_price = FALSE
  AND contact_for_pricing = FALSE
  AND is_free = FALSE
  AND exact_price IS NULL
  AND price_range_min IS NULL
  AND price_range_max IS NULL;

