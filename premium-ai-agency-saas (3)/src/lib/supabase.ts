import { createClient } from "@supabase/supabase-js";

// Vite environment variables detection and extraction
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Validate the retrieved environment variables
const isValidUrl = !!supabaseUrl && 
                     supabaseUrl !== "https://your-supabase-project.supabase.co" && 
                     supabaseUrl.trim() !== "" && 
                     supabaseUrl.startsWith("http");

const isValidKey = !!supabaseAnonKey && 
                     supabaseAnonKey !== "your-supabase-anon-key" && 
                     supabaseAnonKey.trim() !== "";

const isConfigured = isValidUrl && isValidKey;

if (!isConfigured) {
  console.error(
    "========================================================================\n" +
    "[Supabase Error] Missing or invalid credentials.\n" +
    "The application requires the following environment variables to be set for Netlify deployment:\n" +
    "  - VITE_SUPABASE_URL\n" +
    "  - VITE_SUPABASE_ANON_KEY\n" +
    "Please configure these variables in your Netlify dashboard under Site Settings > Environment Variables.\n" +
    "========================================================================"
  );
}

// Graceful client initialization using environment variables or fallback values to prevent startup crashes
export const supabase = createClient(
  isConfigured ? supabaseUrl : "https://unconfigured-netlify-deployment.supabase.co",
  isConfigured ? supabaseAnonKey : "unconfigured-netlify-anon-key-placeholder"
);

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

