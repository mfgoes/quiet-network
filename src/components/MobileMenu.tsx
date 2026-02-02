import { useState } from "react"
import { Menu, X, Home, Compass, User, Info, Shield, ChevronDown } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { avatarUrl } from "@/types"
import { CircleIcon } from "@/components/CircleIcon"
import type { Circle, CircleRole, Profile } from "@/types"

const INITIAL_SHOW = 6

interface MobileMenuProps {
  profile: Profile
  circles: Circle[]
  adminCircles?: (Circle & { role: CircleRole })[]
}

export function MobileMenu({ profile, circles, adminCircles = [] }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const [circlesExpanded, setCirclesExpanded] = useState(false)
  const [isExpandingCircles, setIsExpandingCircles] = useState(false)
  const [adminExpanded, setAdminExpanded] = useState(true)
  const [isExpandingAdmin, setIsExpandingAdmin] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const go = (to: string) => {
    navigate(to)
    setOpen(false)
  }

  const handleToggleCircles = () => {
    if (!circlesExpanded) {
      setIsExpandingCircles(true)
      setCirclesExpanded(true)
      setTimeout(() => setIsExpandingCircles(false), 300)
    } else {
      setIsExpandingCircles(true)
      setTimeout(() => {
        setCirclesExpanded(false)
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

  const isHome = path === "/" || (path !== "/explore" && path !== "/profile" && path !== "/about" && !path.startsWith("/user/") && !path.startsWith("/admin/"))

  const navItems = [
    { label: "Home", path: "/", icon: Home, active: isHome },
    { label: "Explore", path: "/explore", icon: Compass, active: path === "/explore" },
    { label: "Profile", path: "/profile", icon: User, active: path === "/profile" },
    { label: "About", path: "/about", icon: Info, active: path === "/about" },
  ]

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-12 px-3 bg-white border-b border-quiet-border md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1 rounded-lg text-quiet-muted hover:text-quiet-slate hover:bg-quiet-aged transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span
          className="ml-2 text-sm font-semibold text-quiet-slate cursor-pointer"
          onClick={() => go("/")}
        >
          Quiet Network
        </span>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h1 className="text-lg font-semibold text-quiet-slate">Quiet Network</h1>
            <p className="text-xs text-quiet-muted mt-0.5">Your neighborhood, without the noise</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-quiet-muted hover:text-quiet-slate hover:bg-quiet-aged transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Nav links */}
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active
                    ? "bg-quiet-aged text-quiet-slate font-medium"
                    : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Recent Circles */}
          {circles.length > 0 && (
            <div className="mt-6 px-3">
              <p className="px-3 mb-1.5 text-xs font-medium text-quiet-muted uppercase tracking-wider">
                Recent Circles
              </p>
              <div className="space-y-0.5">
                {circles.slice(0, INITIAL_SHOW).map((circle) => {
                  const isActive = path === `/${circle.slug}`
                  return (
                    <button
                      key={circle.id}
                      onClick={() => go(`/${circle.slug}`)}
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
                {circlesExpanded && (
                  <div className={isExpandingCircles ? "section-expanding" : ""}>
                    {circles.slice(INITIAL_SHOW).map((circle) => {
                      const isActive = path === `/${circle.slug}`
                      return (
                        <button
                          key={circle.id}
                          onClick={() => go(`/${circle.slug}`)}
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
                {!circlesExpanded && isExpandingCircles && (
                  <div className="section-collapsing" />
                )}
                {circles.length > INITIAL_SHOW && (
                  <button
                    onClick={handleToggleCircles}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${circlesExpanded ? "rotate-180" : ""}`}
                    />
                    {circlesExpanded ? "Show less" : `View all (${circles.length})`}
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
                  {adminCircles.map((ac) => {
                    const isActive = path === `/admin/${ac.slug}`
                    return (
                      <button
                        key={ac.id}
                        onClick={() => go(`/admin/${ac.slug}`)}
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
              {!adminExpanded && isExpandingAdmin && (
                <div className="section-collapsing" />
              )}
            </div>
          )}
        </div>

        {/* User info at bottom */}
        <div className="mt-auto border-t border-quiet-border px-4 py-3">
          <button
            onClick={() => go("/profile")}
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
      </div>
    </>
  )
}
