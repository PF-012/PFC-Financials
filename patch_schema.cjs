const fs = require('fs');
let code = fs.readFileSync('supabase-schema.sql', 'utf8');
code = code.replace(
  '"tdsAmount" numeric,\n  narration text,',
  '"tdsAmount" numeric,\n  "againstReference" text,\n  narration text,'
);
fs.writeFileSync('supabase-schema.sql', code);
