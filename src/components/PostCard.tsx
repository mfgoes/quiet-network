import { useMemo, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { Pin, Clock, ChevronUp, Trash2, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { LinkPreview } from "@/components/LinkPreview"
import { extractYouTubeId } from "@/components/YouTubeEmbed"
import { extractMapCoords, isGoogleMapsUrl } from "@/components/GoogleMapsEmbed"
import { parseMarkdown, extractMarkdownUrls } from "@/lib/markdown"
import { CircleIcon } from "@/components/CircleIcon"
import { ReplySection } from "@/components/ReplySection"
import type { Post } from "@/types"
import { avatarUrl, getTagDef } from "@/types"

interface PostCardProps {
  post: Post
  userId?: string
  isMember?: boolean
  isAdminOrMod?: boolean
  onUpvote?: (postId: string) => void
  onDelete?: (postId: string) => void
}

function formatRelativeAge(createdAt: string): string {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(elapsed / (1000 * 60))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getExpiryInfo(post: Post): { label: string; isUrgent: boolean } | null {
  if (post.is_welcome) return null

  const remaining = new Date(post.expires_at).getTime() - Date.now()
  if (remaining <= 0) return null

  const hours = remaining / (1000 * 60 * 60)

  if (hours < 1) return { label: `expires in <1h`, isUrgent: true }
  if (hours < 24) return { label: `expires in ${Math.round(hours)}h`, isUrgent: true }

  const days = Math.floor(hours / 24)
  return { label: `${days}d left`, isUrgent: false }
}

/** Subtle background tint: older posts get a very slight gray tint */
function getAgeTint(post: Post): string {
  if (post.is_welcome) return "bg-white"

  const elapsed = Date.now() - new Date(post.created_at).getTime()
  const original = post.original_duration_seconds * 1000
  if (original <= 0) return "bg-white"

  const progress = Math.min(1, elapsed / original)

  // Only shift to the aged tint in the last third of the post's life
  if (progress < 0.66) return "bg-white"
  return "bg-quiet-aged"
}

/** Check if content looks like HTML (from rich editor) vs plain text */
function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content)
}

/** Extract unique URLs from HTML anchor tags */
function extractUrls(content: string): string[] {
  const urls: string[] = []
  const regex = /href="(https?:\/\/[^"]+)"/g
  let match
  while ((match = regex.exec(content)) !== null) {
    if (!urls.includes(match[1])) {
      urls.push(match[1])
    }
  }
  return urls
}

/** Extract URLs from plain text / markdown */
function extractPlainTextUrls(content: string): string[] {
  return extractMarkdownUrls(content)
}

/** Check if a URL will be rendered as a rich embed (maps, youtube). */
function isRichEmbed(url: string): boolean {
  if (extractYouTubeId(url)) return true
  if (extractMapCoords(url)) return true
  if (isGoogleMapsUrl(url)) return true
  return false
}

/**
 * Remove anchor tags for rich-embed URLs from rendered HTML.
 * If a <p> becomes empty after removal, strip the whole <p>.
 */
function stripRichEmbedLinks(html: string, urls: string[]): string {
  const richUrls = urls.filter(isRichEmbed)
  if (richUrls.length === 0) return html

  let result = html
  for (const url of richUrls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Remove <a> tags whose href matches and text content is the URL itself
    result = result.replace(
      new RegExp(`<a\\s[^>]*href="${escaped}"[^>]*>${escaped}</a>`, "g"),
      ""
    )
    // Also handle HTML-escaped versions of the URL
    const htmlEscaped = url.replace(/&/g, "&amp;").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    if (htmlEscaped !== escaped) {
      result = result.replace(
        new RegExp(`<a\\s[^>]*href="${htmlEscaped}"[^>]*>${htmlEscaped}</a>`, "g"),
        ""
      )
    }
  }
  // Remove <p> tags that are now empty (or whitespace-only)
  result = result.replace(/<p>\s*<\/p>/g, "")
  return result
}

