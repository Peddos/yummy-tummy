-- ===============================================================
-- FINAL FIX: Breaking the Profiles <-> Orders Loop
-- ===============================================================

-- 1. DROP ALL POTENTIAL CONFLICTING POLICIES FIRST
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "View profiles involved in orders" ON profiles;
DROP POLICY IF EXISTS "Profiles of vendors and riders are public" ON profiles;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Vendors can view their orders" ON orders;
DROP POLICY IF EXISTS "Riders can view assigned orders" ON orders;

-- 2. CREATE SECURITY DEFINER HELPERS
-- These functions run as 'postgres' and BYPASS RLS, breaking the recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_involved_in_order(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders 
    WHERE (customer_id = profile_id OR rider_id = profile_id OR vendor_id = profile_id)
    AND (customer_id = auth.uid() OR rider_id = auth.uid() OR vendor_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. RE-IMPLEMENT PROFILES POLICIES
CREATE POLICY "Profiles self visibility" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles admin visibility" ON profiles FOR SELECT USING (check_is_admin());
CREATE POLICY "Profiles public roles visibility" ON profiles FOR SELECT USING (role IN ('vendor', 'rider'));
CREATE POLICY "Profiles order involvement visibility" ON profiles FOR SELECT USING (check_is_involved_in_order(id));

-- 4. RE-IMPLEMENT ORDERS POLICIES (Simplified to avoid cross-table lookups)
CREATE POLICY "Orders admin visibility" ON orders FOR ALL USING (check_is_admin());
CREATE POLICY "Orders customer visibility" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Orders rider visibility" ON orders FOR SELECT USING (rider_id = auth.uid() OR (rider_id IS NULL AND status = 'ready_for_pickup'));
CREATE POLICY "Orders vendor visibility" ON orders FOR SELECT USING (vendor_id = auth.uid()); -- Assumes vendor_id in orders table matches profile ID

-- 5. FIX VENDORS POLICY (Sometimes vendor_id refers to the vendor entry, not profile)
-- Ensure vendors table is accessible to riders
DROP POLICY IF EXISTS "Anyone can view active vendors" ON vendors;
CREATE POLICY "Anyone can view active vendors" ON vendors FOR SELECT USING (true);
