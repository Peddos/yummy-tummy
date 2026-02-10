# Food Delivery System - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Create `.env.local` with these required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# M-Pesa Configuration (CRITICAL!)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode_or_till_number
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/mpesa/callback
MPESA_ENVIRONMENT=sandbox  # Change to 'production' when ready
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline  # or CustomerBuyGoodsOnline for Till

# Optional
NODE_ENV=production
```

### 2. Database Setup

#### Option A: Fresh Database

1. Open Supabase SQL Editor
2. Copy contents of `database/production/SETUP.sql`
3. Execute the script
4. Verify tables and triggers created

#### Option B: Existing Database (Add Financial Triggers Only)

```sql
-- Run only the new financial triggers
\i database/features/financial-triggers.sql
```

### 3. Verify M-Pesa Configuration

**CRITICAL**: Ensure callback URL matches exactly:
- In `.env`: `MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/mpesa/callback`
- In Daraja Portal: Same URL registered

### 4. Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Production-ready: organized codebase and financial fixes"
git push origin main

# Vercel will auto-deploy
```

### 5. Post-Deployment Verification

#### Test Order Flow

1. **Create Order** (as customer)
   - Select vendor and menu items
   - Proceed to checkout

2. **Pay with M-Pesa**
   - Complete STK push
   - Verify payment confirmation

3. **Vendor Confirms**
   - Log in as vendor
   - Confirm and prepare order

4. **Rider Delivers**
   - Log in as rider
   - Accept order
   - Mark as delivered

5. **Verify Financials**
   - Check admin dashboard
   - Run financial audit: `GET /api/admin/financial-audit`
   - Verify earnings updated

---

## Database Structure

```
database/
├── core/                      # Essential components
│   ├── 01-schema.sql         # Tables and enums
│   ├── 02-rls-policies.sql   # Security policies
│   └── 03-triggers.sql       # Core automation
│
├── features/                  # Feature modules
│   ├── financial-triggers.sql  # NEW: Money processing
│   ├── notifications.sql
│   └── business-categories.sql
│
├── seeds/                     # Test data
│   ├── sample-data.sql
│   └── map-coordinates.sql
│
└── production/                # Deployment
    ├── SETUP.sql             # Complete setup script
    └── README.md             # Database documentation
```

---

## Key Features

### ✅ Order Tracking System
- Real-time status updates
- Customer order tracking page
- Vendor order management
- Rider delivery workflow

### ✅ Financial Processing System (NEW)
- Automatic financial breakdown calculation
- Vendor/rider earnings tracking
- Platform commission tracking
- M-Pesa payment integration
- Financial audit endpoint

### ✅ User Roles
- **Customer**: Browse, order, track
- **Vendor**: Manage menu, process orders
- **Rider**: Accept deliveries, update status
- **Admin**: System oversight, financial monitoring

---

## API Endpoints

### Customer
- `POST /api/orders` - Create order
- `GET /api/orders` - Get customer orders
- `POST /api/checkout/stk-push` - Initiate M-Pesa payment

### Vendor
- `GET /api/vendor/orders` - Get vendor orders
- `PATCH /api/vendor/orders/[id]` - Update order status

### Rider
- `GET /api/rider/orders` - Get available orders
- `PATCH /api/rider/orders/[id]` - Accept/update delivery

### Admin
- `GET /api/admin/financial-audit` - Financial health check
- `POST /api/admin/financial-audit` - Repair financial data

### M-Pesa
- `POST /api/mpesa/callback` - Payment callback (Safaricom)

---

## Troubleshooting

### Issue: M-Pesa callback not received

**Check**:
1. Callback URL in `.env` matches Daraja portal
2. App is publicly accessible (not localhost)
3. Review Vercel function logs

**Solution**:
```bash
# View logs in Vercel dashboard
# Or use Vercel CLI
vercel logs
```

### Issue: Financial breakdown missing

**Solution**:
```bash
# Run repair endpoint
curl -X POST https://your-domain.vercel.app/api/admin/financial-audit \
  -H "Content-Type: application/json" \
  -d '{"action": "recalculate_all"}'
```

### Issue: Database triggers not firing

**Solution**:
```sql
-- Verify triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Recreate if missing
\i database/features/financial-triggers.sql
```

---

## Monitoring

### Financial Health Check

```bash
curl https://your-domain.vercel.app/api/admin/financial-audit
```

Expected response:
```json
{
  "health_status": "HEALTHY",
  "summary": {
    "missing_financial_breakdown": 0,
    "vendor_discrepancies": 0,
    "rider_discrepancies": 0
  }
}
```

### Database Health

```sql
-- Check table counts
SELECT 
  'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'riders', COUNT(*) FROM riders;
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database setup complete
- [ ] M-Pesa callback URL verified
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Test order flow end-to-end
- [ ] Financial audit shows HEALTHY
- [ ] Admin dashboard accessible
- [ ] Mobile responsiveness verified

---

## Support

For issues or questions, review:
- `database/production/README.md` - Database documentation
- `walkthrough.md` - Money processing system details
- Vercel logs for runtime errors
- Supabase logs for database errors
