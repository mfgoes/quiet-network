'use client'

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Maximize2, Minimize2, MessageSquare, Send, X, ChevronDown } from "lucide-react"
import { avatarUrl } from "@/types"
import type { DMMessage } from "@/lib/hooks"
import { useConversations, useMessages, useCirclePeers } from "@/lib/hooks"
import { useDM } from "@/components/DMContext"

const MAX_SUGGESTIONS = 5

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
  compact,
}: {
  msg: DMMessage
  isMe: boolean
  otherUser?: { avatar_emoji: string; display_name: string; username: string }
  compact?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [avatarHovered, setAvatarHovered] = useState(false)

  const avatarSize = compact ? "h-5 w-5" : "h-6 w-6"

  return (
    <div className={`group relative flex ${isMe ? "justify-end" : "justify-start"}`}>
      {/* Received: show avatar */}
      {!isMe && otherUser && (
        <div
          className="relative shrink-0 mr-1.5 self-end"
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <img
            src={avatarUrl(otherUser.avatar_emoji)}
            alt=""
            className={`${avatarSize} rounded-full object-cover cursor-pointer`}
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
          className={`${compact ? "max-w-[78%]" : "max-w-[75%]"} rounded-2xl ${compact ? "px-3 py-1.5" : "px-3.5 py-2"} text-sm leading-relaxed break-words ${
            isMe
              ? "bg-quiet-slate text-white rounded-br-sm"
              : compact
                ? "bg-quiet-offwhite border border-quiet-border text-quiet-slate rounded-bl-sm"
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

// ─── Panel root ───────────────────────────────────────────────────────────────

export function DMPanel() {
  const { isOpen, activeConversationId, userId, closePanel, openPanel } = useDM()
  const [expanded, setExpanded] = useState(false)

  if (!userId) return null

  // Expanded = two-pane side-by-side layout (desktop messages center feel)
  // Collapsed = single-pane compact widget

  return (
    <div
      className={`fixed z-50 flex flex-col rounded-2xl border border-quiet-border bg-white shadow-2xl transform transition-all duration-200 ease-in-out ${
        isOpen
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none"
      } ${
        expanded
          ? "bottom-4 right-4 left-4 md:left-auto md:right-6 md:w-[700px]"
          : "bottom-4 right-4 w-80"
      }`}
      style={{ height: expanded ? "min(680px, calc(100vh - 2rem))" : "min(520px, calc(100vh - 5rem))" }}
    >
      {expanded ? (
        // ── Expanded: two-pane layout ──
        <div className="flex h-full overflow-hidden rounded-2xl">
          {/* Left: inbox */}
          <div className="flex w-60 shrink-0 flex-col border-r border-quiet-border">
            <InboxPane userId={userId} expanded onExpand={() => setExpanded(false)} />
          </div>
          {/* Right: thread or empty */}
          <div className="flex flex-1 flex-col min-w-0">
            {activeConversationId ? (
              <ThreadPane
                conversationId={activeConversationId}
                userId={userId}
                onBack={() => openPanel(undefined)}
                expanded
                onExpand={() => setExpanded(false)}
              />
            ) : (
              <EmptyThread onClose={closePanel} onCollapse={() => setExpanded(false)} />
            )}
          </div>
        </div>
      ) : (
        // ── Collapsed: single pane ──
        activeConversationId ? (
          <ThreadPane
            conversationId={activeConversationId}
            userId={userId}
            onBack={() => openPanel(undefined)}
            expanded={false}
            onExpand={() => setExpanded(true)}
          />
        ) : (
          <InboxPane userId={userId} expanded={false} onExpand={() => setExpanded(true)} />
        )
      )}
    </div>
  )
}

// ─── Inbox pane ───────────────────────────────────────────────────────────────

function InboxPane({
  userId,
  expanded,
  onExpand,
}: {
  userId: string
  expanded: boolean
  onExpand: () => void
}) {
  const { activeConversationId, openPanel, closePanel, startDM } = useDM()
  const { conversations, loading } = useConversations(userId)
  const allPeers = useCirclePeers(userId)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  const existingIds = new Set(conversations.map(c => c.otherUser.id))
  const suggestions = allPeers.filter(p => !existingIds.has(p.id))
  const visibleSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, MAX_SUGGESTIONS)
  const hasMoreSuggestions = suggestions.length > MAX_SUGGESTIONS

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-quiet-border px-4 py-2.5 shrink-0">
        <p className="text-sm font-semibold text-quiet-slate">Messages</p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onExpand}
            title={expanded ? "Collapse" : "Expand"}
            className="rounded-lg p-1 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          {!expanded && (
            <button
              onClick={closePanel}
              className="rounded-lg p-1 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <p className="mt-6 text-center text-xs text-quiet-muted">Loading…</p>
        ) : (
          <>
            {conversations.map(conv => {
              const isUnread =
                !!conv.lastMessage &&
                conv.lastMessage.sender_id !== userId &&
                conv.lastMessage.read_at === null
              const isActive = conv.id === activeConversationId

              return (
                <button
                  key={conv.id}
                  onClick={() => openPanel(conv.id)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-quiet-aged" : "hover:bg-quiet-aged/60"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatarUrl(conv.otherUser.avatar_emoji)}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    {isUnread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-quiet-accent" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${isUnread ? "font-semibold text-quiet-slate" : "text-quiet-slate"}`}>
                      {conv.otherUser.display_name}
                    </p>
                    {conv.lastMessage && (
                      <p className={`truncate text-xs ${isUnread ? "text-quiet-slate" : "text-quiet-muted"}`}>
                        {conv.lastMessage.sender_id === userId ? "You: " : ""}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}

            {suggestions.length > 0 && (
              <div className={conversations.length > 0 ? "border-t border-quiet-border mt-1 pt-1" : ""}>
                {conversations.length === 0 && (
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-sm font-medium text-quiet-slate">Start a conversation</p>
                    <p className="text-xs text-quiet-muted mt-0.5">People from your circles:</p>
                  </div>
                )}
                {conversations.length > 0 && (
                  <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-quiet-muted">
                    People in your circles
                  </p>
                )}
                {visibleSuggestions.map(peer => (
                  <button
                    key={peer.id}
                    onClick={() => startDM(peer.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-quiet-aged/60"
                  >
                    <img
                      src={avatarUrl(peer.avatar_emoji)}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-quiet-slate">{peer.display_name}</p>
                      <p className="truncate text-xs text-quiet-muted">@{peer.username}</p>
                    </div>
                  </button>
                ))}
                {hasMoreSuggestions && (
                  <button
                    onClick={() => setShowAllSuggestions(v => !v)}
                    className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${showAllSuggestions ? "rotate-180" : ""}`} />
                    {showAllSuggestions ? "Show less" : `See ${suggestions.length - MAX_SUGGESTIONS} more`}
                  </button>
                )}
              </div>
            )}

            {conversations.length === 0 && suggestions.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-2 px-4 pb-6 text-center">
                <MessageSquare className="h-7 w-7 text-quiet-border" />
                <p className="text-sm font-medium text-quiet-slate">No messages yet</p>
                <p className="text-xs text-quiet-muted">Join a circle to find people to message.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Thread pane ──────────────────────────────────────────────────────────────

function ThreadPane({
  conversationId,
  userId,
  onBack,
  expanded,
  onExpand,
}: {
  conversationId: string
  userId: string
  onBack: () => void
  expanded: boolean
  onExpand: () => void
}) {
  const { closePanel } = useDM()
  const { conversations } = useConversations(userId)
  const { messages, loading, sendMessage, markRead } = useMessages(conversationId, userId)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversation = conversations.find(c => c.id === conversationId)

  useEffect(() => {
    markRead()
  }, [messages.length, markRead])

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
    <>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-quiet-border px-3 py-2.5 shrink-0">
        {/* Back button — only in collapsed single-pane mode */}
        {!expanded && (
          <button
            onClick={onBack}
            className="rounded-lg p-1 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {conversation ? (
          <>
            <img
              src={avatarUrl(conversation.otherUser.avatar_emoji)}
              alt=""
              className="h-7 w-7 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-quiet-slate leading-tight">
                {conversation.otherUser.display_name}
              </p>
              <p className="truncate text-xs text-quiet-muted leading-tight">
                @{conversation.otherUser.username}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-0.5">
          {/* Expand/collapse only in collapsed mode — expanded mode has it in the inbox header */}
          {!expanded && (
            <button
              onClick={onExpand}
              title="Expand"
              className="rounded-lg p-1 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={closePanel}
            className="rounded-lg p-1 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-1.5">
        {loading ? (
          <p className="text-center text-xs text-quiet-muted mt-4">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 mt-8 px-4 text-center">
            {conversation && (
              <img
                src={avatarUrl(conversation.otherUser.avatar_emoji)}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <p className="text-sm font-medium text-quiet-slate">
              {conversation ? conversation.otherUser.display_name : "New conversation"}
            </p>
            <p className="text-xs text-quiet-muted">Say hello to get the conversation started!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMe={msg.sender_id === userId}
              otherUser={conversation?.otherUser}
              compact
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-quiet-border px-3 py-2.5 shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); handleSend() }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            className="flex-1 rounded-full border border-quiet-border bg-quiet-offwhite px-3.5 py-1.5 text-sm text-quiet-slate placeholder:text-quiet-muted/50 focus:border-quiet-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-quiet-slate text-white transition-colors hover:bg-quiet-accent disabled:opacity-40"
          >
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>
    </>
  )
}

// ─── Empty thread (expanded mode, no conversation selected) ───────────────────

function EmptyThread({ onClose }: { onClose: () => void; onCollapse: () => void }) {
  return (
    <>
      <div className="flex items-center justify-end border-b border-quiet-border px-3 py-2.5 shrink-0 gap-0.5">
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <MessageSquare className="h-9 w-9 text-quiet-border" />
        <p className="text-sm text-quiet-muted">Select a conversation</p>
      </div>
    </>
  )
}
