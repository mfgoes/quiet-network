import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom" // Import useNavigate
import { Pin, Clock, ChevronUp, Trash2, MessageSquare, ChevronDown, Archive, Pencil, Link2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { LinkPreview } from "@/components/LinkPreview"
import { extractYouTubeId } from "@/components/YouTubeEmbed"
import { extractMapCoords, isGoogleMapsUrl } from "@/components/GoogleMapsEmbed"
import { parseMarkdown, extractMarkdownUrls } from "@/lib/markdown"
import { CircleIcon } from "@/components/CircleIcon"
import { ReplySection } from "@/components/ReplySection"
import type { Post } from "@/types"
import { avatarUrl, getTagDef, TAGS } from "@/types"

interface PostCardProps {
  post: Post
  userId?: string
  isMember?: boolean
  isAdminOrMod?: boolean
  onUpvote?: (postId: string) => void
  onDelete?: (postId: string) => void
  onEdit?: (postId: string, content: string, tags: string[]) => void
  onMakePermanent?: (postId: string, permanent: boolean) => void
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

function canEdit(post: Post): boolean {
  const elapsed = Date.now() - new Date(post.created_at).getTime()
  const minutes = Math.floor(elapsed / (1000 * 60))
  return minutes < 30
}

function getExpiryInfo(post: Post): { label: string; isUrgent: boolean } | null {
  if (post.is_welcome || post.is_permanent) return null

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
  if (post.is_welcome || post.is_permanent) return "bg-white"

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

export function PostCard({ post, userId, isMember, isAdminOrMod, onUpvote, onDelete, onEdit, onMakePermanent }: PostCardProps) {
  const age = useMemo(() => formatRelativeAge(post.created_at), [post.created_at])
  const expiry = useMemo(() => getExpiryInfo(post), [post.expires_at, post.is_welcome])
  const bgClass = useMemo(() => getAgeTint(post), [post])
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [replyCountDelta, setReplyCountDelta] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsExpand, setNeedsExpand] = useState(false)
  const [upvoteAnimating, setUpvoteAnimating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editTags, setEditTags] = useState<string[]>(post.tags || [])
  const contentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate() // Initialize useNavigate

  const handleReplyCountChange = useCallback((delta: number) => {
    setReplyCountDelta((prev) => prev + delta)
  }, [])

  const handleUpvoteClick = useCallback((postId: string) => {
    setUpvoteAnimating(true)
    onUpvote?.(postId)
    // Reset animation state after animation completes (350ms)
    const timer = setTimeout(() => setUpvoteAnimating(false), 350)
    return () => clearTimeout(timer)
  }, [onUpvote])

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setEditContent(post.content)
    setEditTags(post.tags || [])
  }, [post.content, post.tags])

  const handleSaveEdit = useCallback(async () => {
    if (!editContent.trim() || !onEdit) return
    await onEdit(post.id, editContent, editTags)
    setIsEditing(false)
  }, [editContent, editTags, onEdit, post.id])

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditContent(post.content)
    setEditTags(post.tags || [])
  }, [post.content, post.tags])

  const toggleEditTag = useCallback((tagId: string) => {
    setEditTags((prev) => {
      if (prev.includes(tagId)) return prev.filter((t) => t !== tagId)
      if (prev.length >= 3) return prev
      return [...prev, tagId]
    })
  }, [])

  const isHtml = useMemo(() => isHtmlContent(post.content), [post.content])
  const linkUrls = useMemo(
    () => (isHtml ? extractUrls(post.content) : extractPlainTextUrls(post.content)),
    [post.content, isHtml]
  )

  // Filter to keep only the first Google Maps link to avoid clutter
  const filteredLinkUrls = useMemo(() => {
    let mapsFound = false
    return linkUrls.filter((url) => {
      const isMaps = isGoogleMapsUrl(url)
      if (isMaps) {
        if (mapsFound) return false // Skip subsequent maps links
        mapsFound = true
      }
      return true
    })
  }, [linkUrls])

  // Check if content exceeds height threshold (~19 lines)
  useEffect(() => {
    if (contentRef.current) {
      const MAX_HEIGHT = 400 // roughly 19 lines of text-sm leading-relaxed
      const contentHeight = contentRef.current.scrollHeight
      setNeedsExpand(contentHeight > MAX_HEIGHT)
    }
  }, [post.content, filteredLinkUrls])

  const authorName = post.profiles?.display_name ?? "Neighbor"
  const authorAvatar = post.profiles?.avatar_emoji ?? "house"
  const authorUsername = post.profiles?.username
  const isOwn = userId === post.author_id

  const postDetailUrl = post.circles?.slug ? `/${post.circles.slug}/p/${post.id}` : `/p/${post.id}`;

  const handleCardClick = useCallback(() => {
    // Only navigate if not in editing mode
    if (!isEditing) {
      navigate(postDetailUrl);
    }
  }, [isEditing, navigate, postDetailUrl]);

  return (
    <div className="relative">
      <div
        className={`group relative overflow-hidden rounded-lg border border-quiet-border p-4 shadow-sm ${bgClass} hover:bg-quiet-border/20 transition-colors cursor-pointer`}
        onClick={handleCardClick} // Make the entire div clickable
      >
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {authorUsername ? (
              <Link to={`/user/${authorUsername}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
              <div onClick={(e) => e.stopPropagation()}> {/* Stop propagation for the Popover/Link inside CircleBadge */}
                <CircleBadge
                  name={post.circles.name}
                  slug={post.circles.slug}
                  description={post.circles.description ?? undefined}
                  avatarUrl={post.circles.avatar_url}
                />
              </div>
            )}
            <span className="text-xs text-quiet-muted">{age}</span>
            {post.edited && (
              <span className="text-xs text-quiet-muted italic">(edited)</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {post.is_welcome && (
              <Badge variant="pinned">
                <Pin className="mr-1 h-3 w-3" />
                Pinned
              </Badge>
            )}
            {post.is_permanent && !post.is_welcome && (
              <Badge variant="permanent">
                <Archive className="mr-1 h-3 w-3" />
                Permanent
              </Badge>
            )}
            {expiry && (
              <Badge variant={expiry.isUrgent ? "expiring" : "default"}>
                {expiry.isUrgent && <Clock className="mr-1 h-3 w-3" />}
                {expiry.label}
              </Badge>
            )}
            {isAdminOrMod && onMakePermanent && !post.is_welcome && (
              post.is_permanent ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onMakePermanent(post.id, false); }}
                  className="hidden rounded p-1 text-quiet-muted transition-colors hover:bg-quiet-border/50 hover:text-quiet-slate group-hover:inline-flex"
                  title="Make ephemeral"
                  aria-label="Make ephemeral"
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onMakePermanent(post.id, true); }}
                  className="hidden rounded p-1 text-quiet-muted transition-colors hover:bg-quiet-border/50 hover:text-quiet-slate group-hover:inline-flex"
                  title="Make permanent"
                  aria-label="Make permanent"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
              )
            )}
            {post.circles?.slug && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/${post.circles?.slug}/p/${post.id}`
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    // Could add toast notification here
                  }).catch(() => {
                    // Silently fail if clipboard not available
                  })
                }}
                className="hidden rounded p-1 text-quiet-muted transition-colors hover:bg-quiet-border/50 hover:text-quiet-slate group-hover:inline-flex"
                aria-label="Copy link"
                title="Copy link"
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>
            )}
            {isOwn && canEdit(post) && onEdit && !post.is_welcome && (
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="hidden rounded p-1 text-quiet-muted transition-colors hover:bg-quiet-border/50 hover:text-quiet-accent group-hover:inline-flex"
                aria-label="Edit post"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {(isOwn || isAdminOrMod) && onDelete && !post.is_welcome && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                className="hidden rounded p-1 text-quiet-muted transition-colors hover:bg-quiet-border/50 hover:text-quiet-warm group-hover:inline-flex"
                aria-label="Delete post"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content with height limiting */}
        {isEditing ? (
          // Edit mode
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}> {/* Stop propagation for edit mode */}
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[120px] resize-none rounded-md border border-quiet-accent bg-quiet-offwhite p-3 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />

            {/* Tag selector in edit mode */}
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => {
                const isSelected = editTags.includes(tag.id)
                const isDisabled = !isSelected && editTags.length >= 3
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleEditTag(tag.id)}
                    disabled={isDisabled}
                    className={`rounded-full px-2.5 py-0.5 text-xs transition-all ${
                      isSelected
                        ? "text-quiet-slate ring-1 ring-quiet-accent"
                        : isDisabled
                          ? "text-quiet-muted/50 opacity-50 cursor-not-allowed"
                          : "text-quiet-slate hover:ring-1 hover:ring-quiet-border"
                    }`}
                    style={{ backgroundColor: isSelected ? tag.color : `${tag.color}80` }}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="rounded-md px-3 py-1.5 text-sm text-quiet-muted hover:bg-quiet-border/50 hover:text-quiet-slate"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="rounded-md bg-quiet-accent px-3 py-1.5 text-sm text-white hover:bg-quiet-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          // Normal view mode
          <div className="relative">
            <div
              ref={contentRef}
              className={`transition-all ${
                needsExpand && !isExpanded ? "max-h-[400px] overflow-hidden" : ""
              }`}
            >
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
              {filteredLinkUrls.length > 0 && (
                <div className="mt-1">
                  {filteredLinkUrls.map((url) => (
                    <LinkPreview key={url} url={url} />
                  ))}
                </div>
              )}
            </div>

            {/* Gradient fade when collapsed */}
            {needsExpand && !isExpanded && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t ${
                  bgClass === "bg-white" ? "from-white" : "from-quiet-aged"
                } to-transparent pointer-events-none`}
              />
            )}
          </div>
        )}

        {/* Expand/Collapse button */}
        {needsExpand && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded((prev) => !prev); }}
            className="mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors bg-quiet-border/60 text-quiet-muted hover:bg-quiet-border hover:text-quiet-slate"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Show more</span>
              </>
            )}
          </button>
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
      </div>

      {/* Upvote + Reply */}
      {onUpvote && !post.is_welcome && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleUpvoteClick(post.id); }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              post.user_upvoted
                ? "bg-quiet-accent/20 text-quiet-slate"
                : "bg-quiet-border/60 text-quiet-muted hover:bg-quiet-border hover:text-quiet-slate"
            }`}
          >
            <ChevronUp className={`h-3.5 w-3.5 ${upvoteAnimating ? "upvote-jump" : ""}`} />
            {post.upvote_count > 0 && <span>{post.upvote_count}</span>}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setRepliesOpen((prev) => !prev); }}
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
