import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { getTagDef } from "@/types"
import { useAllMemberPosts } from "@/lib/hooks"
import { PostCard } from "@/components/PostCard"
import { CircleDropdown } from "@/components/CircleDropdown"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

interface HomeFeedProps {
  circles: Circle[]
  userId: string
}

export function HomeFeed({ circles, userId }: HomeFeedProps) {
  const navigate = useNavigate()
  const circleIds = useMemo(() => circles.map((c) => c.id), [circles])
  const { posts, loading, toggleUpvote, deletePost } = useAllMemberPosts(circleIds, userId)
  const [activeTag, setActiveTag] = useState<string | null>(null)

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
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userId={userId}
              onUpvote={toggleUpvote}
              onDelete={deletePost}
            />
          ))}
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
    </>
  )
}
