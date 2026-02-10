-- Allow riders and vendors to see customer profiles for their orders
CREATE POLICY "View profiles involved in orders"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE (orders.customer_id = profiles.id OR orders.rider_id = profiles.id OR orders.vendor_id = profiles.id)
      AND (orders.customer_id = auth.uid() OR orders.rider_id = auth.uid() OR orders.vendor_id = auth.uid())
    )
  );

-- Also ensure menu_items are visible to riders for order tracking
DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;
CREATE POLICY "Riders and everyone can view menu items"
  ON menu_items FOR SELECT
  USING (true);
