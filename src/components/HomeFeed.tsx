import { useState, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PenLine, X } from "lucide-react"
import { getTagDef } from "@/types"
import { useAllMemberPosts, usePosts } from "@/lib/hooks"
import { PostComposer } from "@/components/PostComposer"
import { PostCard } from "@/components/PostCard.tsx" // Added .tsx extension
import { CircleDropdown } from "@/components/CircleDropdown"
import { CircleIcon } from "@/components/CircleIcon"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

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

  const handleSubmit = async (content: string, durationSeconds: number, tags: string[]) => {
    const error = await createPost(content, durationSeconds, userId, tags)
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
  const { posts, loading, toggleUpvote, updatePost, deletePost, makePermanent } = useAllMemberPosts(circleIds, userId)
  const [activeTag, setActiveTag] = useState<string | null>(null)
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

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const post of posts) {
      for (const tag of post.tags || []) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet)
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts
    return posts.filter((p) => p.tags?.includes(activeTag))
  }, [posts, activeTag])

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
    <Shell circles={circles} userId={userId}>
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

      <CircleDropdown circles={circles} />

      {/* Tag filter bar */}
      {availableTags.length > 0 && (
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
              activeTag === null
                ? "bg-quiet-slate text-quiet-offwhite"
                : "bg-quiet-border/60 text-quiet-muted hover:text-quiet-slate"
            }`}
          >
            All
          </button>
          {availableTags.map((tagId) => {
            const tag = getTagDef(tagId)
            if (!tag) return null
            const isActive = activeTag === tagId
            return (
              <button
                key={tagId}
                onClick={() => setActiveTag(isActive ? null : tagId)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "ring-1 ring-quiet-accent text-quiet-slate"
                    : "text-quiet-slate hover:ring-1 hover:ring-quiet-border"
                }`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.label}
              </button>
            )
          })}
        </div>
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
          {filteredPosts.length === 0 && !activeTag && (
            <p className="text-center text-sm text-quiet-muted">
              No posts yet. Check back later!
            </p>
          )}
          {filteredPosts.length === 0 && activeTag && (
            <p className="text-center text-sm text-quiet-muted">
              No posts with this tag yet.
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
