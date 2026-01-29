import { Home, MessageCircle } from "lucide-react"
import { avatarUrl } from "@/types"

export type View = "circles" | "feed" | "profile"

interface BottomNavProps {
  view: View
  onNavigate: (view: View) => void
  avatar: string
  hasActiveCircle?: boolean
}

export function BottomNav({ view, onNavigate, avatar, hasActiveCircle }: BottomNavProps) {
  const items: { id: View; label: string; icon?: typeof Home; avatarImg?: string }[] = [
    { id: "circles", label: "Circles", icon: Home },
    ...(hasActiveCircle
      ? [{ id: "feed" as View, label: "Feed", icon: MessageCircle }]
      : []),
    { id: "profile", label: "Profile", avatarImg: avatar },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-quiet-border bg-quiet-offwhite md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around py-2">
        {items.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                active ? "text-quiet-slate" : "text-quiet-muted"
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
          )
        })}
      </div>
    </nav>
  )
}
