import { createClient } from "@supabase/supabase-js"

// These env vars are required at runtime but may not be available during static build analysis.
// Pages that use supabase are client-only ('use client') and will never render server-side.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
