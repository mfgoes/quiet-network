'use client'

import { Home, Compass, MessageSquare, LogIn } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { JoinBanner } from "@/components/JoinBanner"
import { PublicSidebar } from "@/components/PublicSidebar"
import type { Circle } from "@/types"

function PublicBottomNav({ onSignIn }: { onSignIn: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === "/" || (!pathname.startsWith("/explore") && !pathname.startsWith("/p/"))
  const isExplore = pathname === "/explore"

  const locked = (feature: string) => toast.info(`Sign in to access ${feature}`)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-quiet-border bg-quiet-offwhite md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around py-2">
        <button
          onClick={() => router.push("/")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isHome ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => router.push("/explore")}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${isExplore ? "text-quiet-slate" : "text-quiet-muted"}`}
        >
          <Compass className="h-5 w-5" />
          <span>Explore</span>
        </button>
        <button
          onClick={() => locked("messages")}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-quiet-muted transition-colors"
        >
          <MessageSquare className="h-5 w-5" />
          <span>Messages</span>
        </button>
        <button
          onClick={onSignIn}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-quiet-muted transition-colors"
        >
          <LogIn className="h-5 w-5" />
          <span>Sign in</span>
        </button>
      </div>
    </nav>
  )
}

export function PublicLayout({
  circles,
  onSignIn,
  children,
}: {
  circles: Circle[]
  onSignIn: () => void
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-quiet-offwhite">
      {/* Mobile top bar (logged-out) */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-12 px-4 bg-white border-b border-quiet-border md:hidden">
        <span className="text-sm font-semibold text-quiet-slate">Quiet Network</span>
        <button onClick={onSignIn} className="text-xs text-quiet-accent hover:underline">
          Sign up
        </button>
      </header>
      <PublicSidebar circles={circles} onSignIn={onSignIn} />
      <div className="md:ml-60 lg:ml-64">
        <JoinBanner onJoin={onSignIn} />
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-14 md:pt-6 md:pb-8">
          {children}
        </main>
      </div>
      <PublicBottomNav onSignIn={onSignIn} />
    </div>
  )
}
