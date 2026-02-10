-- Add policy to allow anyone to view profiles of vendors and riders
-- This is necessary for customers to see vendor names and riders to see each other if needed

CREATE POLICY "Profiles of vendors and riders are public"
  ON profiles FOR SELECT
  USING (role IN ('vendor', 'rider'));
