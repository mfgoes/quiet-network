'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useAuth, useProfile, useCircles, useAdminCircles, useNotifications, useUnreadDMCount, useAllCircles } from '@/lib/hooks'
import { ProfilePage } from '@/components/ProfilePage'
import { ProfileSetup } from '@/components/ProfileSetup'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'
import { Button } from '@/components/ui/button'

function ProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, signOut, leaveAllCircles, deleteAccount } = useAuth()
  const {
    profile,
    loading: profileLoading,
    needsSetup,
    updateProfile,
  } = useProfile(user?.id)
  const {
    circles,
    circleRoles,
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
    router.replace('/login')
    return null
  }

  if (needsSetup) {
    return (
      <Shell>
        <ProfileSetup
          onComplete={async (updates) => {
            const { error } = await updateProfile(updates)
            if (error) throw error
            router.push('/')
          }}
        />
      </Shell>
    )
  }

  if (!profile) {
    return (
      <Shell>
        <p className="text-sm text-quiet-muted">Something went wrong loading your profile.</p>
        <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
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
        <ProfilePage
          profile={profile}
          userId={user.id}
          circles={circles}
          defaultEditing={searchParams.get('edit') === '1'}
          onSave={async (updates) => {
            const { error } = await updateProfile(updates)
            if (error) throw error
          }}
          onSignOut={signOut}
          onAbout={() => router.push('/about')}
          onNotificationSettings={() => router.push('/settings/notifications')}
          onLeaveAllCircles={leaveAllCircles}
          onDeleteAccount={deleteAccount}
        />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}

export default function ProfilePageRoute() {
  return (
    <Suspense fallback={<Shell><p className="text-sm text-quiet-muted">Loading...</p></Shell>}>
      <ProfilePageInner />
    </Suspense>
  )
}