function CircleBadge({ name, slug, description, avatarUrl }: { name: string; slug: string; description?: string; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Link
          to={`/${slug}`}
          className="flex items-center gap-1 rounded-full bg-quiet-border/40 px-2 py-0.5 text-[11px] text-quiet-muted transition-colors hover:bg-quiet-border/70 hover:text-quiet-slate"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <CircleIcon name={name} avatarUrl={avatarUrl} size="xs" />
          <span>{name}</span>
        </Link>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="max-w-[220px] pointer-events-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="text-xs font-medium text-quiet-slate">{name}</p>
        {description && (
          <p className="mt-0.5 text-xs text-quiet-muted">{description}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function PostCard({ post, userId, isMember, isAdminOrMod, onUpvote, onDelete }: PostCardProps) {
  const age = useMemo(() => formatRelativeAge(post.created_at), [post.created_at])
  const expiry = useMemo(() => getExpiryInfo(post), [post.expires_at, post.is_welcome])
  const bgClass = useMemo(() => getAgeTint(post), [post])
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [replyCountDelta, setReplyCountDelta] = useState(0)

  const handleReplyCountChange = useCallback((delta: number) => {
    setReplyCountDelta((prev) => prev + delta)
  }, [])

  const isHtml = useMemo(() => isHtmlContent(post.content), [post.content])
  const linkUrls = useMemo(
    () => (isHtml ? extractUrls(post.content) : extractPlainTextUrls(post.content)),
    [post.content, isHtml]
  )

  const authorName = post.profiles?.display_name ?? "Neighbor"
  const authorAvatar = post.profiles?.avatar_emoji ?? "house"
  const authorUsername = post.profiles?.username
  const isOwn = userId === post.author_id

  return (
    <div className={`group relative overflow-hidden rounded-lg border border-quiet-border p-4 shadow-sm ${bgClass}`}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {authorUsername ? (
            <Link to={`/user/${authorUsername}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={avatarUrl(authorAvatar)}
                alt="avatar"
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-quiet-slate">
                {authorName}
              </span>
            </Link>
          ) : (
            <>
              <img
                src={avatarUrl(authorAvatar)}
                alt="avatar"
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-quiet-slate">
                {authorName}
              </span>
            </>
          )}
          {post.circles && (
            <CircleBadge
              name={post.circles.name}
              slug={post.circles.slug}
              description={post.circles.description ?? undefined}
              avatarUrl={post.circles.avatar_url}
            />
          )}
          <span className="text-xs text-quiet-muted">{age}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {post.is_welcome && (
            <Badge variant="pinned">
              <Pin className="mr-1 h-3 w-3" />
              Pinned
            </Badge>
          )}
          {expiry && (
            <Badge variant={expiry.isUrgent ? "expiring" : "default"}>
              {expiry.isUrgent && <Clock className="mr-1 h-3 w-3" />}
              {expiry.label}
            </Badge>
          )}
          {(isOwn || isAdminOrMod) && onDelete && !post.is_welcome && (
            <button
              onClick={() => onDelete(post.id)}
              className="hidden rounded p-1 text-quiet-muted transition-colors hover:bg-quiet-border/50 hover:text-quiet-warm group-hover:inline-flex"
              aria-label="Delete post"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isHtml ? (
        <div
          className="post-content text-sm leading-relaxed text-quiet-slate"
          dangerouslySetInnerHTML={{ __html: stripRichEmbedLinks(post.content, linkUrls) }}
        />
      ) : (
        <div
          className="post-content text-sm leading-relaxed text-quiet-slate"
          dangerouslySetInnerHTML={{ __html: stripRichEmbedLinks(parseMarkdown(post.content), linkUrls) }}
        />
      )}

      {/* Link previews */}
      {linkUrls.length > 0 && (
        <div className="mt-1">
          {linkUrls.map((url) => (
            <LinkPreview key={url} url={url} />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map((tagId) => {
            const tag = getTagDef(tagId)
            if (!tag) return null
            return (
              <span
                key={tagId}
                className="rounded-full px-2 py-0.5 text-[11px] text-quiet-slate"
                style={{ backgroundColor: tag.color }}
              >
                {tag.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Upvote + Reply */}
      {onUpvote && !post.is_welcome && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onUpvote(post.id)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              post.user_upvoted
                ? "bg-quiet-accent/20 text-quiet-slate"
                : "bg-quiet-border/60 text-quiet-muted hover:bg-quiet-border hover:text-quiet-slate"
            }`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            {post.upvote_count > 0 && <span>{post.upvote_count}</span>}
          </button>
          <button
            onClick={() => setRepliesOpen((prev) => !prev)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              repliesOpen
                ? "bg-quiet-accent/20 text-quiet-slate"
                : "bg-quiet-border/60 text-quiet-muted hover:bg-quiet-border hover:text-quiet-slate"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {(post.reply_count + replyCountDelta) > 0 && (
              <span>{post.reply_count + replyCountDelta}</span>
            )}
          </button>
        </div>
      )}

      {/* Reply thread */}
      {repliesOpen && !post.is_welcome && (
        <div className="mt-3">
          <ReplySection
            postId={post.id}
            userId={userId}
            isMember={isMember}
            isAdminOrMod={isAdminOrMod}
            onReplyCountChange={handleReplyCountChange}
          />
        </div>
      )}
    </div>
  )
}
