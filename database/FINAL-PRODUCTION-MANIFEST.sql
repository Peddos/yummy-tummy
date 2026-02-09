-- ===============================================================
-- FINAL PRODUCTION MANIFEST - THE CORE SECURITY SYSTEM
-- ===============================================================
-- This script is the single source of truth for your database.
-- It wipes all old, fragmented policies and builds a rock-solid,
-- non-recursive security layer for the entire platform.

-- 1. CLEANUP: REMOVE ALL EXISTING POLICIES
-- This ensures no "ghost" rules from previous files interfere.
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. SECURITY HELPERS (Security Definer - Bypasses RLS Loops)
-- These functions run with 'postgres' permissions internally.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. PROFILES Table (The Identity Layer)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: self_access" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Profiles: public_roles" ON profiles FOR SELECT USING (role IN ('vendor', 'rider'));
CREATE POLICY "Profiles: admin_access" ON profiles FOR ALL USING (check_is_admin());
-- Allow visibility of people involved in orders (for names in dash)
CREATE POLICY "Profiles: order_nexus" ON profiles FOR SELECT USING (true); 

-- 4. VENDORS & RIDERS (The Partners)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors: read_for_all" ON vendors FOR SELECT USING (true);
CREATE POLICY "Vendors: owner_manage" ON vendors FOR ALL USING (auth.uid() = id);
CREATE POLICY "Vendors: admin_manage" ON vendors FOR ALL USING (check_is_admin());

ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders: read_for_all" ON riders FOR SELECT USING (true);
CREATE POLICY "Riders: owner_manage" ON riders FOR ALL USING (auth.uid() = id);
CREATE POLICY "Riders: admin_manage" ON riders FOR ALL USING (check_is_admin());

-- 5. MENU SYSTEM (Discovery)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories: read" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Categories: admin" ON menu_categories FOR ALL USING (check_is_admin());

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu: read" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Menu: vendor_manage" ON menu_items FOR ALL USING (vendor_id = auth.uid());
CREATE POLICY "Menu: admin" ON menu_items FOR ALL USING (check_is_admin());

-- 6. ORDERS (The Business Core)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders: admin_access" ON orders FOR ALL USING (check_is_admin());
CREATE POLICY "Orders: customer_access" ON orders FOR ALL 
  USING (customer_id = auth.uid()) 
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Orders: vendor_access" ON orders FOR ALL 
  USING (vendor_id = auth.uid()) 
  WITH CHECK (vendor_id = auth.uid());
CREATE POLICY "Orders: rider_read_ready" ON orders FOR SELECT 
  USING (status = 'ready_for_pickup' AND (rider_id IS NULL OR rider_id = auth.uid()));
CREATE POLICY "Orders: rider_manage_own" ON orders FOR ALL 
  USING (rider_id = auth.uid());
CREATE POLICY "Orders: rider_accept" ON orders FOR UPDATE 
  USING (status = 'ready_for_pickup' AND rider_id IS NULL)
  WITH CHECK (rider_id = auth.uid() AND status = 'assigned_to_rider');

-- 7. ORDER ITEMS (The Details)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items: shared_read" ON order_items FOR SELECT USING (true);
CREATE POLICY "Items: customer_create" ON order_items FOR INSERT WITH CHECK (true);

-- 8. TRANSACTIONS (Money & M-Pesa)
-- FIX: Added INSERT policy for customers to prevent RLS errors during STK push.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transactions: admin" ON transactions FOR ALL USING (check_is_admin());
CREATE POLICY "Transactions: customer_read" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Transactions: customer_create" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Transactions: related_order_access" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND 
    (orders.vendor_id = auth.uid() OR orders.rider_id = auth.uid()))
);

-- 9. SYSTEM SETTINGS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings: public_read" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Settings: admin_manage" ON system_settings FOR ALL USING (check_is_admin());

-- 10. RECOVERY UTILITY (Force Clear Sessions)
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
