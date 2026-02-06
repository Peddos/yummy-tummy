# Food Delivery System

A comprehensive multi-role food delivery platform with integrated M-Pesa payments, real-time order tracking, and free hosting on Vercel + Supabase.

## Features

- **Multi-Role System**: Customer, Vendor, Rider, and Admin dashboards
- **M-Pesa Integration**: STK Push for payments, B2C for automated payouts
- **Real-time Updates**: Live order tracking with Supabase Realtime
- **Secure**: Row Level Security (RLS) policies for data protection
- **Scalable**: Built on Next.js 14 with TypeScript
- **Free Hosting**: Deployed on Vercel (frontend) and Supabase (backend)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Payment**: M-Pesa Daraja API
- **Deployment**: Vercel (free tier)

## Getting Started

### Prerequisites

1. **Node.js** 18+ installed
2. **Supabase Account** (free tier)
3. **M-Pesa Daraja API Credentials** (sandbox or production)

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following scripts in order:
   - `database/schema.sql` - Creates all tables and functions
   - `database/rls-policies.sql` - Sets up security policies

3. Get your credentials from **Project Settings** → **API**:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep this secret!)

### 2. M-Pesa Daraja API Setup

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app to get:
   - Consumer Key
   - Consumer Secret
   - Business Short Code
   - Passkey

3. For testing, use **Sandbox** credentials

### 3. Installation

```bash
# Clone or navigate to the project
cd food-delivery-system

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### 4. Environment Variables

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# M-Pesa Daraja API
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
MPESA_ENVIRONMENT=sandbox

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_COMMISSION=10
DELIVERY_FEE=100
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
food-delivery-system/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (customer)/          # Customer pages
│   ├── (vendor)/            # Vendor dashboard
│   ├── (rider)/             # Rider dashboard
│   ├── (admin)/             # Admin dashboard
│   └── api/                 # API routes
│       └── mpesa/           # M-Pesa endpoints
├── components/              # Reusable components
├── lib/                     # Utilities and configurations
│   ├── supabase/           # Supabase clients
│   ├── mpesa/              # M-Pesa integration
│   └── utils.ts            # Helper functions
├── types/                   # TypeScript types
├── database/               # SQL scripts
│   ├── schema.sql          # Database schema
│   └── rls-policies.sql    # Security policies
└── public/                 # Static assets
```

## User Roles

### Customer
- Browse vendors and menus
- Add items to cart
- Place orders with M-Pesa payment
- Track order status in real-time
- Rate vendors and riders

### Vendor
- Manage menu items and pricing
- Receive and process orders
- Update order status
- View earnings and analytics
- Receive automated payouts

### Rider
- View available deliveries
- Accept delivery requests
- Update delivery status
- Track earnings
- Receive automated payouts

### Admin
- Monitor all platform activity
- Manage vendors and riders
- View transaction history
- Access analytics dashboard
- Handle disputes

## Payment Flow

1. **Customer Payment**: STK Push initiated when order is placed
2. **Escrow**: Payment held in platform account
3. **Order Completion**: On delivery confirmation:
   - Vendor receives 85% (configurable)
   - Rider receives delivery fee
   - Platform keeps 10-15% commission
4. **Automated Payouts**: B2C transfers to vendor/rider M-Pesa accounts

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Configure M-Pesa Callback

Update your callback URL in Daraja portal to:
```
https://your-domain.vercel.app/api/mpesa/callback
```

## Database Schema

Key tables:
- `profiles` - User accounts with roles
- `vendors` - Vendor business information
- `riders` - Rider details and vehicle info
- `menu_items` - Food items from vendors
- `orders` - Order lifecycle tracking
- `transactions` - Payment and payout records
- `reviews` - Customer feedback

## Security

- Row Level Security (RLS) on all tables
- Role-based access control
- Secure M-Pesa callback verification
- Environment variables for sensitive data
- HTTPS enforced in production

## Free Tier Limits

**Supabase Free Tier:**
- 500MB database
- 2GB bandwidth/month
- 50k monthly active users

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments

**Optimization Tips:**
- Regular data archival
- Image optimization
- Proper indexing
- Caching strategies

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## Troubleshooting

### M-Pesa Sandbox Issues
- Ensure you're using test credentials
- Check callback URL is publicly accessible (use ngrok for local testing)
- Verify phone number format (254XXXXXXXXX)

### Supabase Connection
- Verify environment variables are correct
- Check RLS policies are properly set
- Ensure service role key is used for admin operations

### Build Errors
- Clear `.next` folder and rebuild
- Check all dependencies are installed
- Verify TypeScript types are correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for your projects!

## Support

For issues and questions:
- Check the documentation
- Review Supabase logs
- Check M-Pesa Daraja documentation
- Review Next.js documentation

## Roadmap

- [ ] Push notifications (Firebase)
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile apps (React Native)

---

Built with ❤️ using Next.js, Supabase, and M-Pesa Daraja API
