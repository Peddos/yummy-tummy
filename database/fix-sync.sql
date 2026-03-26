-- =============================================
-- AUTH SYNC FIX & DATABASE RESTORATION (VERSION 2 - ROBUST)
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

-- 4. Re-apply Triggers (Improved with safer casting)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role_text TEXT;
    v_role user_role;
    v_full_name TEXT;
    v_phone TEXT;
BEGIN
    -- Extract role text first to avoid cast errors
    v_role_text := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
    
    -- Safe cast to user_role
    BEGIN
        v_role := v_role_text::user_role;
    EXCEPTION WHEN others THEN
        v_role := 'customer'::user_role;
    END;

    -- Extract metadata
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'business_name',
        'New User'
    );
    
    -- Phone handling (Critical unique constraint)
    v_phone := NEW.raw_user_meta_data->>'phone';
    IF v_phone IS NULL OR v_phone = '' THEN
        v_phone := '0' || floor(random() * 1000000000)::text;
    END IF;

    -- Insert into profiles with conflict handling
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (NEW.id, v_role, v_full_name, v_phone)
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

    -- Specialized roles (with conflict handling)
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
EXCEPTION WHEN others THEN
    -- Fallback to just returning NEW so the AUTH USER at least gets created
    -- The app will handle missing profiles via the manual fallback I added
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure RLS is active & Unrestricted for Demo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active vendors" ON vendors;
CREATE POLICY "Anyone can view active vendors" ON vendors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;
CREATE POLICY "Anyone can view available menu items" ON menu_items FOR SELECT USING (true);

-- 6. Repair any orphaned users
INSERT INTO public.profiles (id, role, full_name, phone)
SELECT 
    id, 
    'customer'::user_role,
    'System User',
    '0' || id::text
FROM auth.users
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Database synchronization and auth triggers have been restored with safety fallback.';
END $$;
