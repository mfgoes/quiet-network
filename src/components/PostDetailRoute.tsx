import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PostCard } from "@/components/PostCard"
import { PostMetaTags } from "@/components/PostMetaTags"
import { JoinBanner } from "@/components/JoinBanner"
import { Button } from "@/components/ui/button"
import type { Post } from "@/types"

interface PostDetailRouteProps {
  userId?: string
  memberCircleIds?: string[]
  circleRoles?: Record<string, string>
  onJoinClick?: () => void
}

export function PostDetailRoute({ userId, memberCircleIds = [], circleRoles = {}, onJoinClick }: PostDetailRouteProps) {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  const handleBackClick = () => {
    // If the post has a circle, navigate to it
    if (post?.circles?.slug) {
      navigate(`/${post.circles.slug}`)
    } else {
      // Fallback: go back if possible, otherwise home
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate('/')
      }
    }
  }

  useEffect(() => {
    if (!postId) return

    const fetchPost = async () => {
      setLoading(true)
      try {
        console.log("Fetching post:", postId, "userId:", userId)
        const { data, error } = await supabase
          .from("posts")
          .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot), circles(name, slug, description, avatar_url)")
          .eq("id", postId)
          .single()

        console.log("Post query result:", { data, error })

        if (!error && data) {
          const truncated = data.content?.slice(0, 60)
          const title = data.content && data.content.length > 60 ? `${truncated}…` : truncated
          document.title = title ? `${title} — Quiet Network` : "Quiet Network"
          // Enrich with upvote data (skip for anonymous users to avoid permission issues)
          let upvoteCount = 0
          let userUpvoted = false

          if (userId) {
            const { data: upvoteData } = await supabase
              .from("post_upvotes")
              .select("user_id")
              .eq("post_id", postId)

            upvoteCount = upvoteData?.length ?? 0
            userUpvoted = upvoteData?.some(u => u.user_id === userId) ?? false
          }

          setPost({
            ...data,
            upvote_count: upvoteCount,
            user_upvoted: userUpvoted,
            reply_count: 0, // TODO: fetch reply count if needed
          } as Post)
        }
      } catch (err) {
        console.error("Error fetching post:", err)
      } finally {
        console.log("Setting loading to false")
        setLoading(false)
      }
    }

    fetchPost()
    return () => { document.title = "Quiet Network" }
  }, [postId, userId])

  const handleUpvote = async (postId: string) => {
    if (!post || !userId) return

    // Check if already upvoted
    const { data: existing } = await supabase
      .from("upvotes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single()

    if (existing) {
      // Remove upvote
      await supabase.from("upvotes").delete().eq("post_id", postId).eq("user_id", userId)
      setPost({ ...post, upvote_count: (post.upvote_count || 0) - 1, user_upvoted: false })
    } else {
      // Add upvote
      await supabase.from("upvotes").insert({ post_id: postId, user_id: userId })
      setPost({ ...post, upvote_count: (post.upvote_count || 0) + 1, user_upvoted: true })
    }
  }

  const handleDelete = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId)
    navigate(-1)
  }

  const handleEdit = async (postId: string, content: string, tags: string[]) => {
    const { data } = await supabase
      .from("posts")
      .update({ content, tags })
      .eq("id", postId)
      .select()
      .single()

    if (data) {
      setPost(data as Post)
    }
  }

  const handleMakePermanent = async (postId: string, permanent: boolean) => {
    if (!post) return

    const newExpiresAt = permanent
      ? 'infinity'
      : new Date(Date.now() + post.original_duration_seconds * 1000).toISOString()

    // Optimistic update
    setPost({ ...post, is_permanent: permanent, expires_at: newExpiresAt })

    const { error } = await supabase
      .from("posts")
      .update({ is_permanent: permanent, expires_at: newExpiresAt })
      .eq("id", postId)

    if (error) {
      console.error("Failed to update post permanence:", error)
      // Revert on error
      setPost(post)
    }
  }

  if (loading) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">Loading...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">Post not found.</p>
      </div>
    )
  }

  const isMember = userId ? memberCircleIds.includes(post.circle_id) : false
  const isAdminOrMod = userId ? ["admin", "moderator"].includes(circleRoles[post.circle_id] ?? "") : false
  const isAuthenticated = !!userId

  return (
    <div>
      <PostMetaTags post={post} />
      {!isAuthenticated && onJoinClick && <JoinBanner onJoin={onJoinClick} />}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {post.circles && (
          <button
            onClick={() => navigate(`/${post.circles!.slug}`)}
            className="text-sm text-quiet-accent hover:text-quiet-slate transition-colors"
          >
            View in {post.circles.name}
          </button>
        )}
      </div>
      <PostCard
        post={post}
        userId={isMember ? userId : undefined}
        isMember={isMember}
        isAdminOrMod={isAdminOrMod}
        onUpvote={isMember ? handleUpvote : undefined}
        onDelete={isMember ? handleDelete : undefined}
        onEdit={isMember ? handleEdit : undefined}
        onMakePermanent={isMember ? handleMakePermanent : undefined}
      />
    </div>
  )
}
