'use client'

import { useState } from "react"
import { useReplies } from "@/lib/hooks"
import { ReplyCard } from "@/components/ReplyCard"

interface ReplySectionProps {
  postId: string
  userId?: string
  isMember?: boolean
  isAdminOrMod?: boolean
  onReplyCountChange?: (delta: number) => void
}

export function ReplySection({ postId, userId, isMember, isAdminOrMod, onReplyCountChange }: ReplySectionProps) {
  const { replies, loading, createReply, deleteReply, toggleReplyUpvote } = useReplies(postId, userId)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || !userId || submitting) return
    setSubmitting(true)
    const error = await createReply(content.trim(), userId)
    if (!error) {
      setContent("")
      onReplyCountChange?.(1)
    }
    setSubmitting(false)
  }

  const handleDelete = async (replyId: string) => {
    const error = await deleteReply(replyId)
    if (!error) {
      onReplyCountChange?.(-1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-quiet-border/60 pt-3">
      {loading ? (
        <p className="text-xs text-quiet-muted">Loading replies...</p>
      ) : (
        <>
          {replies.length > 0 && (
            <div className="divide-y divide-quiet-border/40">
              {replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  userId={userId}
                  isAdminOrMod={isAdminOrMod}
                  onUpvote={isMember ? toggleReplyUpvote : undefined}
                  onDelete={isMember ? handleDelete : undefined}
                />
              ))}
            </div>
          )}

          {isMember && userId && (
            <div className="mt-2 flex gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-quiet-border bg-white px-3 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted focus:border-quiet-accent focus:outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="shrink-0 rounded-lg bg-quiet-slate px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-quiet-accent disabled:opacity-40"
              >
                Reply
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
