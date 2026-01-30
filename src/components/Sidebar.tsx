import { useState } from "react"
import { Home, Compass, User, ChevronDown } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { avatarUrl } from "@/types"
import { CircleIcon } from "@/components/CircleIcon"
import type { Circle, Profile } from "@/types"

const INITIAL_SHOW = 3

interface SidebarProps {
  profile: Profile
  circles: Circle[]
}

export function Sidebar({ profile, circles }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const [expanded, setExpanded] = useState(false)

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Explore", path: "/explore", icon: Compass },
    { label: "Profile", path: "/profile", icon: User },
  ]

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 flex-col fixed inset-y-0 left-0 z-40 border-r border-quiet-border bg-white">
      {/* Branding */}
      <div className="px-5 pt-6 pb-4">
        <h1
          className="text-lg font-semibold text-quiet-slate cursor-pointer"
          onClick={() => navigate("/")}
        >
          Quiet Network
        </h1>
        <p className="text-xs text-quiet-muted mt-0.5">
          Your neighborhood, without the noise
        </p>
      </div>

      {/* Nav links */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? path === "/" || (path !== "/explore" && path !== "/profile" && path !== "/about" && !path.startsWith("/user/"))
              : path === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-quiet-aged text-quiet-slate font-medium"
                  : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Recent circles */}
      {circles.length > 0 && (
        <div className="mt-6 px-3 flex-1 min-h-0 overflow-y-auto">
          <p className="px-3 mb-1.5 text-xs font-medium text-quiet-muted uppercase tracking-wider">
            Recent Circles
          </p>
          <div className="space-y-0.5">
            {(expanded ? circles : circles.slice(0, INITIAL_SHOW)).map((circle) => {
              const isActive = path === `/${circle.slug}`
              return (
                <button
                  key={circle.id}
                  onClick={() => navigate(`/${circle.slug}`)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-quiet-aged text-quiet-slate font-medium"
                      : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
                  }`}
                >
                  <CircleIcon name={circle.name} size="sm" />
                  <span className="truncate">{circle.name}</span>
                </button>
              )
            })}
            {circles.length > INITIAL_SHOW && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                {expanded ? "Show less" : `View all (${circles.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* User info at bottom */}
      <div className="mt-auto border-t border-quiet-border px-4 py-3">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 w-full rounded-lg px-1 py-1 hover:bg-quiet-aged transition-colors"
        >
          <img
            src={avatarUrl(profile.avatar_emoji)}
            alt="avatar"
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-quiet-slate truncate">
              {profile.display_name}
            </p>
            <p className="text-xs text-quiet-muted truncate">
              @{profile.username}
            </p>
          </div>
        </button>
      </div>
    </aside>
  )
}
