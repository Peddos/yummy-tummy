const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Inspecting PROFILES schema ---');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Select error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns in profiles:', Object.keys(data[0]));
    } else {
        console.log('No data in profiles table to inspect columns.');
        // Plan B: Try a different way to get columns
        const { data: cols, error: colError } = await supabase
            .from('profiles')
            .select()
            .limit(0);
        
        // In some client versions, this might still return header info or we can check the error of a bad select
        const { error: badSelect } = await supabase
            .from('profiles')
            .select('non_existent_column_for_debug');
        
        console.log('Error from bad select (might list columns):', badSelect?.message);
    }
}

run();
