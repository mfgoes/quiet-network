'use client'

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"
import { avatarUrl } from "@/types"
import type { DMMessage } from "@/lib/hooks"
import { useMessages, useConversations } from "@/lib/hooks"

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return time
  if (diffDays === 1) return `Yesterday ${time}`
  if (diffDays < 7) return `${d.toLocaleDateString([], { weekday: "short" })} ${time}`
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`
}

function ProfileHoverCard({
  avatar,
  displayName,
  username,
}: {
  avatar: string
  displayName: string
  username: string
}) {
  return (
    <div className="absolute bottom-full left-0 mb-1.5 z-10 rounded-xl border border-quiet-border bg-white px-3 py-2.5 shadow-lg pointer-events-none w-48">
      <div className="flex items-center gap-2">
        <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-quiet-slate leading-tight">{displayName}</p>
          <p className="truncate text-xs text-quiet-muted leading-tight">@{username}</p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  msg,
  isMe,
  otherUser,
}: {
  msg: DMMessage
  isMe: boolean
  otherUser?: { avatar_emoji: string; display_name: string; username: string }
}) {
  const [hovered, setHovered] = useState(false)
  const [avatarHovered, setAvatarHovered] = useState(false)

  return (
    <div className={`group relative flex ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && otherUser && (
        <div
          className="relative shrink-0 mr-2 self-end"
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <img
            src={avatarUrl(otherUser.avatar_emoji)}
            alt=""
            className="h-6 w-6 rounded-full object-cover cursor-pointer"
          />
          {avatarHovered && (
            <ProfileHoverCard
              avatar={avatarUrl(otherUser.avatar_emoji)}
              displayName={otherUser.display_name}
              username={otherUser.username}
            />
          )}
        </div>
      )}
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
            isMe
              ? "bg-quiet-slate text-white rounded-br-sm"
              : "bg-white border border-quiet-border text-quiet-slate rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>
        {hovered && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-quiet-slate px-2 py-1 text-[10px] text-white shadow-md ${
              isMe ? "right-full mr-2" : "left-full ml-2"
            }`}
          >
            {formatMessageTime(msg.created_at)}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConversationPage({ userId }: { userId: string }) {
  const params = useParams()
  const conversationId = params.conversationId as string | undefined
  const router = useRouter()
  const { messages, loading, sendMessage, markRead } = useMessages(conversationId, userId)
  const { conversations } = useConversations(userId)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversation = conversations.find(c => c.id === conversationId)

  // Mark messages as read on open and when new ones arrive
  useEffect(() => {
    markRead()
  }, [messages.length, markRead])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    await sendMessage(text)
    setText("")
    setSending(false)
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 border-b border-quiet-border shrink-0">
        <button
          onClick={() => router.push("/messages")}
          className="p-1 rounded-lg text-quiet-muted hover:text-quiet-slate hover:bg-quiet-aged transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {conversation ? (
          <>
            <img
              src={avatarUrl(conversation.otherUser.avatar_emoji)}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-quiet-slate">{conversation.otherUser.display_name}</p>
              <p className="text-xs text-quiet-muted">@{conversation.otherUser.username}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-quiet-muted">Loading...</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {loading ? (
          <p className="text-center text-sm text-quiet-muted mt-6">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-quiet-muted mt-6 italic">No messages yet. Say hello!</p>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={msg.sender_id === userId}
              otherUser={conversation?.otherUser}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-quiet-border shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); handleSend() }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 rounded-full border border-quiet-border bg-white px-4 py-2 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-quiet-slate text-white transition-colors hover:bg-quiet-accent disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
