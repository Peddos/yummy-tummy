-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- VENDORS POLICIES
-- =============================================

-- Everyone can view active vendors
CREATE POLICY "Anyone can view active vendors"
  ON vendors FOR SELECT
  USING (is_active = true);

-- Vendors can view their own data
CREATE POLICY "Vendors can view own data"
  ON vendors FOR SELECT
  USING (auth.uid() = id);

-- Vendors can update their own data
CREATE POLICY "Vendors can update own data"
  ON vendors FOR UPDATE
  USING (auth.uid() = id);

-- Vendors can insert their own data
CREATE POLICY "Vendors can insert own data"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all vendors
CREATE POLICY "Admins can view all vendors"
  ON vendors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- RIDERS POLICIES
-- =============================================

-- Riders can view their own data
CREATE POLICY "Riders can view own data"
  ON riders FOR SELECT
  USING (auth.uid() = id);

-- Riders can update their own data
CREATE POLICY "Riders can update own data"
  ON riders FOR UPDATE
  USING (auth.uid() = id);

-- Riders can insert their own data
CREATE POLICY "Riders can insert own data"
  ON riders FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all riders
CREATE POLICY "Admins can view all riders"
  ON riders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- MENU CATEGORIES POLICIES
-- =============================================

-- Everyone can view menu categories
CREATE POLICY "Anyone can view menu categories"
  ON menu_categories FOR SELECT
  USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON menu_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- MENU ITEMS POLICIES
-- =============================================

-- Everyone can view available menu items
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

-- Vendors can view their own menu items
CREATE POLICY "Vendors can view own menu items"
  ON menu_items FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE id = auth.uid()
    )
  );

-- Vendors can insert their own menu items
CREATE POLICY "Vendors can insert own menu items"
  ON menu_items FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE id = auth.uid()
    )
  );

-- Vendors can update their own menu items
CREATE POLICY "Vendors can update own menu items"
  ON menu_items FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE id = auth.uid()
    )
  );

-- Vendors can delete their own menu items
CREATE POLICY "Vendors can delete own menu items"
  ON menu_items FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE id = auth.uid()
    )
  );

-- =============================================
-- ORDERS POLICIES
-- =============================================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can update own orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (
    customer_id = auth.uid() AND
    status = 'delivered'
  );

-- Vendors can view their orders
CREATE POLICY "Vendors can view their orders"
  ON orders FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE id = auth.uid()
    )
  );

-- Vendors can update their own profile
CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    (
      approval_status = (SELECT approval_status FROM vendors WHERE id = auth.uid())
    )
  );

-- Admins can update vendors
CREATE POLICY "Admins can update vendors"
  ON vendors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Riders can view assigned orders
CREATE POLICY "Riders can view assigned orders"
  ON orders FOR SELECT
  USING (
    rider_id = auth.uid() OR
    (status IN ('ready_for_pickup') AND rider_id IS NULL)
  );

-- Riders can update assigned orders
CREATE POLICY "Riders can update assigned orders"
  ON orders FOR UPDATE
  USING (rider_id = auth.uid());

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ORDER ITEMS POLICIES
-- =============================================

-- Users can view order items for their orders
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.uid()
         OR vendor_id = auth.uid()
         OR rider_id = auth.uid()
    )
  );

-- Customers can insert order items
CREATE POLICY "Customers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TRANSACTIONS POLICIES
-- =============================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    user_id = auth.uid() OR
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.uid()
         OR vendor_id = auth.uid()
         OR rider_id = auth.uid()
    )
  );

-- System can insert transactions (via service role)
CREATE POLICY "Service role can manage transactions"
  ON transactions FOR ALL
  USING (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- REVIEWS POLICIES
-- =============================================

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Customers can insert reviews for their orders
CREATE POLICY "Customers can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id = auth.uid() AND status = 'completed'
    )
  );

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews"
  ON reviews FOR UPDATE
  USING (customer_id = auth.uid());

-- =============================================
-- ADDRESSES POLICIES
-- =============================================

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (user_id = auth.uid());
