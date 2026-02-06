-- Sample menu categories
INSERT INTO menu_categories (name, description) VALUES
  ('Appetizers', 'Start your meal with these delicious appetizers'),
  ('Main Course', 'Hearty main dishes'),
  ('Desserts', 'Sweet treats to end your meal'),
  ('Beverages', 'Refreshing drinks'),
  ('Fast Food', 'Quick and tasty meals');

-- Note: To add sample data, you'll need to:
-- 1. Create user accounts through the signup page
-- 2. The system will automatically create profiles, vendors, and riders
-- 3. Vendors can then add menu items through their dashboard
-- 4. Customers can place orders
-- 5. Riders can accept deliveries

-- For testing, you can manually insert test data after creating users:

-- Example: Insert a test vendor (replace UUID with actual user ID from auth.users)
-- INSERT INTO vendors (id, business_name, address, cuisine_type) VALUES
--   ('your-user-uuid-here', 'Test Restaurant', '123 Main St, Nairobi', 'Italian');

-- Example: Insert test menu items (replace vendor_id with actual vendor UUID)
-- INSERT INTO menu_items (vendor_id, category_id, name, description, price, is_available) VALUES
--   ('vendor-uuid', (SELECT id FROM menu_categories WHERE name = 'Main Course'), 'Margherita Pizza', 'Classic pizza with tomato and mozzarella', 850.00, true),
--   ('vendor-uuid', (SELECT id FROM menu_categories WHERE name = 'Beverages'), 'Coca Cola', 'Refreshing soft drink', 100.00, true);
