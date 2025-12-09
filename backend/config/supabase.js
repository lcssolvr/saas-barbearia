const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const adminSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const createScopedClient = (token) => {
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseKey) {
        throw new Error('Supabase Anon Key is missing. Set SUPABASE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
    }

    return createClient(
        process.env.SUPABASE_URL,
        supabaseKey,
        {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            },
            auth: {
                persistSession: false
            }
        }
    );
};

module.exports = { adminSupabase, createScopedClient };