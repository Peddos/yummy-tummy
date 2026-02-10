-- Fix Rider Update Policy to allow taking available orders
DROP POLICY IF EXISTS "Riders can update assigned orders" ON orders;

CREATE POLICY "Riders can update orders"
  ON orders FOR UPDATE
  USING (
    rider_id = auth.uid() OR 
    (rider_id IS NULL AND status = 'ready_for_pickup')
  )
  WITH CHECK (
    rider_id = auth.uid()
  );
