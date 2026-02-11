-- =============================================
-- PHASE 11: CUSTOMER CONFIRMATION FLOW
-- =============================================

-- 1. Add 'arrived' status to the enum
-- Note: This is usually done in a transaction, but some Postgres versions don't allow it.
-- Supabase handles this fine in the SQL Editor.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'arrived' BEFORE 'delivered';

-- 2. Update RLS policies to allow customers to confirm delivery
-- First drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;

CREATE POLICY "Customers can update own orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (
    customer_id = auth.uid() AND
    status = 'delivered'
  );

-- 3. Ensure the financial processing trigger still works correctly
-- (It already triggers on status = 'delivered')
