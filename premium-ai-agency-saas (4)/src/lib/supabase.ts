import { createClient } from "@supabase/supabase-js";

// Vite environment variables detection and extraction
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// If environment variables are missing, log the actual values as requested
if (!supabaseUrl || !supabaseAnonKey) {
  console.log(import.meta.env);
  console.log(import.meta.env.VITE_SUPABASE_URL);
  console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// Graceful client initialization using environment variables or fallback values to prevent startup crashes
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export function isSupabaseConfigured(): boolean {
  // Simple, robust check to see if both required variables are present
  return !!(supabaseUrl && supabaseAnonKey);
}

