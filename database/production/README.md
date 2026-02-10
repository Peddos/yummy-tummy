# Database Setup Guide

## Quick Start (Production)

### For Fresh Database

Run the complete setup in Supabase SQL Editor:

```sql
-- Copy and paste the contents of production/SETUP.sql
-- into the Supabase SQL Editor and execute
```

Or if using psql:

```bash
psql -h your-supabase-host -U postgres -d postgres -f database/production/SETUP.sql
```

### For Existing Database

If you already have the database set up and just need the financial triggers:

```sql
-- Run only the financial triggers
\i database/features/financial-triggers.sql
```

---

## Folder Structure

```
database/
├── core/                          # Essential database components
│   ├── 01-schema.sql             # Tables, enums, indexes
│   ├── 02-rls-policies.sql       # Row Level Security
│   └── 03-triggers.sql           # Core automation triggers
│
├── features/                      # Feature-specific functionality
│   ├── notifications.sql         # Notification system
│   ├── financial-triggers.sql    # Financial processing (NEW)
│   └── business-categories.sql   # Menu categories
│
├── seeds/                         # Sample/test data
│   ├── sample-data.sql           # Test data
│   └── map-coordinates.sql       # Location data
│
├── production/                    # Production deployment
│   ├── SETUP.sql                 # Complete setup script
│   └── README.md                 # This file
│
└── migrations/                    # Historical changes
    └── archive/                  # Old fix files (reference only)
```

---

## Development Workflow

### 1. Local Development with Sample Data

```bash
# Setup database
psql -f database/production/SETUP.sql

# Load sample data
psql -f database/seeds/sample-data.sql
psql -f database/seeds/map-coordinates.sql
```

### 2. Adding New Features

Create feature-specific SQL files in `database/features/` and add them to `production/SETUP.sql`.

### 3. Database Migrations

For schema changes:
1. Update `database/core/01-schema.sql`
2. Create migration script in `database/migrations/`
3. Test on development database
4. Apply to production

---

## What Each File Does

### Core Files

**01-schema.sql**
- Creates all tables (users, orders, vendors, riders, etc.)
- Defines enums (order_status, transaction_status, etc.)
- Sets up indexes for performance

**02-rls-policies.sql**
- Configures Row Level Security
- Ensures users can only access their own data
- Defines admin access policies

**03-triggers.sql**
- Auto-creates user profiles on signup
- Auto-increments order numbers
- Core automation logic

### Feature Files

**financial-triggers.sql** ⭐ **NEW**
- Calculates financial breakdown (vendor/rider/platform split)
- Updates earnings when orders are delivered
- Ensures transaction data integrity

**notifications.sql**
- Notification system tables and functions
- Real-time notification delivery

**business-categories.sql**
- Menu item categories
- Category management

---

## Common Tasks

### Reset Database (Development Only)

```sql
-- WARNING: This deletes all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run SETUP.sql again
\i database/production/SETUP.sql
```

### Check Database Health

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- List all triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Verify Financial System

```sql
-- Check if financial triggers exist
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%financial%';

-- Test financial calculation
SELECT * FROM calculate_financial_breakdown('<order-id>');
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Solution**: Run the complete SETUP.sql file

### Issue: "permission denied"

**Solution**: Ensure you're using the service role key or postgres user

### Issue: Triggers not firing

**Solution**: 
```sql
-- Check if triggers exist
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Recreate triggers
\i database/core/03-triggers.sql
\i database/features/financial-triggers.sql
```

---

## Production Deployment Checklist

- [ ] Run `production/SETUP.sql` on fresh database
- [ ] Verify all tables created
- [ ] Verify all triggers created
- [ ] Update system_settings for production values
- [ ] Test order creation → payment → delivery flow
- [ ] Run financial audit: `GET /api/admin/financial-audit`
- [ ] Verify M-Pesa callback URL is correct

---

## Need Help?

Check the main project README or review the implementation plan in the brain artifacts.
