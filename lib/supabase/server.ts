import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role environment variables')
}

// Check for placeholder values
if (supabaseUrl.includes('your_supabase') || supabaseServiceKey.includes('your_supabase')) {
    throw new Error(
        '⚠️ Supabase not configured!\n\n' +
        'Please update .env.local with your real Supabase credentials.\n' +
        'See QUICKSTART.md for setup instructions.'
    )
}

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})
