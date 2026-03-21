import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { HomePageClient } from '@/components/HomePageClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Quiet Network — Your neighborhood, without the noise',
}

export default async function HomePage() {
  const supabase = createServerSupabase()

  const { data: circles } = await supabase
    .from('circles')
    .select('id, name, slug, description, about, avatar_url, banner_color')
    .order('name')
    .limit(50)

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, created_at, image_url, tags, circles(id, name, slug, avatar_url), profiles!posts_author_id_fkey(display_name, avatar_emoji, username)')
    .order('created_at', { ascending: false })
    .limit(20)

  return <HomePageClient initialCircles={(circles ?? []) as any} initialPosts={posts ?? []} />
}
