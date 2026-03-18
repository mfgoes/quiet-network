import { Home, Compass, Info, LogIn } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { CircleIcon } from "@/components/CircleIcon"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Explore", path: "/explore", icon: Compass },
  { label: "About", path: "/about", icon: Info },
]

interface PublicSidebarProps {
  circles: Circle[]
  onSignIn: () => void
}

export function PublicSidebar({ circles, onSignIn }: PublicSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

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
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === "/" ? pathname === "/" : pathname === item.path
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
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Circles list */}
      {circles.length > 0 && (
        <div className="mt-6 px-3 flex-1 min-h-0 overflow-y-auto">
          <p className="px-3 mb-1.5 text-xs font-medium text-quiet-muted uppercase tracking-wider">
            Circles
          </p>
          <div className="space-y-0.5">
            {circles.map((circle) => {
              const isActive = pathname === `/${circle.slug}`
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
