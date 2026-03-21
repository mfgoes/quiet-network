'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth, useProfile, useCircles, useAllCircles, useAdminCircles, useNotifications, useUnreadDMCount } from '@/lib/hooks'
import { PublicHomeFeed } from '@/components/PublicHomeFeed'
import { PublicLayout } from '@/components/PublicLayout'
import { Shell } from '@/components/Shell'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { HomeFeed } from '@/components/HomeFeed'
import type { Circle } from '@/types'

interface HomePageClientProps {
  initialCircles: Circle[]
  initialPosts: any[]
}

export function HomePageClient({ initialCircles, initialPosts }: HomePageClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, needsSetup } = useProfile(user?.id)
  const { circles, circleRoles, loading: circlesLoading, joinCircle, leaveCircle, updateCircle, uploadCircleAvatar } = useCircles(user?.id)
  const { allCircles } = useAllCircles()
  const { unreadCount } = useNotifications(user?.id)
  const unreadDmCount = useUnreadDMCount(user?.id)
  const { adminCircles } = useAdminCircles(user?.id)

  const goToLogin = () => router.push('/login')

  // Still loading auth
  if (authLoading || (user && profileLoading)) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  // Unauthenticated: show public home
  if (!user) {
    const displayCircles = allCircles.length > 0 ? allCircles : initialCircles
    return (
      <PublicLayout circles={displayCircles} onSignIn={goToLogin}>
        <PublicHomeFeed circles={displayCircles} />
      </PublicLayout>
    )
  }

  // Profile setup needed
  if (needsSetup) {
    router.push('/profile?setup=1')
    return null
  }

  // Profile failed
  if (!profile) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Something went wrong loading your profile.</p>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}>
          Sign out
        </Button>
      </Shell>
    )
  }

  // Circles loading
  if (circlesLoading) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  // No circles: redirect to explore
  if (circles.length === 0) {
    router.replace('/explore')
    return null
  }

  // Authenticated: show personalized feed
  return (
    <DMProvider userId={user.id}>
      <AppLayout
        profile={profile}
        userId={user.id}
        circles={circles}
        adminCircles={adminCircles}
        unreadCount={unreadCount}
        unreadDmCount={unreadDmCount}
      >
        <HomeFeed circles={circles} userId={user.id} circleRoles={circleRoles} />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
