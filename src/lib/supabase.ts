import { createClient } from '@supabase/supabase-js';

// PFC Financials production Supabase project.
// The URL is public configuration; the API key must remain a Vercel environment variable.
const PRODUCTION_SUPABASE_URL = 'https://fipzbbqfajcyyhytrtnzr.supabase.co';

const envUrl = import.meta.env?.VITE_SUPABASE_URL?.trim();
const supabaseUrl = envUrl || PRODUCTION_SUPABASE_URL;
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Do not silently create a client with a fake URL/key. A fake client makes
// database operations fail with an unhelpful "Failed to fetch" error in Vercel.
if (!supabaseKey) {
  console.error(
    'PFC Financials: VITE_SUPABASE_ANON_KEY is missing. Add the Supabase Publishable/anon key to the Vercel environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey || 'missing-key'
);
