-- =============================================
-- FOOD DELIVERY SYSTEM - DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES & USER ROLES
-- =============================================

-- User roles enum
-- User roles enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'rider', 'admin');
    END IF;
END $$;

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  cuisine_type TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  pending_earnings DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders table
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  pending_earnings DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MENU MANAGEMENT
-- =============================================

-- Menu categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS & TRANSACTIONS
-- =============================================

-- Order status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
          'pending_payment',
          'payment_failed',
          'paid',
          'confirmed',
          'preparing',
          'ready_for_pickup',
          'assigned_to_rider',
          'picked_up',
          'in_transit',
          'delivered',
          'completed',
          'cancelled'
        );
    END IF;
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
  
  -- Order details
  status order_status DEFAULT 'pending_payment',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Delivery information
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  delivery_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENT & TRANSACTIONS
-- =============================================

-- Transaction types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM (
          'customer_payment',
          'vendor_payout',
          'rider_payout',
          'refund',
          'platform_commission'
        );
    END IF;
END $$;

-- Transaction status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM (
          'pending',
          'processing',
          'completed',
          'failed',
          'refunded'
        );
    END IF;
END $$;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  
  -- M-Pesa specific fields
  mpesa_receipt_number TEXT,
  mpesa_transaction_id TEXT,
  phone_number TEXT,
  
  -- Breakdown for escrow
  vendor_share DECIMAL(10, 2),
  rider_share DECIMAL(10, 2),
  platform_commission DECIMAL(10, 2),
  
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- REVIEWS & RATINGS
-- =============================================

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
  
  vendor_rating INTEGER CHECK (vendor_rating >= 1 AND vendor_rating <= 5),
  rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
  
  vendor_comment TEXT,
  rider_comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

-- =============================================
-- LOCATIONS & ADDRESSES
-- =============================================

-- Saved addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g., "Home", "Work"
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Vendors indexes
CREATE INDEX idx_vendors_active ON vendors(is_active);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);

-- Menu items indexes
CREATE INDEX idx_menu_items_vendor ON menu_items(vendor_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);

-- Orders indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Transactions indexes
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_mpesa_receipt ON transactions(mpesa_receipt_number);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for menu_items
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if order_number is not already set (e.g., by the API)
  IF NEW.order_number IS NULL THEN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for order numbers
CREATE SEQUENCE order_number_seq;

-- Trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Function to update vendor rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET 
    rating = (SELECT AVG(vendor_rating) FROM reviews WHERE vendor_id = NEW.vendor_id AND vendor_rating IS NOT NULL),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE vendor_id = NEW.vendor_id AND vendor_rating IS NOT NULL)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vendor rating update
CREATE TRIGGER update_vendor_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  WHEN (NEW.vendor_rating IS NOT NULL)
  EXECUTE FUNCTION update_vendor_rating();

-- Function to update rider rating
CREATE OR REPLACE FUNCTION update_rider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE riders
  SET 
    rating = (SELECT AVG(rider_rating) FROM reviews WHERE rider_id = NEW.rider_id AND rider_rating IS NOT NULL),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE rider_id = NEW.rider_id AND rider_rating IS NOT NULL)
  WHERE id = NEW.rider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rider rating update
CREATE TRIGGER update_rider_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  WHEN (NEW.rider_rating IS NOT NULL)
  EXECUTE FUNCTION update_rider_rating();
