'use client'

import { useRouter } from 'next/navigation'
import { useAuth, useProfile, useCircles, useAllCircles, useAdminCircles, useNotifications, useUnreadDMCount } from '@/lib/hooks'
import { ExplorePage } from '@/components/ExplorePage'
import { PublicExplorePage } from '@/components/PublicHomeFeed'
import { PublicLayout } from '@/components/PublicLayout'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'
import type { Circle } from '@/types'

interface ExplorePageClientProps {
  initialCircles: Circle[]
}

export function ExplorePageClient({ initialCircles }: ExplorePageClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const {
    circles,
    circleRoles,
    loading: circlesLoading,
    createCircle,
    joinCircle,
  } = useCircles(user?.id)
  const { allCircles, loading: allCirclesLoading, refetch: refetchAllCircles } = useAllCircles()
  const { unreadCount } = useNotifications(user?.id)
  const unreadDmCount = useUnreadDMCount(user?.id)
  const { adminCircles, refetch: refetchAdminCircles } = useAdminCircles(user?.id)

  if (authLoading || (user && profileLoading)) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  if (!user) {
    const displayCircles = allCircles.length > 0 ? allCircles : initialCircles
    return (
      <PublicLayout circles={displayCircles} onSignIn={() => router.push('/login')}>
        <PublicExplorePage circles={displayCircles} loading={allCirclesLoading} />
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
        <ExplorePage
          circles={circles}
          discoverableCircles={allCircles.filter((ac) => !circles.some((c) => c.id === ac.id))}
          userCountry={profile.country ?? null}
          loading={circlesLoading || allCirclesLoading}
          onSelect={(circle) => router.push(`/${circle.slug}`)}
          onCreate={async (name, desc) => {
            const { data } = await createCircle(name, desc, profile.country ?? null)
            if (data) {
              refetchAllCircles()
              refetchAdminCircles()
              router.push(`/${(data as Circle).slug}`)
            }
          }}
          onJoin={async (circle) => {
            await joinCircle(circle.id)
            refetchAllCircles()
            router.push(`/${circle.slug}`)
          }}
          onSetLocation={() => router.push('/profile?edit=1')}
        />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
