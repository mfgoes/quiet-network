import { createClient } from "@supabase/supabase-js"

// These env vars are required at runtime but may not be available during static build analysis.
// Pages that use supabase are client-only ('use client') and will never render server-side.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  'https://gtlhwapaeytlialzfrao.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_ktWcsK5CUiq9lc14CmuZyQ_a3r7UA0s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
