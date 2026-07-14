require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
sb.from('ledgers').select('id, name, "group"').ilike('name', '%sales%').then(console.log);
