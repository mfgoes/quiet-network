import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useCircleBySlug } from "@/lib/hooks"
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
  const { circleSlug } = useParams<{ circleSlug: string }>()
  const { circle, loading, refetch: refetchCircle } = useCircleBySlug(circleSlug)
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)
  const [favoritedCircleIds, setFavoritedCircleIds] = useState<string[]>([])
  const isFirstRender = useRef(true)

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (userId) {
      const storedFavorites = localStorage.getItem(`favorites_${userId}`)
      if (storedFavorites) {
        setFavoritedCircleIds(JSON.parse(storedFavorites))
      }
    }
  }, [userId])

  // Save favorites to localStorage whenever they change (skip first render to avoid overwriting loaded data)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (userId) {
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(favoritedCircleIds))
    }
  }, [favoritedCircleIds, userId])

  const toggleFavorite = useCallback(() => {
    if (!circle) return
    setFavoritedCircleIds(prev => {
      if (prev.includes(circle.id)) {
        return prev.filter(id => id !== circle.id)
      } else {
        return [...prev, circle.id]
      }
    })
  }, [circle])

  const isMember = circle ? memberCircleIds.includes(circle.id) : false
  const isAdminOrMod = circle ? ["admin", "moderator"].includes(circleRoles[circle.id] ?? "") || circle.created_by === userId : false
  const isFavorited = circle ? favoritedCircleIds.includes(circle.id) : false

  if (loading) {
    return <p className="text-center text-sm text-quiet-muted">Loading...</p>
  }

  if (!circle) {
    return (
      <div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
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
          setFavoritedCircleIds(prev => {
            if (prev.includes(circleId)) {
              return prev.filter(id => id !== circleId)
            } else {
              return [...prev, circleId]
            }
          })
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
            navigate("/")
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
