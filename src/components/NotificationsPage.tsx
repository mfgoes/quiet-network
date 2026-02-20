import { MessageCircle, ArrowUp, AtSign, Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useNotifications } from "@/lib/hooks"
import type { Notification } from "@/types"
import { avatarUrl } from "@/types"

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function actionText(n: Notification): string {
  switch (n.type) {
    case "reply":      return "replied to your post"
    case "upvote":     return "upvoted your post"
    case "mention":    return "mentioned you"
    case "circle_post":
      return n.post?.circles?.name
        ? `posted in ${n.post.circles.name}`
        : "posted in your circle"
  }
}

const TYPE_ICON = {
  reply:       MessageCircle,
  upvote:      ArrowUp,
  mention:     AtSign,
  circle_post: Bell,
} as const

interface NotificationsPageProps {
  userId: string
}

export function NotificationsPage({ userId }: NotificationsPageProps) {
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(userId)

  const handleClick = (n: Notification) => {
    markAsRead(n.id)
    if (n.post_id) {
      const slug = n.post?.circles?.slug
      navigate(slug ? `/${slug}/p/${n.post_id}` : `/p/${n.post_id}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-quiet-slate">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-quiet-accent hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && (
        <p className="text-center text-sm text-quiet-muted py-8">Loading…</p>
      )}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-quiet-muted">
          <Bell className="h-8 w-8 opacity-30" />
          <p className="text-sm">No notifications yet</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-1">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type]
            const actor = n.actor
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  n.read
                    ? "bg-white hover:bg-quiet-aged"
                    : "bg-blue-50 hover:bg-blue-100"
                }`}
              >
                {/* Actor avatar or icon */}
                <div className="relative mt-0.5 shrink-0">
                  {actor ? (
                    <img
                      src={avatarUrl(actor.avatar_emoji)}
                      alt={actor.display_name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-quiet-aged flex items-center justify-center">
                      <Icon className="h-4 w-4 text-quiet-muted" />
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon className="h-2.5 w-2.5 text-quiet-accent" />
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-quiet-slate">
                    <span className="font-medium">
                      {actor?.display_name ?? "Someone"}
                    </span>{" "}
                    {actionText(n)}
                  </p>
                  {n.post?.content && (
                    <p className="text-xs text-quiet-muted mt-0.5 line-clamp-1">
                      {n.post.content}
                    </p>
                  )}
                  <p className="text-xs text-quiet-muted mt-0.5">
                    {timeAgo(n.created_at)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
