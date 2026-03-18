import { Link } from "react-router-dom"
import { CircleIcon } from "@/components/CircleIcon"
import { parseMarkdown } from "@/lib/markdown"
import type { Post } from "@/types"

interface PostPreviewCardProps {
  post: Post
}

export function PostPreviewCard({ post }: PostPreviewCardProps) {
  const html = /<[a-z][\s\S]*>/i.test(post.content)
    ? post.content
    : parseMarkdown(post.content)

  return (
    <Link
      to={post.circles ? `/${post.circles.slug}/p/${post.id}` : `/p/${post.id}`}
      className="block rounded-xl border border-quiet-border bg-white p-3 hover:border-quiet-accent/40 transition-colors"
    >
      {post.circles && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <CircleIcon name={post.circles.name} avatarUrl={post.circles.avatar_url} size="xs" />
          <span className="text-xs text-quiet-muted">{post.circles.name}</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className="flex-1 min-w-0 text-sm text-quiet-slate line-clamp-3 leading-snug prose prose-sm max-w-none prose-p:my-0 prose-headings:my-0 prose-ul:my-0 prose-li:my-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        )}
      </div>
    </Link>
  )
}
