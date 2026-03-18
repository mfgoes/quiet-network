import { Home, Compass, Bell, MessageSquare } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { avatarUrl } from "@/types"
import { useDM } from "@/components/DMContext"

interface BottomNavProps {
  avatar: string
  unreadCount?: number
  unreadDmCount?: number
}

export function BottomNav({ avatar, unreadCount = 0, unreadDmCount = 0 }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const { openPanel } = useDM()

  const isHome = path === "/" || (
    path !== "/explore" &&
    path !== "/notifications" &&
    path !== "/profile" &&
    path !== "/about" &&
    !path.startsWith("/user/") &&
    !path.startsWith("/messages")
  )
  const isExplore       = path === "/explore"
  const isMessages      = path.startsWith("/messages")
  const isNotifications = path === "/notifications"
  const isProfile       = path === "/profile"

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-quiet-border bg-quiet-offwhite md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around py-2">
        {/* Home */}
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isHome ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>

        {/* Explore */}
        <button
          onClick={() => navigate("/explore")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isExplore ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <Compass className="h-5 w-5" />
          <span>Explore</span>
        </button>

        {/* Messages */}
        <button
          onClick={() => openPanel()}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isMessages ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <span className="relative">
            <MessageSquare className="h-5 w-5" />
            {unreadDmCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-quiet-accent text-white text-[9px] font-bold leading-none">
                {unreadDmCount > 9 ? "·" : unreadDmCount}
              </span>
            )}
          </span>
          <span>Messages</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isNotifications ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <span className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                {unreadCount > 9 ? "·" : unreadCount}
              </span>
            )}
          </span>
          <span>Alerts</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isProfile ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <img
            src={avatarUrl(avatar)}
            alt="profile"
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  )
}
