-- =============================================
-- PHASE 13: PICKUP VERIFICATION HANDSHAKE
-- =============================================

-- 1. Add pickup_code to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_code TEXT;

-- 2. Update the order status change trigger or create a new one to generate the code
CREATE OR REPLACE FUNCTION generate_pickup_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate code when transitioning TO 'ready_for_pickup'
    IF NEW.status = 'ready_for_pickup' AND (OLD.status IS DISTINCT FROM 'ready_for_pickup') THEN
        -- Generate 4-digit random code
        NEW.pickup_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS tr_generate_pickup_code ON orders;
CREATE TRIGGER tr_generate_pickup_code
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_pickup_code();
