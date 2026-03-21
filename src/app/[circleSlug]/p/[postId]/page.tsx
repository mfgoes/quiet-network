import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'
import { PostPageClient } from '@/components/PostPageClient'
import { notFound } from 'next/navigation'

export const revalidate = 60

type Props = { params: Promise<{ circleSlug: string; postId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params
  const supabase = createServerSupabase()
  const { data: post } = await supabase
    .from('posts')
    .select('content, circles(name, avatar_url)')
    .eq('id', postId)
    .single()

  if (!post) return { title: 'Post not found' }

  const cleaned = post.content?.replace(/^#{1,6}\s+/m, '').replace(/#{1,6}\s+/g, '').trim()
  const truncated = cleaned?.slice(0, 60)
  const title = cleaned && cleaned.length > 60 ? `${truncated}…` : truncated
  const circleName = Array.isArray(post.circles) ? post.circles[0]?.name : (post.circles as any)?.name

  return {
    title: title ? `${title} — Quiet Network` : 'Quiet Network',
    description: cleaned?.slice(0, 160),
    openGraph: {
      type: 'article',
      title: title || 'Quiet Network',
      description: cleaned?.slice(0, 160),
    },
  }
}

export default async function CirclePostPage({ params }: Props) {
  const { circleSlug, postId } = await params
  const supabase = createServerSupabase()

  const { data: post } = await supabase
    .from('posts')
    .select('id, content, created_at, image_url, tags, author_id, circle_id, expires_at, is_permanent, is_welcome, original_duration_seconds, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot), circles(id, name, slug, description, avatar_url)')
    .eq('id', postId)
    .single()

  if (!post) notFound()

  return <PostPageClient postId={postId} circleSlug={circleSlug} initialPost={post} />
}
