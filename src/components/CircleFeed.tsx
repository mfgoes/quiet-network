import { useState, useMemo } from "react"
import { getTagDef } from "@/types"
import { usePosts } from "@/lib/hooks"
import { PostComposer } from "@/components/PostComposer"
import { PostCard } from "@/components/PostCard"
import { CircleAbout } from "@/components/CircleAbout"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

interface CircleFeedProps {
  circle: Circle
  userId: string
  isMember: boolean
  isAdminOrMod?: boolean
  onJoin: () => Promise<void>
  onLeave: () => Promise<void>
  joining: boolean
  onUpdateCircle: (updates: { about?: string | null; rules?: string | null; links?: { label: string; url: string }[] | null }) => Promise<void>
}

export function CircleFeed({
  circle,
  userId,
  isMember,
  isAdminOrMod,
  onJoin,
  onLeave,
  joining,
  onUpdateCircle,
}: CircleFeedProps) {
  const circleId = circle.id
  const { posts, loading, createPost, deletePost, toggleUpvote } = usePosts(circleId, userId)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const handleNewPost = async (content: string, durationSeconds: number, tags: string[]) => {
    await createPost(content, durationSeconds, userId, tags)
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

  return (
    <>
      {/* Mobile: collapsible above feed */}
      <div className="lg:hidden">
        <CircleAbout circle={circle} userId={userId} isAdminOrMod={isAdminOrMod} onUpdate={onUpdateCircle} onLeave={isMember ? onLeave : undefined} />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        {/* Main feed column */}
        <div>
          {/* Join banner for non-members */}
          {!isMember && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-quiet-border bg-white p-3">
              <p className="text-sm text-quiet-muted">Join this circle to post and interact.</p>
              <Button
                size="sm"
                disabled={joining}
                onClick={onJoin}
              >
                {joining ? "Joining..." : "Join"}
              </Button>
            </div>
          )}

          {isMember && <PostComposer onSubmit={handleNewPost} />}

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
          ) : (
            <div className="mt-6 space-y-3">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  userId={isMember ? userId : undefined}
                  isAdminOrMod={isAdminOrMod}
                  onUpvote={isMember ? toggleUpvote : undefined}
                  onDelete={isMember ? deletePost : undefined}
                />
              ))}
              {filteredPosts.length === 0 && activeTag && (
                <p className="text-center text-sm text-quiet-muted">
                  No posts with this tag yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Desktop: sidebar */}
        <div className="hidden lg:block">
          <CircleAbout sidebar circle={circle} userId={userId} isAdminOrMod={isAdminOrMod} onUpdate={onUpdateCircle} onLeave={isMember ? onLeave : undefined} />
        </div>
      </div>
    </>
  )
}
