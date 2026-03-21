'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth, useProfile, useCircles, useAdminCircles, useNotifications, useUnreadDMCount, usePublicProfile, useUserPosts, usePublicUserCircles } from '@/lib/hooks'
import { PublicProfilePage } from '@/components/PublicProfilePage'
import { PublicLayout } from '@/components/PublicLayout'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'
import { Button } from '@/components/ui/button'
import { useAllCircles } from '@/lib/hooks'

interface UserProfilePageClientProps {
  username: string
}

export function UserProfilePageClient({ username }: UserProfilePageClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile: currentProfile, loading: profileLoading } = useProfile(user?.id)
  const { circles } = useCircles(user?.id)
  const { allCircles } = useAllCircles()
  const { unreadCount } = useNotifications(user?.id)
  const unreadDmCount = useUnreadDMCount(user?.id)
  const { adminCircles } = useAdminCircles(user?.id)

  const { profile: targetProfile, loading: targetLoading } = usePublicProfile(username)
  const { posts, loading: postsLoading } = useUserPosts(
    targetProfile?.posts_public !== false ? targetProfile?.id : undefined
  )
  const { circles: targetCircles } = usePublicUserCircles(targetProfile?.id)

  if (authLoading || (user && profileLoading) || targetLoading) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  if (!targetProfile) {
    return (
      <Shell>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">User not found.</p>
      </Shell>
    )
  }

  const profileContent = (
    <PublicProfilePage
      profile={targetProfile}
      currentUserId={user?.id}
      circles={targetCircles}
      posts={posts}
      postsLoading={postsLoading}
    />
  )

  if (!user) {
    return (
      <PublicLayout circles={allCircles} onSignIn={() => router.push('/login')}>
        {profileContent}
      </PublicLayout>
    )
  }

  if (!currentProfile) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Loading...</p>
      </Shell>
    )
  }

  return (
    <DMProvider userId={user.id}>
      <AppLayout
        profile={currentProfile}
        userId={user.id}
        circles={circles}
        adminCircles={adminCircles}
        unreadCount={unreadCount}
        unreadDmCount={unreadDmCount}
      >
        {profileContent}
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={currentProfile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
