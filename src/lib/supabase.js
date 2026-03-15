import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const supabaseConfigError = "Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY.";

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabasePublishableKey) : null;
