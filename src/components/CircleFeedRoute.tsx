import { useState } from "react"
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
  updateCircle: (circleId: string, updates: { about?: string | null; rules?: string | null }) => Promise<{ data: Circle | null; error: unknown }>
}

export function CircleFeedRoute({
  userId,
  circles,
  memberCircleIds,
  circleRoles = {},
  joinCircle,
  leaveCircle,
  updateCircle,
}: CircleFeedRouteProps) {
  const { circleSlug } = useParams<{ circleSlug: string }>()
  const { circle, loading } = useCircleBySlug(circleSlug)
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)

  const isMember = circle ? memberCircleIds.includes(circle.id) : false
  const isAdminOrMod = circle ? ["admin", "moderator"].includes(circleRoles[circle.id] ?? "") : false

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
      <CircleDropdown circles={circles} selectedSlug={circleSlug} />
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
          }}
        />
      </div>
    </>
  )
}
