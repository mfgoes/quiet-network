import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowUp, MessageSquare, Clock, Users } from "lucide-react"
import { useAllMemberPosts } from "@/lib/hooks"
import { CircleIcon } from "@/components/CircleIcon"
import { extractLeadingHeader, extractMarkdownUrls } from "@/lib/markdown"
import type { Circle, Post } from "@/types"

interface PublicHomeFeedProps {
  circles: Circle[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Interleave media-rich and text-only posts.
 *
 * Viewport estimate: ~150px per card, ~750px viewport ≈ 5 posts visible.
 * "2 screens" ≈ 10 posts. Within those first HIGH_IMPACT_SLOTS positions we
 * use a 4:1 media-to-text ratio so the feed looks rich immediately.
 * After that it drops to 1:1 so text posts aren't buried indefinitely.
 */
const HIGH_IMPACT_SLOTS = 10

function interleaveByImpact(media: Post[], text: Post[]): Post[] {
  const result: Post[] = []
  let mi = 0, ti = 0

  while (mi < media.length || ti < text.length) {
    const mediaDone = mi >= media.length
    const textDone = ti >= text.length
    const slot = result.length

    if (mediaDone) { result.push(text[ti++]); continue }
    if (textDone) { result.push(media[mi++]); continue }

    // First ~2 screens: 4 media then 1 text, repeat
    // After that: strict 1:1
    const pickMedia = slot < HIGH_IMPACT_SLOTS
      ? slot % 5 < 4   // 4:1 ratio
      : slot % 2 === 0  // 1:1 ratio

    if (pickMedia) result.push(media[mi++])
    else result.push(text[ti++])
  }

  return result
}

function PostPreviewCard({ post }: { post: Post }) {
  const navigate = useNavigate()
  const circle = post.circles
  const slug = circle?.slug

  const { header, rest } = useMemo(() => extractLeadingHeader(post.content ?? ""), [post.content])
  const plainText = (rest || post.content || "")
    .replace(/^#{1,6}\s+/gm, "")   // strip remaining headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // strip bold
    .replace(/__(.+?)__/g, "$1")     // strip underline
    .replace(/_(.+?)_/g, "$1")       // strip italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip links
    .replace(/https?:\/\/\S+/g, "")  // strip bare URLs
    .replace(/\s+/g, " ").trim()
  const preview = plainText.length > 200 ? plainText.slice(0, 200) + "…" : plainText

  return (
    <article
      onClick={() => navigate(slug ? `/${slug}/p/${post.id}` : `/p/${post.id}`)}
      className="cursor-pointer overflow-hidden rounded-xl border border-quiet-border bg-white transition-colors hover:bg-quiet-aged/40"
    >
      {/* Image: proportional, capped height, portrait images get side padding */}
      {post.image_url && (
        <div className="flex max-h-[480px] items-center justify-center overflow-hidden bg-quiet-border/10">
          <img
            src={post.image_url}
            alt=""
            className="max-h-[480px] max-w-full object-contain"
          />
        </div>
      )}

      <div className="p-4">
        {/* Circle + author row */}
        <div className="mb-2 flex items-center gap-2 text-xs text-quiet-muted">
          {circle && (
            <>
              <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
              <span
                className="font-medium text-quiet-slate hover:underline"
                onClick={(e) => { e.stopPropagation(); navigate(`/${slug}`) }}
              >
                {circle.name}
              </span>
              <span>·</span>
            </>
          )}
          <Clock className="h-3 w-3" />
          <span>{timeAgo(post.created_at)}</span>
          {post.profiles?.display_name && (
            <>
              <span>·</span>
              <span>{post.profiles.display_name}</span>
            </>
          )}
        </div>

        {/* Content */}
        {header && <p className="mb-1 text-sm font-semibold text-quiet-slate">{header}</p>}
        <p className="text-sm leading-relaxed text-quiet-slate line-clamp-3">{preview}</p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-quiet-muted">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3.5 w-3.5" />
            {post.upvote_count ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.reply_count ?? 0}
          </span>
        </div>
      </div>
    </article>
  )
}

export function PublicHomeFeed({ circles }: PublicHomeFeedProps) {
  const navigate = useNavigate()
  const circleIds = useMemo(() => circles.map((c) => c.id), [circles])
  const { posts, loading } = useAllMemberPosts(circleIds)

  // Shuffle once on mount, excluding welcome posts, media posts weighted to the top
  const shuffledPosts = useMemo(() => {
    const filtered = posts.filter(p => !p.is_welcome)
    const hasMedia = (p: Post) => !!p.image_url || extractMarkdownUrls(p.content ?? "").length > 0
    return interleaveByImpact(shuffled(filtered.filter(hasMedia)), shuffled(filtered.filter(p => !hasMedia(p))))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length > 0 ? posts[0].id : ""])

  if (loading) {
    return <p className="mt-8 text-center text-sm text-quiet-muted">Loading…</p>
  }

  if (shuffledPosts.length === 0) {
    return <p className="mt-8 text-center text-sm text-quiet-muted">No posts yet.</p>
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-quiet-slate">Recent posts</h2>
      {shuffledPosts.map((post) => (
        <PostPreviewCard key={post.id} post={post} />
      ))}
      <div className="pt-4 pb-2 text-center">
        <p className="text-sm text-quiet-muted">
          Want to see more?{" "}
          <button
            onClick={() => navigate("/explore")}
            className="font-medium text-quiet-accent hover:underline"
          >
            Explore circles
          </button>
          {" "}or{" "}
          <button
            onClick={() => navigate("/login")}
            className="font-medium text-quiet-accent hover:underline"
          >
            join the community
          </button>
          .
        </p>
      </div>
    </div>
  )
}

// ─── Explore page (circle browser) for public users ──

interface PublicExplorePageProps {
  circles: Circle[]
  loading: boolean
}

export function PublicExplorePage({ circles, loading }: PublicExplorePageProps) {
  const navigate = useNavigate()

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-quiet-slate">Explore circles</h2>
      <p className="mb-6 text-sm text-quiet-muted">Browse communities on Quiet Network</p>
      {loading ? (
        <p className="text-center text-sm text-quiet-muted">Loading…</p>
      ) : circles.length === 0 ? (
        <p className="text-center text-sm text-quiet-muted">No circles yet.</p>
      ) : (
        <div className="space-y-2">
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => navigate(`/${circle.slug}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-quiet-border bg-white p-4 text-left transition-colors hover:bg-quiet-aged/40"
            >
              <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-quiet-slate">{circle.name}</p>
                {circle.description && (
                  <p className="mt-0.5 truncate text-xs text-quiet-muted">{circle.description}</p>
                )}
              </div>
              <Users className="h-4 w-4 shrink-0 text-quiet-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
