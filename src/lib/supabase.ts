import { createClient } from '@supabase/supabase-js';

// Fallbacks are provided to prevent the app from crashing on load when environment variables are not set.
// You must set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to use Supabase auth.
const supabaseUrl = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_URL : undefined) || import.meta.env?.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_ANON_KEY : undefined) || import.meta.env?.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = supabaseUrl !== "https://xyzcompany.supabase.co" && supabaseUrl !== "";
