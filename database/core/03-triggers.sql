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
DECLARE
    v_role user_role;
    v_full_name TEXT;
    v_phone TEXT;
BEGIN
    -- 1. Extract and map the role
    v_role := (COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))::user_role;
    
    -- 2. Extract common fields
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'business_name',
        'New User'
    );
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000');

    -- 3. Create the base profile first (Critical Fix)
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (NEW.id, v_role, v_full_name, v_phone)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Create specialized profile based on role
    IF v_role = 'vendor' THEN
        INSERT INTO public.vendors (id, business_name, address)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'business_name', 'New Vendor'),
            COALESCE(NEW.raw_user_meta_data->>'address', 'Pending Address')
        )
        ON CONFLICT (id) DO NOTHING;
    ELSIF v_role = 'rider' THEN
        INSERT INTO public.riders (id, vehicle_type)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'Bike')
        )
        ON CONFLICT (id) DO NOTHING;
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
-- ORDER INITIALIZATION (NUMBERING & PICKUP CODES)
-- ============================================

CREATE OR REPLACE FUNCTION handle_order_initialization()
RETURNS TRIGGER AS $$
BEGIN
    -- Set order number on insert
    IF TG_OP = 'INSERT' THEN
        NEW.order_number := 'ORD-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 8));
    END IF;

    -- Generate pickup code when status changes to ready_for_pickup
    IF TG_OP = 'UPDATE' AND NEW.status = 'ready_for_pickup' AND (OLD.status IS DISTINCT FROM 'ready_for_pickup') THEN
        NEW.pickup_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_order_initialization ON orders;
CREATE TRIGGER tr_order_initialization
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_initialization();

DO $$
BEGIN
    RAISE NOTICE 'Core triggers created successfully';
    RAISE NOTICE '- Auto profile creation trigger';
    RAISE NOTICE '- Order initialization trigger (numbering & pickup codes)';
END $$;
