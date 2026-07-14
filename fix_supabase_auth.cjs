const fs = require('fs');
let supabaseLib = fs.readFileSync('src/lib/supabase.ts', 'utf8');
if (!supabaseLib.includes('isSupabaseConfigured')) {
  supabaseLib += '\nexport const isSupabaseConfigured = supabaseUrl !== "https://xyzcompany.supabase.co" && supabaseUrl !== "";\n';
  fs.writeFileSync('src/lib/supabase.ts', supabaseLib);
}

let authContext = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
authContext = authContext.replace("import { supabase } from '../lib/supabase';", "import { supabase, isSupabaseConfigured } from '../lib/supabase';");
authContext = authContext.replace(
  "const signIn = async () => {\n    await supabase.auth.signInWithOAuth({",
  "const signIn = async () => {\n    if (!isSupabaseConfigured) {\n      alert('Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to sign in.');\n      return;\n    }\n    await supabase.auth.signInWithOAuth({"
);
fs.writeFileSync('src/context/AuthContext.tsx', authContext);
console.log("Fixed");
