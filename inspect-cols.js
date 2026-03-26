const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Inspecting PROFILES table columns ---');
    const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'profiles' }); // This RPC might not exist, trying fallback
    
    if (error) {
        console.log('Rpc failed (expected), trying direct query to information_schema...');
        const { data: schemaData, error: schemaError } = await supabase
            .from('profiles')
            .select('*')
            .limit(0); // This just checks if table exists and returns columns in some drivers
        
        // Better: Query information_schema if possible via SQL (rpc)
        // Since I can't run arbitrary SQL easily without a custom RPC, 
        // I'll try to insert a dummy row with only ID and see what fails.
    }

    console.log('\n--- Attempting manual insert with minimum fields ---');
    const dummyId = '00000000-0000-0000-0000-000000000000'; // Invalid ref but might show column errors
    const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: dummyId, full_name: 'Test', phone: 'test_phone' });
    
    if (insertError) {
        console.log('Insert error (useful for debugging):', insertError.message);
        console.log('Error details:', insertError.details);
        console.log('Error hint:', insertError.hint);
    }
}

run();
