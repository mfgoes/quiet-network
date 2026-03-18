import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowUp, MessageSquare, Clock, Users, ChevronRight, Search, X } from "lucide-react"
import { useAllMemberPosts } from "@/lib/hooks"
import { CircleIcon } from "@/components/CircleIcon"
import { LinkPreview } from "@/components/LinkPreview"
import { resolveCountryCode } from "@/components/CirclePicker"
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

// ─── Spotlight row ────────────────────────────────────────────────────────────

/** A single card in the horizontal spotlight strip */
function SpotlightCard({ post }: { post: Post }) {
  const navigate = useNavigate()
  const circle = post.circles
  const slug = circle?.slug
  const { header } = useMemo(() => extractLeadingHeader(post.content ?? ""), [post.content])
  const title = header || post.content?.split("\n")[0]?.slice(0, 80) || ""

  return (
    <article
      onClick={() => navigate(slug ? `/${slug}/p/${post.id}` : `/p/${post.id}`)}
      className="relative cursor-pointer flex-shrink-0 w-56 rounded-xl overflow-hidden border border-quiet-border bg-white transition-shadow hover:shadow-md"
    >
      {/* Image or gradient fallback */}
      {post.image_url ? (
        <div className="h-36 overflow-hidden bg-quiet-border/10">
          <img src={post.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-36 flex items-center justify-center px-3 bg-gradient-to-br from-quiet-aged to-quiet-border/40">
          <p className="text-xs font-medium text-quiet-slate text-center line-clamp-4 leading-relaxed">
            {title}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="p-3">
        {circle && (
          <div className="mb-1 flex items-center gap-1.5">
            <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
            <span className="text-xs font-medium text-quiet-slate truncate">{circle.name}</span>
          </div>
        )}
        {post.image_url && title && (
          <p className="text-xs text-quiet-muted line-clamp-2 leading-snug">{title}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-[10px] text-quiet-muted">
          <span className="flex items-center gap-0.5">
            <ArrowUp className="h-3 w-3" />
            {post.upvote_count ?? 0}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" />
            {post.reply_count ?? 0}
          </span>
          <span className="ml-auto flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {timeAgo(post.created_at)}
          </span>
        </div>
      </div>
    </article>
  )
}

/**
 * Horizontal scrollable spotlight strip.
 * Prefers image posts; fills remaining slots with high-upvote text posts
 * so there are always at least 4 cards (or all available posts).
 */
function SpotlightRow({ posts }: { posts: Post[] }) {
  const navigate = useNavigate()
  const cards = useMemo(() => {
    const SLOTS = 6
    const withImage = posts.filter(p => !!p.image_url)
    const byUpvotes = [...posts].sort((a, b) => (b.upvote_count ?? 0) - (a.upvote_count ?? 0))

    // Fill with image posts first, then top-upvoted posts for remaining slots
    const usedIds = new Set(withImage.slice(0, SLOTS).map(p => p.id))
    const fillers = byUpvotes.filter(p => !usedIds.has(p.id)).slice(0, Math.max(0, SLOTS - withImage.length))
    return [...withImage.slice(0, SLOTS), ...fillers].slice(0, SLOTS)
  }, [posts])

  if (cards.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-quiet-slate uppercase tracking-wide">Trending</h2>
        <button
          onClick={() => navigate("/explore")}
          className="flex items-center gap-0.5 text-xs text-quiet-accent hover:underline"
        >
          Explore circles <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {cards.map(post => (
          <SpotlightCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}

// ─── Popular communities sidebar card ────────────────────────────────────────

function PopularCommunitiesCard({ circles, posts }: { circles: Circle[]; posts: Post[] }) {
  const navigate = useNavigate()

  // Rank circles by post count from already-loaded posts data
  const ranked = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of posts) {
      if (p.circles?.id) counts[p.circles.id] = (counts[p.circles.id] ?? 0) + 1
    }
    return [...circles]
      .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
      .slice(0, 5)
  }, [circles, posts])

  if (ranked.length === 0) return null

  return (
    <div className="rounded-xl border border-quiet-border bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-quiet-muted">
        Popular Communities
      </h3>
      <div className="space-y-3">
        {ranked.map((circle) => (
          <button
            key={circle.id}
            onClick={() => navigate(`/${circle.slug}`)}
            className="flex w-full items-center gap-2.5 text-left transition-opacity hover:opacity-75"
          >
            <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-quiet-slate">{circle.name}</p>
              {circle.description && (
                <p className="truncate text-xs text-quiet-muted">{circle.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate("/explore")}
        className="mt-4 w-full rounded-lg bg-quiet-aged px-3 py-2 text-xs font-medium text-quiet-slate transition-colors hover:bg-quiet-border/40"
      >
        See all communities
      </button>
    </div>
  )
}

// ─── Post feed card ───────────────────────────────────────────────────────────

function PostPreviewCard({ post }: { post: Post }) {
  const navigate = useNavigate()
  const circle = post.circles
  const slug = circle?.slug

  const embedUrls = useMemo(() => extractMarkdownUrls(post.content ?? ""), [post.content])
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

        {/* Embeds */}
        {embedUrls.length > 0 && (
          <div className="mt-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {embedUrls.map((url) => (
              <LinkPreview key={url} url={url} />
            ))}
          </div>
        )}

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

// ─── Public home feed ─────────────────────────────────────────────────────────

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

  // Non-welcome posts for spotlight (separate memo so spotlight can include posts not in main feed)
  const nonWelcomePosts = useMemo(
    () => posts.filter(p => !p.is_welcome),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts.length > 0 ? posts[0].id : ""]
  )

  if (loading) {
    return <p className="mt-8 text-center text-sm text-quiet-muted">Loading…</p>
  }

  if (shuffledPosts.length === 0) {
    return <p className="mt-8 text-center text-sm text-quiet-muted">No posts yet.</p>
  }

  return (
    <div>
      {/* Spotlight strip — full width above the two-column area */}
      <SpotlightRow posts={nonWelcomePosts} />

      {/* Two-column layout: feed + sidebar */}
      <div className="flex gap-6 items-start">
        {/* Main feed */}
        <div className="min-w-0 flex-1 space-y-3">
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

        {/* Right sidebar — hidden on small screens */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-6 space-y-4">
          <PopularCommunitiesCard circles={circles} posts={nonWelcomePosts} />
        </aside>
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
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return circles
    const countryCode = resolveCountryCode(q)
    return circles.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q) ||
      (countryCode !== null && c.country === countryCode)
    )
  }, [query, circles])

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-quiet-slate">Explore circles</h2>
      <p className="mb-4 text-sm text-quiet-muted">Browse communities on Quiet Network</p>

      {/* Search */}
      {!loading && circles.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-quiet-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search circles…"
            className="w-full rounded-lg border border-quiet-border bg-white py-2.5 pl-9 pr-9 text-sm text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-quiet-muted hover:text-quiet-slate"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-quiet-muted">Loading…</p>
      ) : circles.length === 0 ? (
        <p className="text-center text-sm text-quiet-muted">No circles yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-quiet-muted py-4">No circles match "{query}"</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((circle) => (
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
