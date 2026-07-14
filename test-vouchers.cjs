require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('vouchers').select('*').then(({data, error}) => {
  console.log("Vouchers count:", data ? data.length : 0);
  console.log("First voucher:", data && data[0]);
});
