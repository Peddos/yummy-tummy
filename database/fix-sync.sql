-- =============================================
-- AUTH SYNC FIX & DATABASE RESTORATION
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure Types (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'rider', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status') THEN
        CREATE TYPE vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
    END IF;
END $$;

-- 3. Re-verify Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Re-apply Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role;
    v_full_name TEXT;
    v_phone TEXT;
BEGIN
    -- Extract role and metadata
    v_role := (COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))::user_role;
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'business_name',
        'New User'
    );
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '0' || floor(random() * 1000000000)::text); -- Fallback for phone

    -- Insert into profiles
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (NEW.id, v_role, v_full_name, v_phone)
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

    -- Specialized roles
    IF v_role = 'vendor' THEN
        INSERT INTO public.vendors (id, business_name, address)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'business_name', 'New Vendor'),
            COALESCE(NEW.raw_user_meta_data->>'address', 'Pending Address')
        ) ON CONFLICT (id) DO NOTHING;
    ELSIF v_role = 'rider' THEN
        INSERT INTO public.riders (id, vehicle_type)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'Bike')
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure RLS is active and correct
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view active vendors" ON vendors;
CREATE POLICY "Anyone can view active vendors" ON vendors FOR SELECT USING (is_active = true);

-- 6. Payout / Earnings fields (Ensuring they exist)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL(12, 2) DEFAULT 0;

-- 7. Sync existing users (Repair step)
INSERT INTO public.profiles (id, role, full_name, phone)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'role', 'customer')::user_role,
    COALESCE(raw_user_meta_data->>'full_name', 'System User'),
    COALESCE(raw_user_meta_data->>'phone', '0' || id::text) -- Temporary unique phone if missing
FROM auth.users
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE 'Database synchronization and auth triggers have been restored.';
