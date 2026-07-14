require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
sb.from('vouchers').select('date, type, totalAmount, accountId, partyId').limit(10).then((data) => {
  console.log(data.data);
});
