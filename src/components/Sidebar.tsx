'use client'

import { useState } from "react"
import { Home, Compass, Bell, ChevronDown, Shield, Info, MessageSquare, Search, X, Star, Wrench } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { avatarUrl } from "@/types"
import { CircleIcon } from "@/components/CircleIcon"
import { useFavorites } from "@/lib/hooks"
import { useDM } from "@/components/DMContext"
import type { Circle, Profile, CircleRole } from "@/types"

const INITIAL_SHOW = 6
const SEARCH_THRESHOLD = 7

interface SidebarProps {
  profile: Profile
  userId: string
  circles: Circle[]
  adminCircles?: (Circle & { role: CircleRole })[]
  unreadCount?: number
  unreadDmCount?: number
}

export function Sidebar({ profile, userId, circles, adminCircles = [], unreadCount = 0, unreadDmCount = 0 }: SidebarProps) {
  const router = useRouter()
  const path = usePathname()
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)
  const { favoritedCircleIds } = useFavorites(userId)
  const { openPanel } = useDM()
  const favoritedCircles = circles.filter(c => favoritedCircleIds.includes(c.id))
  const [isExpandingCircles, setIsExpandingCircles] = useState(false)

  const showSearch = circles.length > SEARCH_THRESHOLD
  const filteredCircles = query.trim()
    ? circles.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : null  // null = not searching, use normal expand/collapse
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
    { label: "Home", path: "/", icon: Home, badge: 0 },
    { label: "Explore", path: "/explore", icon: Compass, badge: 0 },
    { label: "Watchmakers", path: "/watchmakers", icon: Wrench, badge: 0 },
    { label: "Messages", path: "/messages", icon: MessageSquare, badge: unreadDmCount },
    { label: "Notifications", path: "/notifications", icon: Bell, badge: unreadCount },
    { label: "About", path: "/about", icon: Info, badge: 0 },
  ]

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 flex-col fixed inset-y-0 left-0 z-40 border-r border-quiet-border bg-white">
      {/* Branding */}
      <div className="px-5 pt-6 pb-4">
        <h1
          className="text-lg font-semibold text-quiet-slate cursor-pointer"
          onClick={() => router.push("/")}
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
              ? path === "/" || (path !== "/explore" && path !== "/watchmakers" && path !== "/notifications" && path !== "/profile" && path !== "/about" && !path.startsWith("/user/") && !path.startsWith("/admin/") && !path.startsWith("/messages"))
              : item.path === "/messages" ? path.startsWith("/messages") : path === item.path
          const badgeCount = item.badge ?? 0
          return (
            <button
              key={item.path}
              onClick={() => item.path === "/messages" ? openPanel() : router.push(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-quiet-aged text-quiet-slate font-medium"
                  : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {badgeCount > 0 && (
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white leading-none ${item.path === "/messages" ? "bg-quiet-accent" : "bg-red-500"}`}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Starred circles */}
      {favoritedCircles.length > 0 && (
        <div className="mt-4 px-3">
          <p className="px-3 mb-1.5 flex items-center gap-1.5 text-xs font-medium text-quiet-muted uppercase tracking-wider">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            Starred
          </p>
          <div className="space-y-0.5">
            {favoritedCircles.map((circle) => {
              const isActive = path === `/${circle.slug}`
              return (
                <button
                  key={circle.id}
                  onClick={() => router.push(`/${circle.slug}`)}
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
        </div>
      )}

      {/* Recent circles */}
      {circles.length > 0 && (
        <div className={`${favoritedCircles.length > 0 ? "mt-4" : "mt-6"} flex-1 min-h-0 flex flex-col overflow-hidden`}>
          <div className="px-3">
            <p className="px-3 mb-1.5 text-xs font-medium text-quiet-muted uppercase tracking-wider">
              My Circles
            </p>
            {/* Search — only shown when user has many circles */}
            {showSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-quiet-muted pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search circles…"
                  className="w-full rounded-md border border-quiet-border bg-quiet-offwhite py-1.5 pl-8 pr-7 text-xs text-quiet-slate placeholder:text-quiet-muted focus:outline-none focus:ring-1 focus:ring-quiet-accent"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-quiet-muted hover:text-quiet-slate"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="space-y-0.5">
              {filteredCircles !== null ? (
                /* Search mode: show all matches */
                filteredCircles.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-quiet-muted">No circles found</p>
                ) : (
                  filteredCircles.map((circle) => {
                    const isActive = path === `/${circle.slug}`
                    return (
                      <button
                        key={circle.id}
                        onClick={() => router.push(`/${circle.slug}`)}
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
                  })
                )
              ) : (
                /* Normal mode: show first N + expand toggle */
                <>
                  {circles.slice(0, INITIAL_SHOW).map((circle) => {
                    const isActive = path === `/${circle.slug}`
                    return (
                      <button
                        key={circle.id}
                        onClick={() => router.push(`/${circle.slug}`)}
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
                            onClick={() => router.push(`/${circle.slug}`)}
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
                  {!expanded && isExpandingCircles && <div className="section-collapsing" />}
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
                </>
              )}
            </div>
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
                    onClick={() => router.push(`/admin/${ac.slug}`)}
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
                        onClick={() => router.push(`/admin/${ac.slug}`)}
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

      {/* User info at bottom — click to go to profile */}
      <div className="mt-auto border-t border-quiet-border px-4 py-3">
        <button
          onClick={() => router.push("/profile")}
          title="View your profile"
          className={`flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 transition-colors ${
            path === "/profile"
              ? "bg-quiet-aged text-quiet-slate"
              : "hover:bg-quiet-aged"
          }`}
        >
          <img
            src={avatarUrl(profile.avatar_emoji)}
            alt="avatar"
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0 text-left">
            <p className={`text-sm truncate ${path === "/profile" ? "font-semibold text-quiet-slate" : "font-medium text-quiet-slate"}`}>
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
