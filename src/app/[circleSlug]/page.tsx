import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { CirclePageClient } from '@/components/CirclePageClient'
import { notFound } from 'next/navigation'

export const revalidate = 60

type Props = { params: Promise<{ circleSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { circleSlug } = await params
  const supabase = createServerSupabase()
  const { data: circle } = await supabase
    .from('circles')
    .select('name, about, description, avatar_url, slug')
    .eq('slug', circleSlug)
    .single()

  if (!circle) return { title: 'Circle not found' }

  const description = circle.about || circle.description || `A circle on Quiet Network`
  return {
    title: `${circle.name} — Quiet Network`,
    description,
    openGraph: {
      type: 'website',
      title: circle.name,
      description,
      images: circle.avatar_url ? [{ url: circle.avatar_url }] : undefined,
    },
  }
}

export default async function CirclePage({ params }: Props) {
  const { circleSlug } = await params
  const supabase = createServerSupabase()

  const { data: circle } = await supabase
    .from('circles')
    .select('id, name, slug, description, about, rules, avatar_url, banner_color, latitude, longitude, radius_km, country, links')
    .eq('slug', circleSlug)
    .single()

  if (!circle) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, created_at, image_url, tags, profiles!posts_author_id_fkey(display_name, avatar_emoji, username), circles(id, name, slug, avatar_url)')
    .eq('circle_id', circle.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return <CirclePageClient circleSlug={circleSlug} initialCircle={circle as any} initialPosts={posts ?? []} />
}
