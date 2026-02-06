# Food Delivery System - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free)
- M-Pesa Daraja API credentials (sandbox)

## Setup Steps

### 1. Install Dependencies
```bash
cd food-delivery-system
npm install
```

### 2. Supabase Setup
1. Go to https://supabase.com and create account
2. Create new project
3. Go to SQL Editor and run these files in order:
   - `database/schema.sql`
   - `database/rls-policies.sql`
   - `database/sample-data.sql`
4. Go to Project Settings → API and copy:
   - Project URL
   - anon/public key
   - service_role key

### 3. M-Pesa Setup (Sandbox)
1. Go to https://developer.safaricom.co.ke
2. Create account and login
3. Create new app
4. Copy credentials:
   - Consumer Key
   - Consumer Secret
   - Business Short Code
   - Passkey

### 4. Environment Variables
```bash
# Copy example file
cp .env.local.example .env.local

# Edit .env.local with your credentials
```

### 5. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Testing the System

### Create Test Accounts
1. **Vendor Account**:
   - Go to http://localhost:3000
   - Click "Vendor" card
   - Sign up with business details
   - Add menu items in dashboard

2. **Customer Account**:
   - Sign up as customer
   - Browse vendors
   - Add items to cart
   - Place order (use M-Pesa sandbox number)

3. **Rider Account**:
   - Sign up as rider
   - View available orders
   - Accept delivery
   - Update delivery status

## Common Issues

### npm install fails
- Make sure Node.js 18+ is installed
- Try: `npm cache clean --force`
- Delete `node_modules` and try again

### Supabase connection error
- Verify environment variables are correct
- Check Project URL format (should include https://)
- Ensure RLS policies are applied

### M-Pesa sandbox not working
- Use test credentials from Daraja portal
- For local testing, use ngrok for callback URL
- Check Daraja dashboard for error logs

## Next Steps

After setup, you need to build:
1. Customer dashboard (vendor listings, cart, checkout)
2. Vendor dashboard (menu management, orders)
3. Rider dashboard (deliveries, earnings)
4. Admin dashboard (platform overview)

See `walkthrough.md` for detailed implementation guide.

## Support

- Check README.md for full documentation
- Review database schema in `database/schema.sql`
- See M-Pesa integration in `lib/mpesa/daraja.ts`
