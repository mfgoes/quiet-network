'use client'

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Reply } from "@/types"
import { avatarUrl } from "@/types"

interface ReplyCardProps {
  reply: Reply
  userId?: string
  isAdminOrMod?: boolean
  onUpvote?: (replyId: string) => void
  onDelete?: (replyId: string) => void
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

export function ReplyCard({ reply, userId, isAdminOrMod, onUpvote, onDelete }: ReplyCardProps) {
  const age = useMemo(() => formatRelativeAge(reply.created_at), [reply.created_at])
  const [upvoteAnimating, setUpvoteAnimating] = useState(false)
  const router = useRouter()

  const handleProfileClick = useCallback((username: string) => {
    if (!userId) {
      toast.info("Log in to view profiles")
      return
    }
    router.push(`/user/${username}`)
  }, [userId, router])

  const handleUpvoteClick = useCallback((replyId: string) => {
    setUpvoteAnimating(true)
    onUpvote?.(replyId)
    // Reset animation state after animation completes (350ms)
    const timer = setTimeout(() => setUpvoteAnimating(false), 350)
    return () => clearTimeout(timer)
  }, [onUpvote])

  const authorName = reply.profiles?.display_name ?? "Neighbor"
  const authorAvatar = reply.profiles?.avatar_emoji ?? "house"
  const authorUsername = reply.profiles?.username
  const isOwn = userId === reply.author_id

  return (
    <div className="group flex gap-2.5 py-2">
      {authorUsername ? (
        <button onClick={() => handleProfileClick(authorUsername)} className="shrink-0">
          <img src={avatarUrl(authorAvatar)} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
        </button>
      ) : (
        <img src={avatarUrl(authorAvatar)} alt="avatar" className="h-6 w-6 shrink-0 rounded-full object-cover" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {authorUsername ? (
            <button onClick={() => handleProfileClick(authorUsername)} className="text-xs font-medium text-quiet-slate hover:opacity-80 transition-opacity">
              {authorName}
            </button>
          ) : (
            <span className="text-xs font-medium text-quiet-slate">{authorName}</span>
          )}
          <span className="text-[11px] text-quiet-muted">{age}</span>
          {(isOwn || isAdminOrMod) && onDelete && (
            <button
              onClick={() => onDelete(reply.id)}
              className="hidden rounded p-0.5 text-quiet-muted transition-colors hover:text-quiet-warm group-hover:inline-flex"
              aria-label="Delete reply"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        <p className="mt-0.5 text-sm leading-relaxed text-quiet-slate whitespace-pre-wrap break-words">
          {reply.content}
        </p>

        {onUpvote && (
          <button
            onClick={() => handleUpvoteClick(reply.id)}
            className={`mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
              reply.user_upvoted
                ? "bg-quiet-accent/20 text-quiet-slate"
                : "bg-quiet-border/60 text-quiet-muted hover:bg-quiet-border hover:text-quiet-slate"
            }`}
          >
            <ChevronUp className={`h-3 w-3 ${upvoteAnimating ? "upvote-jump" : ""}`} />
            {reply.upvote_count > 0 && <span>{reply.upvote_count}</span>}
          </button>
        )}
      </div>
    </div>
  )
}
