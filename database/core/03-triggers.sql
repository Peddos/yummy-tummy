-- =============================================
-- CORE TRIGGERS & FUNCTIONS
-- Essential database automation
-- =============================================

-- ============================================
-- AUTO PROFILE CREATION
-- ============================================

-- Function to auto-create user profiles based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile in appropriate table based on metadata
    IF NEW.raw_user_meta_data->>'role' = 'vendor' THEN
        INSERT INTO public.vendors (id, business_name, email)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'New Vendor'), NEW.email);
    ELSIF NEW.raw_user_meta_data->>'role' = 'rider' THEN
        INSERT INTO public.riders (id, email)
        VALUES (NEW.id, NEW.email);
    ELSE
        INSERT INTO public.customers (id, full_name, email)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'), NEW.email);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profiles on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ORDER NUMBER INCREMENT
-- ============================================

-- Function to generate incremental order numbers
CREATE OR REPLACE FUNCTION increment_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := COALESCE(
        (SELECT MAX(order_number) FROM orders) + 1,
        1000
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment order numbers
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION increment_order_number();

-- ============================================
-- LOGGING
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Core triggers created successfully';
    RAISE NOTICE '- Auto profile creation trigger';
    RAISE NOTICE '- Order number increment trigger';
END $$;
