-- 1. Expanded Profile Visibility
-- Allow riders and vendors to see profiles involved in their orders
DROP POLICY IF EXISTS "View profiles involved in orders" ON profiles;
CREATE POLICY "View profiles involved in orders"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE (orders.customer_id = profiles.id OR orders.rider_id = profiles.id OR orders.vendor_id = profiles.id)
      AND (orders.customer_id = auth.uid() OR orders.rider_id = auth.uid() OR orders.vendor_id = auth.uid())
    )
  );

-- 2. Vendor Visibility for Riders
-- Allow riders to see vendor details for orders they are delivering OR orders available for pickup
DROP POLICY IF EXISTS "Riders can view pickup vendors" ON vendors;
CREATE POLICY "Riders can view pickup vendors"
  ON vendors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.vendor_id = vendors.id
      AND (
        orders.rider_id = auth.uid() OR 
        (orders.rider_id IS NULL AND orders.status = 'ready_for_pickup')
      )
    )
  );

-- 3. Cleanup Legacy Fees (Testing Only)
-- Set all existing orders to KSH 1 to match new sandbox settings
UPDATE orders 
SET delivery_fee = 1, total = subtotal + 1
WHERE delivery_fee = 100;
