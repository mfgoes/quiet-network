import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PostCard } from "@/components/PostCard"
import { PostMetaTags } from "@/components/PostMetaTags"
import { Button } from "@/components/ui/button"
import type { Post } from "@/types"

interface PostDetailRouteProps {
  userId: string
  memberCircleIds: string[]
  circleRoles?: Record<string, string>
}

export function PostDetailRoute({ userId, memberCircleIds, circleRoles = {} }: PostDetailRouteProps) {
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
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(display_name, avatar_emoji, username, is_bot), circles(name, slug, description, avatar_url)")
        .eq("id", postId)
        .single()

      if (!error && data) {
        // Enrich with upvote data
        const { data: upvoteData } = await supabase
          .from("post_upvotes")
          .select("user_id")
          .eq("post_id", postId)

        const upvoteCount = upvoteData?.length ?? 0
        const userUpvoted = upvoteData?.some(u => u.user_id === userId) ?? false

        setPost({
          ...data,
          upvote_count: upvoteCount,
          user_upvoted: userUpvoted,
          reply_count: 0, // TODO: fetch reply count if needed
        } as Post)
      }
      setLoading(false)
    }

    fetchPost()
  }, [postId])

  const handleUpvote = async (postId: string) => {
    if (!post) return

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
      setPost({ ...post, upvote_count: (post.upvote_count || 0) - 1 })
    } else {
      // Add upvote
      await supabase.from("upvotes").insert({ post_id: postId, user_id: userId })
      setPost({ ...post, upvote_count: (post.upvote_count || 0) + 1 })
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

  const handleMakePermanent = async (postId: string) => {
    const { data } = await supabase
      .from("posts")
      .update({ expires_at: null })
      .eq("id", postId)
      .select()
      .single()

    if (data) {
      setPost(data as Post)
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

  const isMember = memberCircleIds.includes(post.circle_id)
  const isAdminOrMod = ["admin", "moderator"].includes(circleRoles[post.circle_id] ?? "")

  return (
    <div>
      <PostMetaTags post={post} />
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
