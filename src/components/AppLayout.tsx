'use client'

import { usePathname } from "next/navigation"
import { MobileMenu } from "@/components/MobileMenu"
import { Sidebar } from "@/components/Sidebar"
import type { Circle, CircleRole, Profile } from "@/types"

export function AppLayout({
  profile,
  userId,
  circles,
  adminCircles = [],
  unreadCount = 0,
  unreadDmCount = 0,
  children,
}: {
  profile: Profile
  userId: string
  circles: Circle[]
  adminCircles?: (Circle & { role: CircleRole })[]
  unreadCount?: number
  unreadDmCount?: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  return (
    <div className="min-h-screen bg-quiet-offwhite">
      <MobileMenu profile={profile} circles={circles} adminCircles={adminCircles} />
      <Sidebar profile={profile} userId={userId} circles={circles} adminCircles={adminCircles} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
      <div className="md:ml-60 lg:ml-64">
        <main className={`mx-auto px-4 pb-20 pt-14 md:pb-8 md:pt-8 ${isHome ? "max-w-5xl" : "max-w-3xl"}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
