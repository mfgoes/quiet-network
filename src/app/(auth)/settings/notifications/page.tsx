'use client'

import { useRouter } from 'next/navigation'
import { useAuth, useProfile, useCircles, useAdminCircles, useNotifications, useUnreadDMCount } from '@/lib/hooks'
import { NotificationSettingsPage } from '@/components/NotificationSettingsPage'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'

export default function NotificationSettingsRoute() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { circles } = useCircles(user?.id)
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
    router.replace('/login')
    return null
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
        <NotificationSettingsPage
          userId={user.id}
          onBack={() => router.push('/profile')}
        />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
