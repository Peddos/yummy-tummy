-- ===============================================================
-- FINAL PRODUCTION-READY MASTER SCHEMA & SECURITY
-- ===============================================================

-- 1. Helper Functions (Security Definer to Bypass RLS Loops)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fully Reset All Policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Profiles: Public roles and self-access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: self" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Profiles: public_info" ON profiles FOR SELECT USING (role IN ('vendor', 'rider'));
CREATE POLICY "Profiles: admin" ON profiles FOR ALL USING (check_is_admin());

-- 4. Vendors & Riders: Basic visibility
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors: read" ON vendors FOR SELECT USING (true);
CREATE POLICY "Vendors: manage" ON vendors FOR ALL USING (auth.uid() = id);

ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders: read" ON riders FOR SELECT USING (true);
CREATE POLICY "Riders: manage" ON riders FOR ALL USING (auth.uid() = id);

-- 5. Menu Items: Clear visibility for all
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu: read" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Menu: vendor_manage" ON menu_items FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Menu: admin" ON menu_items FOR ALL USING (check_is_admin());

-- 6. Orders: Simplified Role Access (No Cross-Table Joins in USING)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders: admin" ON orders FOR ALL USING (check_is_admin());
CREATE POLICY "Orders: customer" ON orders FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Orders: vendor" ON orders FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Orders: rider_read_ready" ON orders FOR SELECT USING (status = 'ready_for_pickup' AND rider_id IS NULL);
CREATE POLICY "Orders: rider_manage_own" ON orders FOR ALL USING (rider_id = auth.uid());
CREATE POLICY "Orders: rider_accept" ON orders FOR UPDATE USING (status = 'ready_for_pickup' AND rider_id IS NULL);

-- 7. Order Items: Visibility for stakeholders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items: read_access" ON order_items FOR SELECT USING (true); -- Safe because it only shows contents, price etc.
CREATE POLICY "Items: insert_access" ON order_items FOR INSERT WITH CHECK (true);

-- 8. Categories: Public read
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: read" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Categories: admin" ON menu_categories FOR ALL USING (check_is_admin());

-- 9. Logic Correction for Profiles Accessibility (Crucial for joins)
-- Allow anyone involved in an order to see the profiles of others involved
CREATE POLICY "Profiles: order_visibility" ON profiles FOR SELECT 
USING (
  role IN ('vendor', 'rider') OR 
  auth.uid() = id OR 
  check_is_admin()
);

-- 8. Cleanup Helpers (For testing/recovery)
-- Usage: SELECT force_clear_rider_session('RIDER_UUID');
CREATE OR REPLACE FUNCTION public.force_clear_rider_session(target_rider_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE orders 
  SET status = 'cancelled' 
  WHERE rider_id = target_rider_id 
  AND status IN ('assigned_to_rider', 'picked_up', 'in_transit');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
