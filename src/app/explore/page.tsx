import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { ExplorePageClient } from '@/components/ExplorePageClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Explore Circles — Quiet Network',
  description: 'Discover local circles and neighborhood communities on Quiet Network.',
}

export default async function ExplorePage() {
  const supabase = createServerSupabase()

  const { data: circles } = await supabase
    .from('circles')
    .select('id, name, slug, description, about, avatar_url, banner_color, latitude, longitude, radius_km, country')
    .order('name')
    .limit(200)

  return <ExplorePageClient initialCircles={(circles ?? []) as any} />
}
