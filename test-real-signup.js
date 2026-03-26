const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Testing Signup via API ---');
    const email = 'testuser_' + Date.now() + '@example.com';
    const password = 'Password123!';
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: 'Test User',
                phone: '0700' + Math.floor(Math.random() * 1000000),
                role: 'customer',
            }
        }
    })

    if (signUpError) {
        console.error('SERVER-SIDE SIGNUP ERROR:', signUpError.message);
        console.log('Full error object:', JSON.stringify(signUpError, null, 2));
    } else {
        console.log('Signup initial success (email sent or user created)');
        console.log('User ID:', authData.user?.id);
    }
}

run();
