import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabaseConfigError = "Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY.";

export function createSupabaseClient(appSessionToken = null) {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: appSessionToken
        ? {
            "x-app-session": appSessionToken,
          }
        : {},
    },
  });
}
