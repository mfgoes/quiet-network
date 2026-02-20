import { useState } from "react"
import { AlertCircle, MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CircleIcon } from "@/components/CircleIcon"
import { getBannerBg } from "@/types"
import type { Circle } from "@/types"

const COUNTRY_LABELS: Record<string, string> = {
  NL: "the Netherlands",
  BE: "Belgium",
  DE: "Germany",
  FR: "France",
  GB: "the UK",
  US: "the US",
  ID: "Indonesia",
  OTHER: "your area",
}

interface CirclePickerProps {
  circles: Circle[]
  discoverableCircles: Circle[]
  userCountry: string | null
  loading: boolean
  onSelect: (circle: Circle) => void
  onCreate: (name: string, description?: string) => Promise<void>
  onJoin: (circle: Circle) => Promise<void>
  onSetLocation: () => void
}

export function CirclePicker({
  circles,
  discoverableCircles,
  userCountry,
  loading,
  onSelect,
  onCreate,
  onJoin,
  onSetLocation,
}: CirclePickerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [showAllOwn, setShowAllOwn] = useState(false)

  const INITIAL_SHOW = 10

  // Local = every circle (joined OR discoverable) matching the user's country
  const joinedIds = new Set(circles.map((c) => c.id))
  const localCircles = userCountry
    ? [...circles, ...discoverableCircles].filter((c) => c.country === userCountry)
    : []
  const otherCircles = userCountry
    ? discoverableCircles.filter((c) => c.country !== userCountry)
    : discoverableCircles

  const visibleCircles = showAllOwn ? circles : circles.slice(0, INITIAL_SHOW)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    await onCreate(name.trim(), description.trim() || undefined)
    setName("")
    setDescription("")
    setShowCreate(false)
    setCreating(false)
  }

  const handleJoin = async (circle: Circle) => {
    setJoiningId(circle.id)
    await onJoin(circle)
    setJoiningId(null)
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-quiet-muted">
        Loading circles...
      </p>
    )
  }

  const countryLabel = userCountry ? (COUNTRY_LABELS[userCountry] ?? userCountry) : null

  return (
    <div className="space-y-6">
      {/* Location prompt — shown at the top when no country is set */}
      {!userCountry && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">
            <button
              onClick={onSetLocation}
              className="font-medium underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              Set your location
            </button>{" "}
            to see local circles first.
          </p>
        </div>
      )}

      {/* Your circles */}
      {circles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-quiet-muted">Your circles</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleCircles.map((circle) => {
              const hint = getBannerBg(circle.banner_color, circle.name)
              return (
                <button
                  key={circle.id}
                  onClick={() => onSelect(circle)}
                  className="relative flex items-center gap-3 rounded-xl border border-quiet-border bg-white p-3 text-left transition-all hover:shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: hint }} />
                  <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="lg" />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-quiet-slate">
                      {circle.name}
                    </span>
                    {(circle.description || circle.about) && (
                      <span className="mt-0.5 block text-xs text-quiet-muted truncate">
                        {circle.description || circle.about}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {circles.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllOwn(!showAllOwn)}
              className="mt-1 text-xs text-quiet-muted hover:text-quiet-slate transition-colors"
            >
              {showAllOwn ? "Show less" : `View more (${circles.length - INITIAL_SHOW} more)`}
            </button>
          )}
        </div>
      )}

      {/* No location set — flat list + prompt */}
      {!userCountry && discoverableCircles.length > 0 && (
        <DiscoverSection
          label="Discover circles"
          circles={discoverableCircles}
          joiningId={joiningId}
          onSelect={onSelect}
          onJoin={handleJoin}
        />
      )}

      {/* Local circles section */}
      {userCountry && localCircles.length > 0 && (
        <DiscoverSection
          label={
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              In {countryLabel}
            </span>
          }
          circles={localCircles}
          joinedIds={joinedIds}
          joiningId={joiningId}
          onSelect={onSelect}
          onJoin={handleJoin}
        />
      )}

      {/* Nudge when no local circles at all */}
      {userCountry && localCircles.length === 0 && (
        <div className="rounded-xl border border-quiet-border bg-white p-4 space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-quiet-slate">
            <MapPin className="h-4 w-4 text-quiet-muted" />
            In {countryLabel}
          </p>
          <p className="text-sm text-quiet-muted">
            No circles in {countryLabel} yet —{" "}
            <button
              className="underline hover:text-quiet-slate transition-colors"
              onClick={() => setShowCreate(true)}
            >
              start one!
            </button>
          </p>
        </div>
      )}

      {/* Other countries — always visible */}
      {userCountry && otherCircles.length > 0 && (
        <DiscoverSection
          label="Everywhere else"
          circles={otherCircles}
          joiningId={joiningId}
          onSelect={onSelect}
          onJoin={handleJoin}
        />
      )}

      {/* Create circle */}
      {!showCreate ? (
        <Button
          variant="outline"
          onClick={() => setShowCreate(true)}
          className="w-full"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {circles.length === 0 && discoverableCircles.length === 0
            ? "Create your first circle"
            : "Create another circle"}
        </Button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-quiet-border bg-white p-4"
        >
          <div>
            <label
              htmlFor="circle-name"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Circle name
            </label>
            <input
              id="circle-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oak Street Neighbors"
              required
              autoFocus
              className="w-full rounded-md border border-quiet-border bg-quiet-offwhite p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="circle-desc"
              className="mb-1 block text-sm text-quiet-muted"
            >
              Tagline (optional)
            </label>
            <input
              id="circle-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A quiet space for..."
              className="w-full rounded-md border border-quiet-border bg-quiet-offwhite p-2.5 text-sm text-quiet-slate focus:border-quiet-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={creating}>
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Shared discoverable circle list ─────────────────

function DiscoverSection({
  label,
  circles,
  joinedIds = new Set(),
  joiningId,
  onSelect,
  onJoin,
}: {
  label: React.ReactNode
  circles: Circle[]
  joinedIds?: Set<string>
  joiningId: string | null
  onSelect: (circle: Circle) => void
  onJoin: (circle: Circle) => Promise<void>
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-quiet-muted">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {circles.map((circle) => {
          const hint = getBannerBg(circle.banner_color, circle.name)
          const isMember = joinedIds.has(circle.id)
          return (
            <div
              key={circle.id}
              className="relative flex items-center gap-3 rounded-xl border border-quiet-border bg-white p-3 overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl" style={{ backgroundColor: hint }} />
              <button
                onClick={() => onSelect(circle)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left transition-all hover:opacity-80"
              >
                <CircleIcon name={circle.name} avatarUrl={circle.avatar_url} size="lg" />
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-quiet-slate">
                    {circle.name}
                  </span>
                  {(circle.description || circle.about) && (
                    <span className="mt-0.5 block text-xs text-quiet-muted truncate">
                      {circle.description || circle.about}
                    </span>
                  )}
                </div>
              </button>
              {isMember ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelect(circle)}
                  className="ml-2 shrink-0 text-quiet-muted"
                >
                  View
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={joiningId === circle.id}
                  onClick={() => onJoin(circle)}
                  className="ml-2 shrink-0"
                >
                  {joiningId === circle.id ? "Joining..." : "Join"}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
