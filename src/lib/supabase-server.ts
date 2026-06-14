import { createClient } from "@supabase/supabase-js"

// Server-only Supabase client for SSG/ISR data fetching
export function createServerSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    'https://gtlhwapaeytlialzfrao.supabase.co'
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    'sb_publishable_ktWcsK5CUiq9lc14CmuZyQ_a3r7UA0s'
  return createClient(url, key)
}
