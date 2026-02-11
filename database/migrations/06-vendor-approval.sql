-- =============================================
-- PHASE 12: VENDOR APPROVAL SYSTEM
-- =============================================

-- 1. Create vendor_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status') THEN
        CREATE TYPE vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
    END IF;
END $$;

-- 2. Add approval_status to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS approval_status vendor_status DEFAULT 'pending';

-- 3. Update RLS policies for vendors
-- Prevent vendors from approving themselves
DROP POLICY IF EXISTS "Vendors can update own profile" ON vendors;

CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    (
      -- Can't change approval_status if they aren't admin
      approval_status = (SELECT approval_status FROM vendors WHERE id = auth.uid())
    )
  );

-- Admins can update everything
DROP POLICY IF EXISTS "Admins can update vendors" ON vendors;
CREATE POLICY "Admins can update vendors"
  ON vendors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
