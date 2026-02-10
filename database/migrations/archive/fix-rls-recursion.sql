-- =============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- =============================================
-- This fixes the "infinite recursion detected" error
-- by removing recursive admin checks

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can view all riders" ON riders;
DROP POLICY IF EXISTS "Admins can manage categories" ON menu_categories;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

-- For now, we'll handle admin access via service role key in the backend
-- Regular users can only access their own data via the existing policies

-- Optional: If you need admin access, use a function with SECURITY DEFINER
-- or use the service role key from the backend
