'use client'

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useCircleBySlug, useFavorites } from "@/lib/hooks"
import { CircleDropdown } from "@/components/CircleDropdown"
import { CircleFeed } from "@/components/CircleFeed"
import { Button } from "@/components/ui/button"
import type { Circle } from "@/types"

interface CircleFeedRouteProps {
  userId: string
  circles: Circle[]
  memberCircleIds: string[]
  circleRoles?: Record<string, string>
  joinCircle: (circleId: string) => Promise<unknown>
  leaveCircle: (circleId: string) => Promise<unknown>
  updateCircle: (circleId: string, updates: { about?: string | null; rules?: string | null; links?: { label: string; url: string }[] | null; banner_color?: string | null; avatar_url?: string | null }) => Promise<{ data: Circle | null; error: unknown }>
  uploadCircleAvatar: (circleId: string, file: File) => Promise<{ url: string | null; error: unknown }>
}

export function CircleFeedRoute({
  userId,
  circles,
  memberCircleIds,
  circleRoles = {},
  joinCircle,
  leaveCircle,
  updateCircle,
  uploadCircleAvatar,
}: CircleFeedRouteProps) {
  const params = useParams()
  const circleSlug = params.circleSlug as string | undefined
  const { circle, loading, refetch: refetchCircle } = useCircleBySlug(circleSlug)
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const { favoritedCircleIds, toggleFavorite: toggleFavoriteById } = useFavorites(userId)

  const toggleFavorite = useCallback(() => {
    if (!circle) return
    toggleFavoriteById(circle.id)
  }, [circle, toggleFavoriteById])

  const isMember = circle ? memberCircleIds.includes(circle.id) : false
  const isAdminOrMod = circle ? ["admin", "moderator"].includes(circleRoles[circle.id] ?? "") || circle.created_by === userId : false
  const isFavorited = circle ? favoritedCircleIds.includes(circle.id) : false

  if (loading) {
    return <p className="text-center text-sm text-quiet-muted">Loading...</p>
  }

  if (!circle) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">Circle not found.</p>
      </div>
    )
  }

  return (
    <>
      <CircleDropdown
        circles={circles}
        selectedSlug={circleSlug}
        currentCircle={circle}
        favoritedCircleIds={favoritedCircleIds}
        onToggleFavorite={(circleId, e) => {
          e.stopPropagation()
          e.preventDefault()
          toggleFavoriteById(circleId)
        }}
      />
      <div className="mt-4">
        <CircleFeed
          circle={circle}
          userId={userId}
          isMember={isMember}
          isAdminOrMod={isAdminOrMod}
          onJoin={async () => {
            setJoining(true)
            await joinCircle(circle.id)
            setJoining(false)
          }}
          onLeave={async () => {
            await leaveCircle(circle.id)
            router.push("/")
          }}
          joining={joining}
          onUpdateCircle={async (updates) => {
            await updateCircle(circle.id, updates)
            await refetchCircle()
          }}
          onUploadAvatar={async (file) => {
            const result = await uploadCircleAvatar(circle.id, file)
            if (!result.error) await refetchCircle()
            return result
          }}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    </>
  )
}

// ─── Public (unauthenticated) view ───────────────────

export function PublicCircleFeedRoute({ onSignIn, circleSlug: propCircleSlug }: { onSignIn: () => void; circleSlug?: string }) {
  const params = useParams()
  const circleSlug = propCircleSlug ?? (params.circleSlug as string | undefined)
  const { circle, loading } = useCircleBySlug(circleSlug)
  const router = useRouter()

  if (loading) {
    return <p className="text-center text-sm text-quiet-muted">Loading...</p>
  }

  if (!circle) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-center text-sm text-quiet-muted">Circle not found.</p>
      </div>
    )
  }

  return (
    <>
      <CircleFeed
        circle={circle}
        userId=""
        isMember={false}
        isAdminOrMod={false}
        onJoin={async () => { onSignIn() }}
        onLeave={async () => {}}
        joining={false}
        onUpdateCircle={async () => {}}
      />
    </>
  )
}
