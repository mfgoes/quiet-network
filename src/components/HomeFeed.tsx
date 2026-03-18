import { useMemo, useRef, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowUp, ChevronRight, Clock, MessageSquare, PenLine, X } from "lucide-react"
import { useAllMemberPosts, usePosts, useFavorites } from "@/lib/hooks"
import { sortPostsWithFreshness } from "@/lib/feedScoring"
import { PostComposer } from "@/components/PostComposer"
import { PostCard } from "@/components/PostCard.tsx" // Added .tsx extension
import { CircleIcon } from "@/components/CircleIcon"
import { Shell } from "@/components/Shell"
import { Button } from "@/components/ui/button"
import { extractLeadingHeader } from "@/lib/markdown"
import type { Circle, Post } from "@/types"

// ─── Spotlight row ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function SpotlightCard({ post }: { post: Post }) {
  const navigate = useNavigate()
  const circle = post.circles
  const slug = circle?.slug
  const { header } = useMemo(() => extractLeadingHeader(post.content ?? ""), [post.content])
  const title = header || post.content?.split("\n")[0]?.slice(0, 80) || ""

  return (
    <article
      onClick={() => navigate(slug ? `/${slug}/p/${post.id}` : `/p/${post.id}`)}
      className="relative cursor-pointer flex-shrink-0 w-52 rounded-xl overflow-hidden border border-quiet-border bg-white transition-shadow hover:shadow-md"
    >
      {post.image_url ? (
        <div className="h-32 overflow-hidden bg-quiet-border/10">
          <img src={post.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center px-3 bg-gradient-to-br from-quiet-aged to-quiet-border/40">
          <p className="text-xs font-medium text-quiet-slate text-center line-clamp-4 leading-relaxed">
            {title}
          </p>
        </div>
      )}
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

function SpotlightRow({ posts }: { posts: Post[] }) {
  const navigate = useNavigate()
  const cards = useMemo(() => {
    const SLOTS = 6
    const withImage = posts.filter(p => !!p.image_url)
    const byUpvotes = [...posts].sort((a, b) => (b.upvote_count ?? 0) - (a.upvote_count ?? 0))
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

interface HomeFeedProps {
  circles: Circle[]
  userId: string
  circleRoles?: Record<string, string>
}

/* ─── Inline composer with circle binding ──────────── */
function HomeComposer({
  circle,
  userId,
  onDone,
}: {
  circle: Circle
  userId: string
  onDone: () => void
}) {
  const { createPost } = usePosts(circle.id, userId)

  const handleSubmit = async (content: string, durationSeconds: number, tags: string[], imageUrl?: string | null) => {
    const error = await createPost(content, durationSeconds, userId, tags, imageUrl)
    if (!error) onDone()
    return error
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-quiet-muted">
          <span>Posting to</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-quiet-slate">
            <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
            {circle.name}
          </span>
        </div>
        <button
          onClick={onDone}
          className="rounded p-1 text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-slate transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <PostComposer onSubmit={handleSubmit} />
    </div>
  )
}

export function HomeFeed({ circles, userId, circleRoles = {} }: HomeFeedProps) {
  const navigate = useNavigate()
  const circleIds = useMemo(() => circles.map((c) => c.id), [circles])
  const { favoritedCircleIds } = useFavorites(userId)
  const sessionSeed = useRef<number>(Math.random())

  const { posts, loading, toggleUpvote, updatePost, deletePost, makePermanent } = useAllMemberPosts(circleIds, userId)
  const [composerState, setComposerState] = useState<"closed" | "picking" | Circle>("closed")
  const pickerRef = useRef<HTMLDivElement>(null)

  // Helper to check if user is admin/mod for a given circle
  const isAdminOrModForCircle = (circleId: string) => {
    const circle = circles.find((c) => c.id === circleId)
    return circle ? ["admin", "moderator"].includes(circleRoles[circleId] ?? "") || circle.created_by === userId : false
  }

  const handleUpdatePost = async (postId: string, content: string, tags: string[]) => {
    await updatePost(postId, content, tags)
  }

  const filteredPosts = useMemo(() => {
    return sortPostsWithFreshness(posts, sessionSeed.current, favoritedCircleIds)
  }, [posts, favoritedCircleIds])

  // Close picker on outside click
  useEffect(() => {
    if (composerState !== "picking") return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setComposerState("closed")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [composerState])

  return (
    <Shell>
      {/* Composer overlay */}
      {composerState !== "closed" && composerState !== "picking" && (
        <div className="mb-4">
          <HomeComposer
            circle={composerState}
            userId={userId}
            onDone={() => setComposerState("closed")}
          />
        </div>
      )}



      {!loading && filteredPosts.length > 0 && (
        <SpotlightRow posts={filteredPosts} />
      )}

      {loading ? (
        <p className="mt-6 text-center text-sm text-quiet-muted">
          Loading posts...
        </p>
      ) : circles.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-quiet-muted">
            You haven't joined any circles yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/explore")}
          >
            Explore circles
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredPosts.map((post) => {
            const isAdminOrMod = isAdminOrModForCircle(post.circle_id)
            return (
              <PostCard
                key={post.id}
                post={post}
                userId={userId}
                isMember={true}
                isAdminOrMod={isAdminOrMod}
                onUpvote={toggleUpvote}
                onDelete={deletePost}
                onEdit={handleUpdatePost}
                onMakePermanent={makePermanent}
              />
            )
          })}
          {filteredPosts.length === 0 && (
            <p className="text-center text-sm text-quiet-muted">
              No posts yet. Check back later!
            </p>
          )}
        </div>
      )}

      {/* FAB: Share something nearby */}
      {circles.length > 0 && composerState === "closed" && (
        <button
          onClick={() => {
            if (circles.length === 1) {
              setComposerState(circles[0])
              window.scrollTo({ top: 0, behavior: "smooth" })
            } else {
              setComposerState("picking")
            }
          }}
          className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 flex items-center gap-2 rounded-full bg-quiet-slate px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-quiet-accent hover:shadow-xl active:scale-95"
        >
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">Share something nearby</span>
        </button>
      )}

      {/* Circle picker popover */}
      {composerState === "picking" && (
        <div
          ref={pickerRef}
          className="fixed bottom-40 right-5 md:bottom-20 md:right-8 z-50 w-56 rounded-xl border border-quiet-border bg-white p-2 shadow-xl"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-quiet-muted">
            Which circle?
          </p>
          {circles.map((circle) => (
            <button
              key={circle.id}
              onClick={() => {
                setComposerState(circle)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-quiet-slate transition-colors hover:bg-quiet-aged"
            >
              <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
              <span className="truncate">{circle.name}</span>
            </button>
          ))}
        </div>
      )}
    </Shell>
  )
}
