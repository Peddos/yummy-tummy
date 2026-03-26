-- =============================================
-- EMERGENCY FIX: DISABLE BROKEN TRIGGER
-- Run this in your Supabase SQL Editor NOW
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- That's it. This will let you sign up immediately.
-- My code will handle the profile creation manually.
