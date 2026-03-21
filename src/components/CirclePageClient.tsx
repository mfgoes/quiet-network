'use client'

import { useRouter } from 'next/navigation'
import { useAuth, useProfile, useCircles, useAllCircles, useAdminCircles, useNotifications, useUnreadDMCount } from '@/lib/hooks'
import { CircleFeedRoute, PublicCircleFeedRoute } from '@/components/CircleFeedRoute'
import { PublicLayout } from '@/components/PublicLayout'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'
import type { Circle } from '@/types'

interface CirclePageClientProps {
  circleSlug: string
  initialCircle: Circle
  initialPosts: any[]
}

export function CirclePageClient({ circleSlug, initialCircle, initialPosts }: CirclePageClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const {
    circles,
    circleRoles,
    loading: circlesLoading,
    joinCircle,
    leaveCircle,
    updateCircle,
    uploadCircleAvatar,
  } = useCircles(user?.id)
  const { allCircles } = useAllCircles()
  const { unreadCount } = useNotifications(user?.id)
  const unreadDmCount = useUnreadDMCount(user?.id)
  const { adminCircles } = useAdminCircles(user?.id)

  if (authLoading || (user && profileLoading)) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  if (!user) {
    const displayCircles = allCircles.length > 0 ? allCircles : []
    return (
      <PublicLayout circles={displayCircles} onSignIn={() => router.push('/login')}>
        <PublicCircleFeedRoute onSignIn={() => router.push('/login')} circleSlug={circleSlug} />
      </PublicLayout>
    )
  }

  if (!profile) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

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
        <CircleFeedRoute
          userId={user.id}
          circles={circles}
          memberCircleIds={circles.map((c) => c.id)}
          circleRoles={circleRoles}
          joinCircle={joinCircle}
          leaveCircle={leaveCircle}
          updateCircle={updateCircle}
          uploadCircleAvatar={uploadCircleAvatar}
        />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
