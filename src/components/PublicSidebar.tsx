'use client'

import { useState } from "react"
import { Home, Compass, Info, LogIn, Search, X, Wrench } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { CircleIcon } from "@/components/CircleIcon"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Explore", path: "/explore", icon: Compass },
  { label: "Watchmakers", path: "/watchmakers", icon: Wrench },
  { label: "About", path: "/about", icon: Info },
]

interface PublicSidebarProps {
  circles: Circle[]
  onSignIn: () => void
}

export function PublicSidebar({ circles, onSignIn }: PublicSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")

  const filteredCircles = query.trim()
    ? circles.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : circles

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
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-quiet-aged text-quiet-slate font-medium"
                  : "text-quiet-muted hover:bg-quiet-aged hover:text-quiet-slate"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Circles list */}
      {circles.length > 0 && (
        <div className="mt-6 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-3">
            <p className="px-3 mb-2 text-xs font-medium text-quiet-muted uppercase tracking-wider">
              Circles
            </p>
            {/* Search */}
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
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="space-y-0.5">
              {filteredCircles.length === 0 ? (
                <p className="px-3 py-2 text-xs text-quiet-muted">No circles found</p>
              ) : (
                filteredCircles.map((circle) => {
                  const isActive = pathname === `/${circle.slug}`
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign-in CTA */}
      <div className="mt-auto border-t border-quiet-border px-4 py-4">
        <Button onClick={onSignIn} className="w-full flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          Sign in / Join
        </Button>
      </div>
    </aside>
  )
}
