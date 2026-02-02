import { useState } from "react"
import { Home, Compass, User, ChevronDown, Shield, Info } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { avatarUrl } from "@/types"
import { CircleIcon } from "@/components/CircleIcon"
import type { Circle, Profile, CircleRole } from "@/types"

const INITIAL_SHOW = 6

interface SidebarProps {
  profile: Profile
  circles: Circle[]
  adminCircles?: (Circle & { role: CircleRole })[]
}

export function Sidebar({ profile, circles, adminCircles = [] }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const [expanded, setExpanded] = useState(false)
  const [isExpandingCircles, setIsExpandingCircles] = useState(false)
  const [adminExpanded, setAdminExpanded] = useState(true)
  const [isExpandingAdmin, setIsExpandingAdmin] = useState(false)
  const [adminShowAll, setAdminShowAll] = useState(false)

  const handleToggleCircles = () => {
    if (!expanded) {
      setIsExpandingCircles(true)
      setExpanded(true)
      setTimeout(() => setIsExpandingCircles(false), 300)
    } else {
      setIsExpandingCircles(true)
      setTimeout(() => {
        setExpanded(false)
        setIsExpandingCircles(false)
      }, 300)
    }
  }

  const handleToggleAdmin = () => {
    if (!adminExpanded) {
      setIsExpandingAdmin(true)
      setAdminExpanded(true)
      setTimeout(() => setIsExpandingAdmin(false), 300)
    } else {
      setIsExpandingAdmin(true)
      setTimeout(() => {
        setAdminExpanded(false)
        setIsExpandingAdmin(false)
      }, 300)
    }
  }

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Explore", path: "/explore", icon: Compass },
    { label: "Profile", path: "/profile", icon: User },
    { label: "About", path: "/about", icon: Info },
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
              ? path === "/" || (path !== "/explore" && path !== "/profile" && path !== "/about" && !path.startsWith("/user/") && !path.startsWith("/admin/"))
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
            {circles.slice(0, INITIAL_SHOW).map((circle) => {
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
                  <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
                  <span className="truncate">{circle.name}</span>
                </button>
              )
            })}
            {expanded && (
              <div className={isExpandingCircles ? "section-expanding" : ""}>
                {circles.slice(INITIAL_SHOW).map((circle) => {
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
                      <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="sm" />
                      <span className="truncate">{circle.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {!expanded && isExpandingCircles && (
              <div className="section-collapsing" />
            )}
            {circles.length > INITIAL_SHOW && (
              <button
                onClick={handleToggleCircles}
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

      {/* Admin Panels */}
      {adminCircles.length > 0 && (
        <div className="mt-4 px-3">
          <button
            onClick={handleToggleAdmin}
            className="flex w-full items-center gap-1.5 px-3 mb-1.5 text-xs font-medium uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Shield className="h-3 w-3" />
            <span className="flex-1 text-left">Admin Panels</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${adminExpanded ? "rotate-180" : ""}`}
            />
          </button>
          {adminExpanded && (
            <div className={isExpandingAdmin ? "section-expanding" : "space-y-0.5"}>
              {adminCircles.slice(0, 3).map((ac) => {
                const isActive = path === `/admin/${ac.slug}`
                return (
                  <button
                    key={ac.id}
                    onClick={() => navigate(`/admin/${ac.slug}`)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
                    }`}
                  >
                    <CircleIcon name={ac.name} avatarUrl={ac.avatar_url} size="sm" />
                    <span className="truncate flex-1 text-left">{ac.name}</span>
                  </button>
                )
              })}
              {adminShowAll && (
                <div className={isExpandingAdmin ? "section-expanding" : ""}>
                  {adminCircles.slice(3).map((ac) => {
                    const isActive = path === `/admin/${ac.slug}`
                    return (
                      <button
                        key={ac.id}
                        onClick={() => navigate(`/admin/${ac.slug}`)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
                        }`}
                      >
                        <CircleIcon name={ac.name} avatarUrl={ac.avatar_url} size="sm" />
                        <span className="truncate flex-1 text-left">{ac.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {adminCircles.length > 3 && (
                <button
                  onClick={() => setAdminShowAll(!adminShowAll)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${adminShowAll ? "rotate-180" : ""}`}
                  />
                  {adminShowAll ? "Show less" : `View all (${adminCircles.length})`}
                </button>
              )}
            </div>
          )}
          {!adminExpanded && isExpandingAdmin && (
            <div className="section-collapsing" />
          )}
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
