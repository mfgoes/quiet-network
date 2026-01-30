import { Home, Compass } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { avatarUrl } from "@/types"

interface BottomNavProps {
  avatar: string
}

export function BottomNav({ avatar }: BottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const isHome = path === "/" || (path !== "/explore" && path !== "/profile" && path !== "/about" && !path.startsWith("/user/"))
  const isExplore = path === "/explore"
  const isProfile = path === "/profile"

  const items: { id: string; label: string; path: string; icon?: typeof Home; avatarImg?: string; active: boolean }[] = [
    { id: "home", label: "Home", path: "/", icon: Home, active: isHome },
    { id: "explore", label: "Explore", path: "/explore", icon: Compass, active: isExplore },
    { id: "profile", label: "Profile", path: "/profile", avatarImg: avatar, active: isProfile },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-quiet-border bg-quiet-offwhite md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around py-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              item.active ? "text-quiet-slate" : "text-quiet-muted"
            }`}
          >
            {item.icon ? (
              <item.icon className="h-5 w-5" />
            ) : (
              <img
                src={avatarUrl(item.avatarImg!)}
                alt="profile"
                className="h-5 w-5 rounded-full object-cover"
              />
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
