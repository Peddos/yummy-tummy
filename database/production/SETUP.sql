-- =============================================
-- PRODUCTION DATABASE SETUP
-- Complete setup script for fresh database
-- =============================================
-- 
-- This script sets up the entire database from scratch.
-- Run this on a fresh Supabase project.
--
-- Usage:
--   1. Open Supabase SQL Editor
--   2. Copy and paste this entire file
--   3. Execute
--
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CORE SCHEMA
-- =============================================

\echo 'Creating database schema...'

-- Run schema creation
\i ../core/01-schema.sql

-- =============================================
-- 2. ROW LEVEL SECURITY POLICIES
-- =============================================

\echo 'Setting up Row Level Security...'

-- Run RLS policies
\i ../core/02-rls-policies.sql

-- =============================================
-- 3. CORE TRIGGERS & FUNCTIONS
-- =============================================

\echo 'Creating core triggers...'

-- Run core triggers (auto-profile, order numbering)
\i ../core/03-triggers.sql

-- =============================================
-- 4. FEATURE: NOTIFICATIONS
-- =============================================

\echo 'Setting up notifications system...'

-- Run notifications setup
\i ../features/notifications.sql

-- =============================================
-- 5. FEATURE: FINANCIAL PROCESSING
-- =============================================

\echo 'Setting up financial processing...'

-- Run financial triggers
\i ../features/financial-triggers.sql

-- =============================================
-- 6. FEATURE: BUSINESS CATEGORIES
-- =============================================

\echo 'Setting up business categories...'

-- Run business categories
\i ../features/business-categories.sql

-- =============================================
-- 7. SYSTEM SETTINGS
-- =============================================

\echo 'Configuring system settings...'

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('delivery_fee', '1', 'Delivery fee in KSh (1 for sandbox, adjust for production)')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

INSERT INTO system_settings (key, value, description) VALUES
    ('vendor_commission_percentage', '10', 'Platform commission percentage from vendor sales')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- =============================================
-- 8. VERIFICATION
-- =============================================

\echo 'Verifying setup...'

-- Check tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Created % tables', table_count;
END $$;

-- Check triggers exist
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    RAISE NOTICE 'Created % triggers', trigger_count;
END $$;

-- =============================================
-- SETUP COMPLETE
-- =============================================

\echo ''
\echo '✅ Database setup complete!'
\echo ''
\echo 'Next steps:'
\echo '1. Verify your environment variables (MPESA_CALLBACK_URL, etc.)'
\echo '2. Deploy your application to Vercel'
\echo '3. Test the complete order flow'
\echo ''
\echo 'Optional: Load sample data for testing'
\echo '  \\i ../seeds/sample-data.sql'
\echo ''
