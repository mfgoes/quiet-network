'use client'

import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { avatarUrl } from "@/types"
import { useConversations } from "@/lib/hooks"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${Math.max(1, m)}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function MessagesPage({ userId }: { userId: string }) {
  const router = useRouter()
  const { conversations, loading } = useConversations(userId)

  if (loading) {
    return <p className="mt-6 text-center text-sm text-quiet-muted">Loading...</p>
  }

  if (conversations.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <MessageSquare className="h-10 w-10 text-quiet-border" />
        <p className="text-sm font-medium text-quiet-slate">No messages yet</p>
        <p className="text-xs text-quiet-muted">Visit someone's profile to start a conversation.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-quiet-slate">Messages</h1>
      <div className="space-y-1">
        {conversations.map(conv => {
          const isUnread =
            !!conv.lastMessage &&
            conv.lastMessage.sender_id !== userId &&
            conv.lastMessage.read_at === null

          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/messages/${conv.id}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-quiet-border bg-white p-3 text-left transition-colors hover:border-quiet-accent/40"
            >
              <div className="relative shrink-0">
                <img
                  src={avatarUrl(conv.otherUser.avatar_emoji)}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                {isUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-quiet-accent border-2 border-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`text-sm truncate ${isUnread ? "font-semibold text-quiet-slate" : "text-quiet-slate"}`}>
                    {conv.otherUser.display_name}
                  </p>
                  {conv.lastMessage && (
                    <span className="shrink-0 text-xs text-quiet-muted">
                      {timeAgo(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                {conv.lastMessage ? (
                  <p className={`text-xs truncate mt-0.5 ${isUnread ? "text-quiet-slate" : "text-quiet-muted"}`}>
                    {conv.lastMessage.sender_id === userId ? "You: " : ""}
                    {conv.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-xs text-quiet-muted/60 mt-0.5 italic">No messages yet</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
