import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fipzbbqfajcyyhyrtnzr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcHpiYnFmYWpjeXloeXJ0bnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTgzOTksImV4cCI6MjA5OTQzNDM5OX0.AKFMaGGS8iyFOAP69QelZecCX9T0YVc2lJ9NjODN6MQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
