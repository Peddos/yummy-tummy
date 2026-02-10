-- ===============================================================
-- MASTERS SCHEMA & RLS CONSOLIDATION (PRODUCTION READY)
-- ===============================================================
-- This script consolidates all previous fixes into one clean file.
-- It resolves infinite recursion and ensures all data visibility.

-- 1. UTILITY FUNCTIONS (Break Recursion)
-- These use SECURITY DEFINER to bypass RLS for internal checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_involved_with_order(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders 
    WHERE (customer_id = profile_id OR rider_id = profile_id OR vendor_id = profile_id)
    AND (customer_id = auth.uid() OR rider_id = auth.uid() OR vendor_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. RESET POLICIES (Start from a clean slate)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. PROFILES POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: self" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Profiles: admin" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Profiles: public_roles" ON profiles FOR SELECT USING (role IN ('vendor', 'rider'));
CREATE POLICY "Profiles: order_nexus" ON profiles FOR SELECT USING (is_involved_with_order(id));

-- 4. VENDORS POLICIES
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors: public_view" ON vendors FOR SELECT USING (true);
CREATE POLICY "Vendors: self_manage" ON vendors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Vendors: admin_manage" ON vendors FOR ALL USING (is_admin());

-- 5. RIDERS POLICIES
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders: public_view" ON riders FOR SELECT USING (true);
CREATE POLICY "Riders: self_manage" ON riders FOR ALL USING (auth.uid() = id);
CREATE POLICY "Riders: admin_manage" ON riders FOR ALL USING (is_admin());

-- 6. MENU & CATEGORIES POLICIES
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: public_view" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Categories: admin_manage" ON menu_categories FOR ALL USING (is_admin());

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu: public_view" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Menu: vendor_manage" ON menu_items FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Menu: admin_manage" ON menu_items FOR ALL USING (is_admin());

-- 7. ORDERS POLICIES
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders: customer_access" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Orders: customer_create" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Orders: vendor_access" ON orders FOR SELECT USING (vendor_id = auth.uid());
CREATE POLICY "Orders: vendor_update" ON orders FOR UPDATE USING (vendor_id = auth.uid());
CREATE POLICY "Orders: rider_available" ON orders FOR SELECT USING (rider_id IS NULL AND status = 'ready_for_pickup');
CREATE POLICY "Orders: rider_assigned" ON orders FOR ALL USING (rider_id = auth.uid()) WITH CHECK (rider_id = auth.uid());
CREATE POLICY "Orders: rider_accept" ON orders FOR UPDATE USING (rider_id IS NULL AND status = 'ready_for_pickup');
CREATE POLICY "Orders: admin_all" ON orders FOR ALL USING (is_admin());

-- 8. ORDER ITEMS POLICIES
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items: customer_access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Items: customer_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Items: vendor_access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.vendor_id = auth.uid())
);
CREATE POLICY "Items: rider_access" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.rider_id = auth.uid())
);
CREATE POLICY "Items: admin_all" ON order_items FOR ALL USING (is_admin());

-- 9. SYSTEM SETTINGS POLICIES
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings: public_read" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Settings: admin_manage" ON system_settings FOR ALL USING (is_admin());
