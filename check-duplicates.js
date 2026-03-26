const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Checking for duplicate phone number ---');
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', '079009001')
        .maybeSingle();
    
    if (error) {
        console.error('Error checking profile:', error);
    } else if (profile) {
        console.log('FOUND EXISTING PROFILE with this phone:', JSON.stringify(profile, null, 2));
    } else {
        console.log('No existing profile with this phone number.');
    }

    console.log('\n--- Checking for existing auth user ---');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
        console.error('Error listing users:', userError);
    } else {
        const targetUser = users.users.find(u => u.email === 'railaodinga@gmail.com');
        if (targetUser) {
            console.log('FOUND EXISTING AUTH USER:', JSON.stringify(targetUser, null, 2));
        } else {
            console.log('No existing auth user with this email.');
        }
    }
}

run();
