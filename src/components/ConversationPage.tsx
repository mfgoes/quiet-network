import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Send } from "lucide-react"
import { avatarUrl } from "@/types"
import { useMessages, useConversations } from "@/lib/hooks"

export function ConversationPage({ userId }: { userId: string }) {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
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
          onClick={() => navigate("/messages")}
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
          messages.map(msg => {
            const isMe = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
                    isMe
                      ? "bg-quiet-slate text-white rounded-br-sm"
                      : "bg-white border border-quiet-border text-quiet-slate rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })
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
