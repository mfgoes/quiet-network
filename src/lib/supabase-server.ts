import { createClient } from "@supabase/supabase-js"

// Server-only Supabase client for SSG/ISR data fetching
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
  return createClient(url, key)
}
