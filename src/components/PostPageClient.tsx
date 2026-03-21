'use client'

import { useRouter } from 'next/navigation'
import { useAuth, useProfile, useCircles, useAdminCircles, useNotifications, useUnreadDMCount } from '@/lib/hooks'
import { PostDetailRoute } from '@/components/PostDetailRoute'
import { PublicLayout } from '@/components/PublicLayout'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'
import { useAllCircles } from '@/lib/hooks'

interface PostPageClientProps {
  postId: string
  circleSlug?: string
  initialPost: any
}

export function PostPageClient({ postId, circleSlug, initialPost }: PostPageClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { circles, circleRoles } = useCircles(user?.id)
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
        <PostDetailRoute postId={postId} onJoinClick={() => router.push('/login')} />
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
        <PostDetailRoute
          postId={postId}
          userId={user.id}
          memberCircleIds={circles.map((c) => c.id)}
          circleRoles={circleRoles}
          onJoinClick={() => router.push('/')}
        />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
