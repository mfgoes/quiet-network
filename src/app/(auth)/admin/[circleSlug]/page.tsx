'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useProfile, useCircles, useAdminCircles, useNotifications, useUnreadDMCount, useAllCircles } from '@/lib/hooks'
import { AdminPanel } from '@/components/AdminPanel'
import { AppLayout } from '@/components/AppLayout'
import { DMProvider } from '@/components/DMContext'
import { DMPanel } from '@/components/DMPanel'
import { BottomNav } from '@/components/BottomNav'
import { Shell } from '@/components/Shell'
import type { Circle } from '@/types'

export default function AdminRoute({ params }: { params: Promise<{ circleSlug: string }> }) {
  const { circleSlug } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const {
    circles,
    updateCircle,
    uploadCircleAvatar,
    deleteCircle,
  } = useCircles(user?.id)
  const { allCircles, refetch: refetchAllCircles } = useAllCircles()
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
        <AdminPanel
          userId={user.id}
          adminCircles={adminCircles}
          circleSlug={circleSlug}
          updateCircle={async (circleId, updates) => {
            const result = await updateCircle(circleId, updates)
            await Promise.all([refetchAllCircles(), refetchAdminCircles()])
            return result
          }}
          uploadCircleAvatar={uploadCircleAvatar}
          deleteCircle={deleteCircle}
        />
      </AppLayout>
      <DMPanel />
      <BottomNav avatar={profile.avatar_emoji} unreadCount={unreadCount} unreadDmCount={unreadDmCount} />
    </DMProvider>
  )
}
