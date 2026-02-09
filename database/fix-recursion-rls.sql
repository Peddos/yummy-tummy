-- =============================================
-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- =============================================

-- 1. Create a helper function to check for admin status
-- SECURITY DEFINER bypasses RLS for the function's query, breaking the recursion loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update profiles policies to use the new function
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- 3. Update orders policies to use the new function
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR ALL
  USING (is_admin());

-- 4. Fix the visibility policy that triggered the loop
-- We use is_admin() here as well to ensure it doesn't trigger its own check
DROP POLICY IF EXISTS "View profiles involved in orders" ON profiles;
CREATE POLICY "View profiles involved in orders"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    is_admin() OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE (orders.customer_id = profiles.id OR orders.rider_id = profiles.id OR orders.vendor_id = profiles.id)
      AND (orders.customer_id = auth.uid() OR orders.rider_id = auth.uid() OR orders.vendor_id = auth.uid())
    )
  );

-- 5. Repeat for other tables that might have admin checks
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
CREATE POLICY "Admins can view all vendors" ON vendors FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON menu_categories;
CREATE POLICY "Admins can manage categories" ON menu_categories FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (is_admin());
