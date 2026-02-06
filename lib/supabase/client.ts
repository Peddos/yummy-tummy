import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Check for placeholder values
if (supabaseUrl.includes('your_supabase') || supabaseAnonKey.includes('your_supabase')) {
    throw new Error(
        '⚠️ Supabase not configured!\n\n' +
        'Please follow these steps:\n' +
        '1. Create a Supabase project at https://supabase.com\n' +
        '2. Copy your Project URL and API keys\n' +
        '3. Update .env.local with your real credentials\n' +
        '4. Restart the dev server\n\n' +
        'See QUICKSTART.md for detailed instructions.'
    )
}

export const supabase = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
)
