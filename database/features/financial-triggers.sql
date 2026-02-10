-- =============================================
-- FINANCIAL PROCESSING TRIGGERS
-- Automatically calculate and update financial breakdowns
-- =============================================

-- Function to get system settings
CREATE OR REPLACE FUNCTION get_system_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT value INTO setting_value
    FROM system_settings
    WHERE key = setting_key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate financial breakdown for an order
CREATE OR REPLACE FUNCTION calculate_financial_breakdown(
    p_order_id UUID,
    OUT vendor_share DECIMAL(10,2),
    OUT rider_share DECIMAL(10,2),
    OUT platform_commission DECIMAL(10,2)
)
AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_delivery_fee DECIMAL(10,2);
    v_commission_rate DECIMAL(5,2);
BEGIN
    -- Get order details
    SELECT subtotal, delivery_fee
    INTO v_subtotal, v_delivery_fee
    FROM orders
    WHERE id = p_order_id;
    
    -- Get commission rate from system settings (default 10%)
    v_commission_rate := COALESCE(
        (get_system_setting('vendor_commission_percentage')::DECIMAL / 100),
        0.10
    );
    
    -- Calculate breakdown
    platform_commission := ROUND(v_subtotal * v_commission_rate, 2);
    vendor_share := ROUND(v_subtotal - platform_commission, 2);
    rider_share := v_delivery_fee;
    
END;
$$ LANGUAGE plpgsql;

-- Function to process order financials when order is delivered
CREATE OR REPLACE FUNCTION process_order_financials()
RETURNS TRIGGER AS $$
DECLARE
    v_vendor_share DECIMAL(10,2);
    v_rider_share DECIMAL(10,2);
    v_platform_commission DECIMAL(10,2);
    v_transaction_id UUID;
BEGIN
    -- Only process when order status changes to 'delivered'
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        
        -- Calculate financial breakdown
        SELECT * INTO v_vendor_share, v_rider_share, v_platform_commission
        FROM calculate_financial_breakdown(NEW.id);
        
        -- Update transaction record with financial breakdown
        UPDATE transactions
        SET 
            vendor_share = v_vendor_share,
            rider_share = v_rider_share,
            platform_commission = v_platform_commission
        WHERE order_id = NEW.id
        RETURNING id INTO v_transaction_id;
        
        -- Update vendor earnings
        UPDATE vendors
        SET 
            total_earnings = COALESCE(total_earnings, 0) + v_vendor_share,
            pending_earnings = COALESCE(pending_earnings, 0) + v_vendor_share
        WHERE id = NEW.vendor_id;
        
        -- Update rider earnings (only if rider is assigned)
        IF NEW.rider_id IS NOT NULL THEN
            UPDATE riders
            SET 
                total_earnings = COALESCE(total_earnings, 0) + v_rider_share,
                pending_earnings = COALESCE(pending_earnings, 0) + v_rider_share
            WHERE id = NEW.rider_id;
        END IF;
        
        -- Log the financial processing
        RAISE NOTICE 'Financial breakdown processed for order %: Vendor=%, Rider=%, Platform=%',
            NEW.id, v_vendor_share, v_rider_share, v_platform_commission;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update transaction financial breakdown when payment completes
CREATE OR REPLACE FUNCTION update_transaction_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_vendor_share DECIMAL(10,2);
    v_rider_share DECIMAL(10,2);
    v_platform_commission DECIMAL(10,2);
BEGIN
    -- Only process when transaction status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Check if financial breakdown is already set
        IF NEW.vendor_share IS NULL OR NEW.rider_share IS NULL OR NEW.platform_commission IS NULL THEN
            
            -- Calculate financial breakdown if order_id exists
            IF NEW.order_id IS NOT NULL THEN
                SELECT * INTO v_vendor_share, v_rider_share, v_platform_commission
                FROM calculate_financial_breakdown(NEW.order_id);
                
                -- Update the transaction with calculated values
                NEW.vendor_share := v_vendor_share;
                NEW.rider_share := v_rider_share;
                NEW.platform_commission := v_platform_commission;
                
                RAISE NOTICE 'Financial breakdown calculated for transaction %: Vendor=%, Rider=%, Platform=%',
                    NEW.id, v_vendor_share, v_rider_share, v_platform_commission;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_process_order_financials ON orders;
DROP TRIGGER IF EXISTS trigger_update_transaction_on_payment ON transactions;

-- Create trigger for order delivery financial processing
CREATE TRIGGER trigger_process_order_financials
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_order_financials();

-- Create trigger for transaction payment completion
CREATE TRIGGER trigger_update_transaction_on_payment
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_on_payment();

-- Log trigger creation
DO $$
BEGIN
    RAISE NOTICE 'Financial processing triggers created successfully';
    RAISE NOTICE '- trigger_process_order_financials: Updates vendor/rider earnings when order delivered';
    RAISE NOTICE '- trigger_update_transaction_on_payment: Calculates financial breakdown on payment completion';
END $$;
